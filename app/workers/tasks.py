"""Celery task definitions."""

import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import async_session_factory
from app.models import (
    ReconciliationItem,
    ReconciliationMatchType,
    ReconciliationRun,
    ReconciliationStatus,
    Transaction,
)
from app.services.reconciliation import TransactionRecord, reconcile
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

