"""Deterministic synthetic reporting/reconciliation payloads (demo fallback)."""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from app.schemas.reporting import (
    FinancialReportRead,
    ReconciliationItemRead,
    ReconciliationRunRead,
)

DEMO_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


DEMO_RECONCILIATION_RUN_KEYS = (
    "reconciliation-run-demo-1",
    "reconciliation-run-demo-2",
    "reconciliation-run-demo-3",
)


def demo_run_id() -> uuid.UUID:
    """Primary demo reconciliation run id (stable across process restarts)."""
    return uuid.uuid5(DEMO_NS, DEMO_RECONCILIATION_RUN_KEYS[0])


def _demo_reconciliation_run(key: str) -> ReconciliationRunRead:
    rid = uuid.uuid5(DEMO_NS, key)
    left_id = uuid.uuid5(DEMO_NS, "ledger-left")
    right_id = uuid.uuid5(DEMO_NS, "ledger-right")
    if key == "reconciliation-run-demo-1":
        created = datetime(2026, 1, 15, 9, 55, 0, tzinfo=timezone.utc)
        updated = datetime(2026, 1, 15, 10, 2, 30, tzinfo=timezone.utc)
        return ReconciliationRunRead(
            id=rid,
            left_ledger_id=left_id,
            right_ledger_id=right_id,
            status="succeeded",
            created_at=created,
            updated_at=updated,
            started_at=datetime(2026, 1, 15, 10, 0, 0, tzinfo=timezone.utc),
            finished_at=datetime(2026, 1, 15, 10, 2, 30, tzinfo=timezone.utc),
            matched_count=3,
            unmatched_left_count=1,
            unmatched_right_count=1,
            error_message=None,
        )
    if key == "reconciliation-run-demo-2":
        created = datetime(2025, 12, 18, 14, 20, 0, tzinfo=timezone.utc)
        updated = datetime(2025, 12, 18, 14, 24, 10, tzinfo=timezone.utc)
        return ReconciliationRunRead(
            id=rid,
            left_ledger_id=left_id,
            right_ledger_id=right_id,
            status="succeeded",
            created_at=created,
            updated_at=updated,
            started_at=datetime(2025, 12, 18, 14, 21, 0, tzinfo=timezone.utc),
            finished_at=datetime(2025, 12, 18, 14, 24, 10, tzinfo=timezone.utc),
            matched_count=2,
            unmatched_left_count=2,
            unmatched_right_count=3,
            error_message=None,
        )
    created = datetime(2025, 11, 5, 8, 10, 0, tzinfo=timezone.utc)
    updated = datetime(2025, 11, 5, 8, 11, 45, tzinfo=timezone.utc)
    return ReconciliationRunRead(
        id=rid,
        left_ledger_id=left_id,
        right_ledger_id=right_id,
        status="failed",
        created_at=created,
        updated_at=updated,
        started_at=datetime(2025, 11, 5, 8, 10, 30, tzinfo=timezone.utc),
        finished_at=datetime(2025, 11, 5, 8, 11, 45, tzinfo=timezone.utc),
        matched_count=1,
        unmatched_left_count=1,
        unmatched_right_count=1,
        error_message="Demo: upstream connector timeout (synthetic).",
    )


def demo_reconciliation_runs() -> list[ReconciliationRunRead]:
    runs = [_demo_reconciliation_run(k) for k in DEMO_RECONCILIATION_RUN_KEYS]
    return sorted(
        runs,
        key=lambda r: r.started_at or r.created_at,
        reverse=True,
    )


def demo_reconciliation_run_by_id(run_id: uuid.UUID) -> ReconciliationRunRead | None:
    for r in demo_reconciliation_runs():
        if r.id == run_id:
            return r
    return None


def _item_specs_for_run(run_key: str) -> list[tuple[str, str | None, str | None, str, str]]:
    if run_key == "reconciliation-run-demo-1":
        return [
            ("rec-1-m1", "txn-L1", "txn-R1", "matched", "12500.00"),
            ("rec-1-m2", "txn-L2", "txn-R2", "matched", "8200.50"),
            ("rec-1-L", "txn-L3", None, "only_left", "4300.00"),
            ("rec-1-R", None, "txn-R4", "only_right", "990.25"),
            ("rec-1-m3", "txn-L5", "txn-R5", "matched", "25600.00"),
        ]
    if run_key == "reconciliation-run-demo-2":
        return [
            ("rec-2-m1", "txn-2-L1", "txn-2-R1", "matched", "3100.00"),
            ("rec-2-m2", "txn-2-L2", "txn-2-R2", "matched", "18750.75"),
            ("rec-2-L1", "txn-2-L3", None, "only_left", "500.00"),
            ("rec-2-L2", "txn-2-L4", None, "only_left", "12000.00"),
            ("rec-2-R1", None, "txn-2-R3", "only_right", "640.10"),
            ("rec-2-R2", None, "txn-2-R4", "only_right", "210.00"),
            ("rec-2-R3", None, "txn-2-R5", "only_right", "88.90"),
        ]
    return [
        ("rec-3-m1", "txn-3-L1", "txn-3-R1", "matched", "45000.00"),
        ("rec-3-L", "txn-3-L2", None, "only_left", "275.00"),
        ("rec-3-R", None, "txn-3-R2", "only_right", "1100.00"),
    ]


