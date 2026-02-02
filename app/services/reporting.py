"""Financial reporting logic for P&L and liquidity ratios.

This module contains pure calculation logic with no database access.
Persistence and data loading should be handled separately.
"""

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class PnLInput:
    """Inputs for profit & loss calculation (single period)."""

    revenue: Decimal
    cost_of_goods_sold: Decimal = Decimal("0")
    operating_expenses: Decimal = Decimal("0")
    other_income: Decimal = Decimal("0")
    other_expenses: Decimal = Decimal("0")


@dataclass(frozen=True)
class PnLReport:
    """Derived P&L metrics."""

    revenue: Decimal
    cost_of_goods_sold: Decimal
    gross_profit: Decimal
    operating_expenses: Decimal
    operating_income: Decimal
    other_income: Decimal
    other_expenses: Decimal
    net_income: Decimal
    net_margin: Decimal | None  # net_income / revenue


@dataclass(frozen=True)
class LiquidityInput:
    """Inputs for liquidity ratio calculations (as of a date)."""

    current_assets: Decimal
    quick_assets: Decimal
    cash_and_equivalents: Decimal
    current_liabilities: Decimal
    short_term_debt: Decimal = Decimal("0")


@dataclass(frozen=True)
class LiquidityRatios:
    """Standard liquidity ratios and working capital."""

    current_ratio: Decimal | None
    quick_ratio: Decimal | None
    cash_ratio: Decimal | None
    working_capital: Decimal


def calculate_pnl(pnl_in: PnLInput) -> PnLReport:
    """Calculate P&L metrics from aggregated inputs."""
    gross_profit = pnl_in.revenue - pnl_in.cost_of_goods_sold
    operating_income = gross_profit - pnl_in.operating_expenses
    net_income = operating_income + pnl_in.other_income - pnl_in.other_expenses

    if pnl_in.revenue == 0:
        net_margin: Decimal | None = None
    else:
        net_margin = (net_income / pnl_in.revenue).quantize(Decimal("0.0001"))

    return PnLReport(
        revenue=pnl_in.revenue,
        cost_of_goods_sold=pnl_in.cost_of_goods_sold,
        gross_profit=gross_profit,
        operating_expenses=pnl_in.operating_expenses,
        operating_income=operating_income,
        other_income=pnl_in.other_income,
        other_expenses=pnl_in.other_expenses,
        net_income=net_income,
        net_margin=net_margin,
    )


def calculate_liquidity_ratios(liq_in: LiquidityInput) -> LiquidityRatios:
    """Calculate standard liquidity ratios."""
    working_capital = liq_in.current_assets - liq_in.current_liabilities

    if liq_in.current_liabilities == 0:
        current_ratio: Decimal | None = None
        quick_ratio: Decimal | None = None
        cash_ratio: Decimal | None = None
    else:
        current_ratio = (liq_in.current_assets / liq_in.current_liabilities).quantize(
            Decimal("0.0001")
        )
        quick_ratio = (liq_in.quick_assets / liq_in.current_liabilities).quantize(
            Decimal("0.0001")
        )
        cash_ratio = (
            liq_in.cash_and_equivalents / liq_in.current_liabilities
        ).quantize(Decimal("0.0001"))

    return LiquidityRatios(
        current_ratio=current_ratio,
        quick_ratio=quick_ratio,
        cash_ratio=cash_ratio,
        working_capital=working_capital,
    )

