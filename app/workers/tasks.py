"""Celery task definitions."""

import asyncio
import json
import logging
from datetime import date, datetime, timezone
from uuid import UUID

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import async_session_factory
from app.models import (
    FinancialReport,
    ReconciliationItem,
    ReconciliationMatchType,
    ReconciliationRun,
    ReconciliationStatus,
    ReportStatus,
    ReportType,
    Transaction,
)
from app.services.reconciliation import TransactionRecord, reconcile
from app.services.reporting import calculate_liquidity_ratios, calculate_pnl
from app.services.reporting_repository import (
    LiquidityConfig,
    PnLConfig,
    load_liquidity_input,
    load_pnl_input,
)
from app.workers.celery_app import app

logger = logging.getLogger(__name__)


@app.task
def health_check() -> str:
    """Placeholder task to verify base infrastructure."""
    return "ok"


async def _load_transactions_for_ledger(
    session: AsyncSession,
    ledger_id: UUID,
) -> list[Transaction]:
    stmt = select(Transaction).where(Transaction.ledger_id == ledger_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _to_txn_records(transactions: list[Transaction]) -> list[TransactionRecord]:
    """Convert ORM transactions to plain records via pandas for reconciliation."""
    if not transactions:
        return []

    data = [
        {
            "id": str(tx.id),
            "amount": str(tx.amount),
            "transaction_date": tx.transaction_date.isoformat(),
            "currency": tx.currency,
            "type": tx.type,
            "reference": tx.reference,
            "description": tx.description,
            "external_id": tx.external_id,
        }
        for tx in transactions
    ]

    df = pd.DataFrame(data)

    # Ensure deterministic dtypes / normalization via pandas
    df["amount"] = df["amount"].astype(str)
    df["transaction_date"] = df["transaction_date"].astype(str)
    df["currency"] = df["currency"].astype(str)
    df["type"] = df["type"].astype(str)
    df["external_id"] = df["external_id"].astype(str)

    return list(df.to_dict(orient="records"))  # type: ignore[return-value]


async def _run_reconciliation_async(
    left_ledger_id: UUID,
    right_ledger_id: UUID,
) -> UUID:
    """Core async reconciliation workflow using the pure engine."""
    async with async_session_factory() as session:
        # Create run entry
        run = ReconciliationRun(
            left_ledger_id=left_ledger_id,
            right_ledger_id=right_ledger_id,
            status=ReconciliationStatus.RUNNING.value,
            started_at=datetime.now(timezone.utc),
        )
        session.add(run)
        await session.flush()

        try:
            left_txns = await _load_transactions_for_ledger(session, left_ledger_id)
            right_txns = await _load_transactions_for_ledger(session, right_ledger_id)

            left_records = _to_txn_records(left_txns)
            right_records = _to_txn_records(right_txns)

            result = reconcile(left_records, right_records)

            # Persist summary
            run.matched_count = result.match_count
            run.unmatched_left_count = result.unmatched_left_count
            run.unmatched_right_count = result.unmatched_right_count

            # Map from string IDs back to UUID
            def _parse_id(value: str | None) -> UUID | None:
                return UUID(value) if value else None

            # Persist detailed items
            for match in result.matches:
                item = ReconciliationItem(
                    run_id=run.id,
                    left_transaction_id=_parse_id(match.left.get("id")),  # type: ignore[arg-type]
                    right_transaction_id=_parse_id(match.right.get("id")),  # type: ignore[arg-type]
                    match_type=ReconciliationMatchType.MATCHED.value,
                )
                session.add(item)

            for rec in result.only_left:
                item = ReconciliationItem(
                    run_id=run.id,
                    left_transaction_id=_parse_id(rec.get("id")),  # type: ignore[arg-type]
                    right_transaction_id=None,
                    match_type=ReconciliationMatchType.ONLY_LEFT.value,
                )
                session.add(item)

            for rec in result.only_right:
                item = ReconciliationItem(
                    run_id=run.id,
                    left_transaction_id=None,
                    right_transaction_id=_parse_id(rec.get("id")),  # type: ignore[arg-type]
                    match_type=ReconciliationMatchType.ONLY_RIGHT.value,
                )
                session.add(item)

            run.status = ReconciliationStatus.SUCCEEDED.value
            run.finished_at = datetime.now(timezone.utc)
            await session.commit()
        except Exception as exc:  # pragma: no cover - exercised via Celery
            logger.exception(
                "Reconciliation run failed",
                extra={
                    "left_ledger_id": str(left_ledger_id),
                    "right_ledger_id": str(right_ledger_id),
                    "run_id": str(run.id),
                },
            )
            run.status = ReconciliationStatus.FAILED.value
            run.error_message = str(exc)[:1000]
            run.finished_at = datetime.now(timezone.utc)
            await session.commit()
            raise

        return run.id


@app.task(bind=True, name="reconciliation.run_for_ledgers")
def run_reconciliation_for_ledgers(
    self,
    left_ledger_id: str,
    right_ledger_id: str,
) -> str:
    """
    Celery task to reconcile two ledgers by ID.

    Loads data from the database, uses pandas for normalization and
    the pure reconciliation engine for matching, and persists results.
    """
    run_id = asyncio.run(
        _run_reconciliation_async(UUID(left_ledger_id), UUID(right_ledger_id))
    )
    return str(run_id)


async def _find_existing_report(
    session: AsyncSession,
    report_type: str,
    period_start: date | None,
    period_end: date,
) -> FinancialReport | None:
    """Check for existing successful report (idempotency)."""
    stmt = (
        select(FinancialReport)
        .where(FinancialReport.report_type == report_type)
        .where(FinancialReport.period_end == period_end)
        .where(FinancialReport.status == ReportStatus.SUCCEEDED.value)
    )
    if period_start is not None:
        stmt = stmt.where(FinancialReport.period_start == period_start)
    else:
        stmt = stmt.where(FinancialReport.period_start.is_(None))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _generate_pnl_report_async(
    config_json: str,
    start_date_str: str,
    end_date_str: str,
) -> UUID:
    """Generate P&L report. Idempotent: returns existing report if found."""
    config_dict = json.loads(config_json)
    config = PnLConfig(
        revenue_ledgers=[UUID(u) for u in config_dict["revenue_ledgers"]],
        cogs_ledgers=[UUID(u) for u in config_dict["cogs_ledgers"]],
        operating_expense_ledgers=[UUID(u) for u in config_dict["operating_expense_ledgers"]],
        other_income_ledgers=[UUID(u) for u in config_dict["other_income_ledgers"]],
        other_expense_ledgers=[UUID(u) for u in config_dict["other_expense_ledgers"]],
    )
    start_date = date.fromisoformat(start_date_str)
    end_date = date.fromisoformat(end_date_str)

    async with async_session_factory() as session:
        # Idempotency check
        existing = await _find_existing_report(
            session,
            ReportType.PNL.value,
            start_date,
            end_date,
        )
        if existing:
            logger.info(
                "P&L report already exists",
                extra={
                    "report_id": str(existing.id),
                    "period_start": start_date_str,
                    "period_end": end_date_str,
                },
            )
            return existing.id

        # Create report entry
        report = FinancialReport(
            report_type=ReportType.PNL.value,
            status=ReportStatus.RUNNING.value,
            period_start=start_date,
            period_end=end_date,
            started_at=datetime.now(timezone.utc),
        )
        session.add(report)
        await session.flush()

        try:
            pnl_input = await load_pnl_input(session, config, start_date, end_date)
            pnl_result = calculate_pnl(pnl_input)

            # Persist results
            report.revenue = pnl_result.revenue
            report.cost_of_goods_sold = pnl_result.cost_of_goods_sold
            report.gross_profit = pnl_result.gross_profit
            report.operating_expenses = pnl_result.operating_expenses
            report.operating_income = pnl_result.operating_income
            report.other_income = pnl_result.other_income
            report.other_expenses = pnl_result.other_expenses
            report.net_income = pnl_result.net_income
            report.net_margin = pnl_result.net_margin
            report.status = ReportStatus.SUCCEEDED.value
            report.finished_at = datetime.now(timezone.utc)
            await session.commit()
        except Exception as exc:
            logger.exception(
                "P&L report generation failed",
                extra={
                    "report_id": str(report.id),
                    "period_start": start_date_str,
                    "period_end": end_date_str,
                },
            )
            report.status = ReportStatus.FAILED.value
            report.error_message = str(exc)[:1000]
            report.finished_at = datetime.now(timezone.utc)
            await session.commit()
            raise

        return report.id


async def _generate_liquidity_report_async(
    config_json: str,
    as_of_date_str: str,
) -> UUID:
    """Generate liquidity report. Idempotent: returns existing report if found."""
    config_dict = json.loads(config_json)
    config = LiquidityConfig(
        current_asset_ledgers=[UUID(u) for u in config_dict["current_asset_ledgers"]],
        quick_asset_ledgers=[UUID(u) for u in config_dict["quick_asset_ledgers"]],
        cash_ledgers=[UUID(u) for u in config_dict["cash_ledgers"]],
        current_liability_ledgers=[UUID(u) for u in config_dict["current_liability_ledgers"]],
        short_term_debt_ledgers=[UUID(u) for u in config_dict["short_term_debt_ledgers"]],
    )
    as_of_date = date.fromisoformat(as_of_date_str)

    async with async_session_factory() as session:
        # Idempotency check
        existing = await _find_existing_report(
            session,
            ReportType.LIQUIDITY.value,
            None,
            as_of_date,
        )
        if existing:
            logger.info(
                "Liquidity report already exists",
                extra={
                    "report_id": str(existing.id),
                    "as_of_date": as_of_date_str,
                },
            )
            return existing.id

        # Create report entry
        report = FinancialReport(
            report_type=ReportType.LIQUIDITY.value,
            status=ReportStatus.RUNNING.value,
            period_start=None,
            period_end=as_of_date,
            started_at=datetime.now(timezone.utc),
        )
        session.add(report)
        await session.flush()

        try:
            liq_input = await load_liquidity_input(session, config, as_of_date)
            liq_result = calculate_liquidity_ratios(liq_input)

            # Persist results
            report.current_assets = liq_input.current_assets
            report.quick_assets = liq_input.quick_assets
            report.cash_and_equivalents = liq_input.cash_and_equivalents
            report.current_liabilities = liq_input.current_liabilities
            report.short_term_debt = liq_input.short_term_debt
            report.current_ratio = liq_result.current_ratio
            report.quick_ratio = liq_result.quick_ratio
            report.cash_ratio = liq_result.cash_ratio
            report.working_capital = liq_result.working_capital
            report.status = ReportStatus.SUCCEEDED.value
            report.finished_at = datetime.now(timezone.utc)
            await session.commit()
        except Exception as exc:
            logger.exception(
                "Liquidity report generation failed",
                extra={
                    "report_id": str(report.id),
                    "as_of_date": as_of_date_str,
                },
            )
            report.status = ReportStatus.FAILED.value
            report.error_message = str(exc)[:1000]
            report.finished_at = datetime.now(timezone.utc)
            await session.commit()
            raise

        return report.id


@app.task(bind=True, name="reporting.generate_pnl")
def generate_pnl_report(
    self,
    config_json: str,
    start_date: str,
    end_date: str,
) -> str:
    """
    Celery task to generate P&L report.

    Idempotent: returns existing report ID if one exists for the same period.
    Safe retries: partial writes are rolled back on error.
    """
    report_id = asyncio.run(_generate_pnl_report_async(config_json, start_date, end_date))
    return str(report_id)


@app.task(bind=True, name="reporting.generate_liquidity")
def generate_liquidity_report(
    self,
    config_json: str,
    as_of_date: str,
) -> str:
    """
    Celery task to generate liquidity ratios report.

    Idempotent: returns existing report ID if one exists for the same date.
    Safe retries: partial writes are rolled back on error.
    """
    report_id = asyncio.run(_generate_liquidity_report_async(config_json, as_of_date))
    return str(report_id)