def demo_reconciliation_items(run_id: uuid.UUID) -> list[ReconciliationItemRead]:
    run_key: str | None = None
    for k in DEMO_RECONCILIATION_RUN_KEYS:
        if uuid.uuid5(DEMO_NS, k) == run_id:
            run_key = k
            break
    if run_key is None:
        return []
    rid = uuid.uuid5(DEMO_NS, run_key)
    items: list[ReconciliationItemRead] = []
    for key, lk, rk, mt, amt in _item_specs_for_run(run_key):
        items.append(
            ReconciliationItemRead(
                id=uuid.uuid5(DEMO_NS, key),
                run_id=rid,
                left_transaction_id=uuid.uuid5(DEMO_NS, lk) if lk else None,
                right_transaction_id=uuid.uuid5(DEMO_NS, rk) if rk else None,
                match_type=mt,
                amount=Decimal(amt),
            )
        )
    return items


def demo_reconciliation_item_counts(run_id: uuid.UUID) -> dict[str, int]:
    counts: dict[str, int] = {}
    for it in demo_reconciliation_items(run_id):
        counts[it.match_type] = counts.get(it.match_type, 0) + 1
    return counts


def _pnl_demo(
    *,
    key: str,
    period_end: date,
    revenue: str,
    cogs: str,
    opex: str,
    other_exp: str,
    net_income: str,
    net_margin: str,
    started: datetime,
) -> FinancialReportRead:
    rep_id = uuid.uuid5(DEMO_NS, key)
    gross = Decimal(revenue) - Decimal(cogs)
    return FinancialReportRead(
        id=rep_id,
        report_type="pnl",
        status="succeeded",
        period_start=date(period_end.year, period_end.month, 1),
        period_end=period_end,
        started_at=started,
        finished_at=started + timedelta(seconds=5),
        error_message=None,
        revenue=Decimal(revenue),
        cost_of_goods_sold=Decimal(cogs),
        gross_profit=gross,
        operating_expenses=Decimal(opex),
        operating_income=gross - Decimal(opex),
        other_income=Decimal("1500.0000"),
        other_expenses=Decimal(other_exp),
        net_income=Decimal(net_income),
        net_margin=Decimal(net_margin),
        current_assets=None,
        quick_assets=None,
        cash_and_equivalents=None,
        current_liabilities=None,
        short_term_debt=None,
        current_ratio=None,
        quick_ratio=None,
        cash_ratio=None,
        working_capital=None,
    )


def demo_financial_reports() -> list[FinancialReportRead]:
    liq_id = uuid.uuid5(DEMO_NS, "report-liquidity-demo")
    reports: list[FinancialReportRead] = [
        _pnl_demo(
            key="report-pnl-demo-2026-01",
            period_end=date(2026, 1, 31),
            revenue="485000.0000",
            cogs="192000.0000",
            opex="118500.0000",
            other_exp="8200.0000",
            net_income="168800.0000",
            net_margin="0.3480",
            started=datetime(2026, 2, 1, 9, 0, 0, tzinfo=timezone.utc),
        ),
        _pnl_demo(
            key="report-pnl-demo-2025-12",
            period_end=date(2025, 12, 31),
            revenue="462000.0000",
            cogs="188000.0000",
            opex="112400.0000",
            other_exp="7600.0000",
            net_income="156500.0000",
            net_margin="0.3387",
            started=datetime(2026, 1, 3, 9, 0, 0, tzinfo=timezone.utc),
        ),
        _pnl_demo(
            key="report-pnl-demo-2025-11",
            period_end=date(2025, 11, 30),
            revenue="441000.0000",
            cogs="181000.0000",
            opex="108200.0000",
            other_exp="7100.0000",
            net_income="144200.0000",
            net_margin="0.3270",
            started=datetime(2025, 12, 4, 9, 0, 0, tzinfo=timezone.utc),
        ),
        FinancialReportRead(
            id=liq_id,
            report_type="liquidity",
            status="succeeded",
            period_start=None,
            period_end=date(2026, 1, 31),
            started_at=datetime(2026, 2, 1, 9, 5, 0, tzinfo=timezone.utc),
            finished_at=datetime(2026, 2, 1, 9, 5, 4, tzinfo=timezone.utc),
            error_message=None,
            revenue=None,
            cost_of_goods_sold=None,
            gross_profit=None,
            operating_expenses=None,
            operating_income=None,
            other_income=None,
            other_expenses=None,
            net_income=None,
            net_margin=None,
            current_assets=Decimal("210000.0000"),
            quick_assets=Decimal("165000.0000"),
            cash_and_equivalents=Decimal("72000.0000"),
            current_liabilities=Decimal("95000.0000"),
            short_term_debt=Decimal("12000.0000"),
            current_ratio=Decimal("2.2105"),
            quick_ratio=Decimal("1.7368"),
            cash_ratio=Decimal("0.7579"),
            working_capital=Decimal("115000.0000"),
        ),
    ]
    return sorted(reports, key=lambda r: (r.period_end, r.report_type), reverse=True)


def demo_financial_report_by_id(report_id: uuid.UUID) -> FinancialReportRead | None:
    for r in demo_financial_reports():
        if r.id == report_id:
            return r
    return None
