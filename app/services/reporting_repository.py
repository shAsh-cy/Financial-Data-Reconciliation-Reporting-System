"""Persistence layer for financial reporting.

Uses SQL (via SQLAlchemy) for aggregation where possible.
No business logic here beyond basic aggregation; calculations live in reporting.py.
"""

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transaction import Transaction, TransactionStatus
from app.services.reporting import LiquidityInput, PnLInput


def _as_decimal(value: object | None) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


async def _sum_for_ledgers(
    session: AsyncSession,
    ledger_ids: list[UUID],
    start_date: date | None,
    end_date: date,
) -> Decimal:
    """Sum transaction amounts for given ledgers and period."""
    if not ledger_ids:
        return Decimal("0")

    conditions = [
        Transaction.ledger_id.in_(ledger_ids),
        Transaction.transaction_date <= end_date,
        Transaction.status == TransactionStatus.POSTED.value,
    ]
    if start_date is not None:
        conditions.append(Transaction.transaction_date >= start_date)

    stmt = select(func.coalesce(func.sum(Transaction.amount), 0)).where(*conditions)
    result = await session.execute(stmt)
    return _as_decimal(result.scalar_one())


@dataclass(frozen=True)
class PnLConfig:
    """Configuration for P&L aggregation from ledgers."""

    revenue_ledgers: list[UUID]
    cogs_ledgers: list[UUID]
    operating_expense_ledgers: list[UUID]
    other_income_ledgers: list[UUID]
    other_expense_ledgers: list[UUID]


async def load_pnl_input(
    session: AsyncSession,
    config: PnLConfig,
    start_date: date,
    end_date: date,
) -> PnLInput:
    """Aggregate P&L components from transactions using SQL."""
    revenue = await _sum_for_ledgers(
        session,
        config.revenue_ledgers,
        start_date,
        end_date,
    )
    cogs = await _sum_for_ledgers(
        session,
        config.cogs_ledgers,
        start_date,
        end_date,
    )
    opex = await _sum_for_ledgers(
        session,
        config.operating_expense_ledgers,
        start_date,
        end_date,
    )
    other_income = await _sum_for_ledgers(
        session,
        config.other_income_ledgers,
        start_date,
        end_date,
    )
    other_expenses = await _sum_for_ledgers(
        session,
        config.other_expense_ledgers,
        start_date,
        end_date,
    )

    return PnLInput(
        revenue=revenue,
        cost_of_goods_sold=cogs,
        operating_expenses=opex,
        other_income=other_income,
        other_expenses=other_expenses,
    )


@dataclass(frozen=True)
class LiquidityConfig:
    """Configuration for liquidity aggregation from ledgers."""

    current_asset_ledgers: list[UUID]
    quick_asset_ledgers: list[UUID]
    cash_ledgers: list[UUID]
    current_liability_ledgers: list[UUID]
    short_term_debt_ledgers: list[UUID]


async def load_liquidity_input(
    session: AsyncSession,
    config: LiquidityConfig,
    as_of_date: date,
) -> LiquidityInput:
    """Aggregate liquidity components from transactions using SQL."""
    current_assets = await _sum_for_ledgers(
        session,
        config.current_asset_ledgers,
        start_date=None,
        end_date=as_of_date,
    )
    quick_assets = await _sum_for_ledgers(
        session,
        config.quick_asset_ledgers,
        start_date=None,
        end_date=as_of_date,
    )
    cash = await _sum_for_ledgers(
        session,
        config.cash_ledgers,
        start_date=None,
        end_date=as_of_date,
    )
    current_liabilities = await _sum_for_ledgers(
        session,
        config.current_liability_ledgers,
        start_date=None,
        end_date=as_of_date,
    )
    short_term_debt = await _sum_for_ledgers(
        session,
        config.short_term_debt_ledgers,
        start_date=None,
        end_date=as_of_date,
    )

    return LiquidityInput(
        current_assets=current_assets,
        quick_assets=quick_assets,
        cash_and_equivalents=cash,
        current_liabilities=current_liabilities,
        short_term_debt=short_term_debt,
    )

