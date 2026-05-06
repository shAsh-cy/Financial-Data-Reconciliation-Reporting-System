"""Assemble structured detail payloads (summary, timeseries, breakdown) for reporting APIs."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import reporting_queries as rq
from app.schemas.reporting import (
    FinancialReportRead,
    ReconciliationBreakdownSlice,
    ReconciliationDetailPayload,
    ReconciliationDetailSummary,
    ReconciliationDetailTimeseriesPoint,
    ReconciliationRunRead,
    ReportBreakdownSlice,
    ReportDetailPayload,
    ReportDetailSummary,
    ReportDetailTimeseriesPoint,
    ReportStatementLine,
)
from app.services.reporting_demo import (
    demo_financial_reports,
    demo_reconciliation_item_counts,
    demo_reconciliation_runs,
)
from app.services.reporting_mappers import financial_report_from_orm, reconciliation_run_from_orm


def _expenses(r: FinancialReportRead) -> Decimal | None:
    if r.report_type != "pnl":
        return None
    cogs = r.cost_of_goods_sold or Decimal(0)
    opex = r.operating_expenses or Decimal(0)
    other = r.other_expenses or Decimal(0)
    return cogs + opex + other


def _gross_margin_pct(r: FinancialReportRead) -> Decimal | None:
    if r.report_type != "pnl" or not r.revenue or r.revenue == 0:
        return None
    cogs = r.cost_of_goods_sold or Decimal(0)
    return ((r.revenue - cogs) / r.revenue * Decimal(100)).quantize(Decimal("0.0001"))


def _net_margin_pct(r: FinancialReportRead) -> Decimal | None:
    if r.report_type != "pnl" or not r.revenue or r.revenue == 0 or r.net_income is None:
        return None
    return (r.net_income / r.revenue * Decimal(100)).quantize(Decimal("0.0001"))


def _statement_lines_pnl(r: FinancialReportRead) -> list[ReportStatementLine]:
    return [
        ReportStatementLine(label="Revenue", amount=r.revenue, line_kind="revenue"),
        ReportStatementLine(label="Cost of goods sold", amount=r.cost_of_goods_sold, line_kind="expense"),
        ReportStatementLine(label="Gross profit", amount=r.gross_profit, line_kind="subtotal"),
        ReportStatementLine(label="Operating expenses", amount=r.operating_expenses, line_kind="expense"),
        ReportStatementLine(label="Operating income", amount=r.operating_income, line_kind="subtotal"),
        ReportStatementLine(label="Other income", amount=r.other_income, line_kind="revenue"),
        ReportStatementLine(label="Other expenses", amount=r.other_expenses, line_kind="expense"),
        ReportStatementLine(label="Net income", amount=r.net_income, line_kind="subtotal"),
    ]


def _statement_lines_liq(r: FinancialReportRead) -> list[ReportStatementLine]:
    return [
        ReportStatementLine(label="Current assets", amount=r.current_assets, line_kind="metric"),
        ReportStatementLine(label="Quick assets", amount=r.quick_assets, line_kind="metric"),
        ReportStatementLine(label="Cash & equivalents", amount=r.cash_and_equivalents, line_kind="metric"),
        ReportStatementLine(label="Current liabilities", amount=r.current_liabilities, line_kind="metric"),
        ReportStatementLine(label="Short-term debt", amount=r.short_term_debt, line_kind="metric"),
        ReportStatementLine(label="Working capital", amount=r.working_capital, line_kind="subtotal"),
        ReportStatementLine(label="Current ratio", amount=r.current_ratio, line_kind="ratio"),
        ReportStatementLine(label="Quick ratio", amount=r.quick_ratio, line_kind="ratio"),
        ReportStatementLine(label="Cash ratio", amount=r.cash_ratio, line_kind="ratio"),
    ]


def _report_insights(r: FinancialReportRead) -> list[str]:
    insights: list[str] = []
    if r.report_type == "pnl":
        rev = r.revenue or Decimal(0)
        te = _expenses(r) or Decimal(0)
        if rev > 0 and te / rev > Decimal("0.92"):
            insights.append("Operating cost ratio is elevated relative to revenue.")
        nm = _net_margin_pct(r)
        if nm is not None and nm < Decimal("5"):
            insights.append("Net margin is below 5% — review expense drivers.")
    elif r.report_type == "liquidity":
        if r.current_ratio is not None and r.current_ratio < Decimal("1.2"):
            insights.append("Current ratio is tight — monitor short-term liquidity.")
        if r.quick_ratio is not None and r.quick_ratio < Decimal("1.0"):
            insights.append("Quick ratio below 1.0 — liquid coverage may be insufficient.")
    return insights


def _pnl_breakdown(snapshot: FinancialReportRead) -> list[ReportBreakdownSlice]:
    out: list[ReportBreakdownSlice] = []
    if snapshot.revenue and snapshot.revenue > 0:
        rev = snapshot.revenue
        out.extend(
            [
                ReportBreakdownSlice(
                    name="Enterprise",
                    amount=(rev * Decimal("0.55")).quantize(Decimal("0.0001")),
                    segment="revenue",
                ),
                ReportBreakdownSlice(
                    name="Mid-market",
                    amount=(rev * Decimal("0.30")).quantize(Decimal("0.0001")),
                    segment="revenue",
                ),
                ReportBreakdownSlice(
                    name="Self-serve",
                    amount=(rev * Decimal("0.15")).quantize(Decimal("0.0001")),
                    segment="revenue",
                ),
            ]
        )
    if snapshot.cost_of_goods_sold:
        out.append(
            ReportBreakdownSlice(name="COGS", amount=snapshot.cost_of_goods_sold, segment="expense"),
        )
    if snapshot.operating_expenses:
        out.append(
            ReportBreakdownSlice(
                name="Operating expenses",
                amount=snapshot.operating_expenses,
                segment="expense",
            ),
        )
    if snapshot.other_expenses:
        out.append(
            ReportBreakdownSlice(name="Other expenses", amount=snapshot.other_expenses, segment="expense"),
        )
    return out


def _liquidity_breakdown(snapshot: FinancialReportRead) -> list[ReportBreakdownSlice]:
    cash = snapshot.cash_and_equivalents or Decimal(0)
    qa = snapshot.quick_assets or Decimal(0)
    ca = snapshot.current_assets or Decimal(0)
    non_cash_quick = max(qa - cash, Decimal(0))
    other_ca = max(ca - qa, Decimal(0))
    out: list[ReportBreakdownSlice] = []
    if snapshot.cash_and_equivalents is not None:
        out.append(
            ReportBreakdownSlice(
                name="Cash & equivalents",
                amount=snapshot.cash_and_equivalents,
                segment="liquidity",
            ),
        )
    if non_cash_quick > 0:
        out.append(
            ReportBreakdownSlice(
                name="Quick assets (ex cash)",
                amount=non_cash_quick,
                segment="liquidity",
            ),
        )
    if other_ca > 0:
        out.append(
            ReportBreakdownSlice(
                name="Other current assets",
                amount=other_ca,
                segment="liquidity",
            ),
        )
    return out


async def build_report_detail_payload(
    session: AsyncSession,
    snapshot: FinancialReportRead,
    *,
    is_demo: bool,
) -> ReportDetailPayload:
    if snapshot.report_type == "pnl":
        statement = _statement_lines_pnl(snapshot)
        total_exp = _expenses(snapshot)
        gm = _gross_margin_pct(snapshot)
        nm = _net_margin_pct(snapshot)
        if is_demo:
            series = sorted(
                (
                    x
                    for x in demo_financial_reports()
                    if x.report_type == "pnl" and x.status == "succeeded"
                ),
                key=lambda x: x.period_end,
            )
        else:
            rows = await rq.list_succeeded_pnl_reports_asc(session, limit=48)
            series = [financial_report_from_orm(x) for x in rows]
            ids: set[UUID] = {x.id for x in series}
            if snapshot.id not in ids and snapshot.status == "succeeded":
                series.append(snapshot)
                series.sort(key=lambda x: x.period_end)
        timeseries = [
            ReportDetailTimeseriesPoint(
                period_end=x.period_end,
                revenue=x.revenue,
                expenses=_expenses(x),
                net_income=x.net_income,
                cashflow=x.net_income,
            )
            for x in series
        ]
        breakdown = _pnl_breakdown(snapshot)
    elif snapshot.report_type == "liquidity":
        statement = _statement_lines_liq(snapshot)
        total_exp = None
        gm = None
        nm = None
        timeseries = []
        breakdown = _liquidity_breakdown(snapshot)
    else:
        statement = []
        total_exp = None
        gm = None
        nm = None
        timeseries = []
        breakdown = []

    summary = ReportDetailSummary(
        snapshot=snapshot,
        total_expenses=total_exp,
        gross_margin_pct=gm,
        net_margin_pct=nm,
        statement_lines=statement,
        quick_insights=_report_insights(snapshot),
    )
    return ReportDetailPayload(summary=summary, timeseries=timeseries, breakdown=breakdown)


def _period_label(run: ReconciliationRunRead) -> str:
    ts: datetime | None = run.finished_at or run.started_at or run.created_at
    if ts:
        return ts.strftime("%Y-%m-%d %H:%M UTC")
    return str(run.id)[:8]


def _line_counts_or_run(
    run: ReconciliationRunRead,
    counts: dict[str, int],
) -> tuple[int, int]:
    item_matched = int(counts.get("matched", 0))
    item_unmatched = int(counts.get("only_left", 0)) + int(counts.get("only_right", 0))
    if item_matched + item_unmatched > 0:
        return item_matched, item_unmatched
    return int(run.matched_count), int(run.unmatched_left_count + run.unmatched_right_count)


async def build_reconciliation_detail_payload(
    session: AsyncSession,
    run: ReconciliationRunRead,
    *,
    is_demo: bool,
) -> ReconciliationDetailPayload:
    if is_demo:
        counts = demo_reconciliation_item_counts(run.id)
        chron_rows = demo_reconciliation_runs()
    else:
        counts = await rq.count_reconciliation_items_by_match_type(session, run.id)
        db_rows = await rq.list_reconciliation_runs_chronological(session, limit=24)
        chron_rows = [reconciliation_run_from_orm(r) for r in db_rows]

    matched_lines, unmatched_lines = _line_counts_or_run(run, counts)
    total_lines = matched_lines + unmatched_lines
    mismatch_rate: Decimal | None = None
    if total_lines > 0:
        mismatch_rate = (
            Decimal(unmatched_lines) / Decimal(total_lines) * Decimal(100)
        ).quantize(Decimal("0.01"))

    insights: list[str] = []
    if mismatch_rate is not None and mismatch_rate > Decimal("15"):
        insights.append("Unmatched lines exceed 15% — prioritize exception review.")
    if run.status == "failed":
        insights.append("Run failed — inspect error message and ledger inputs.")

    summary = ReconciliationDetailSummary(
        run=run,
        matched_lines=matched_lines,
        unmatched_lines=unmatched_lines,
        mismatch_rate_pct=mismatch_rate,
        by_match_type=dict(counts),
        quick_insights=insights,
    )

    chron_sorted = sorted(
        chron_rows,
        key=lambda x: x.finished_at or x.started_at or x.created_at,
    )
    timeseries = [
        ReconciliationDetailTimeseriesPoint(
            run_id=x.id,
            period_label=_period_label(x),
            matched_count=x.matched_count,
            unmatched_count=x.unmatched_count,
            status=x.status,
        )
        for x in chron_sorted
    ]

    if counts:
        breakdown = [
            ReconciliationBreakdownSlice(match_type=k, count=int(v))
            for k, v in sorted(counts.items(), key=lambda kv: kv[0])
        ]
    else:
        breakdown = [
            ReconciliationBreakdownSlice(match_type="matched", count=run.matched_count),
            ReconciliationBreakdownSlice(
                match_type="only_left",
                count=run.unmatched_left_count,
            ),
            ReconciliationBreakdownSlice(
                match_type="only_right",
                count=run.unmatched_right_count,
            ),
        ]

    return ReconciliationDetailPayload(
        summary=summary,
        timeseries=timeseries,
        breakdown=breakdown,
    )
