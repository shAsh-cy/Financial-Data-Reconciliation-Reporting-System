"""add financial reports table

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-02-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d5e6f7a8b9c0"
down_revision: Union[str, Sequence[str], None] = "c4d5e6f7a8b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "financial_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("report_type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=True),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        # P&L fields
        sa.Column("revenue", sa.Numeric(19, 4), nullable=True),
        sa.Column("cost_of_goods_sold", sa.Numeric(19, 4), nullable=True),
        sa.Column("gross_profit", sa.Numeric(19, 4), nullable=True),
        sa.Column("operating_expenses", sa.Numeric(19, 4), nullable=True),
        sa.Column("operating_income", sa.Numeric(19, 4), nullable=True),
        sa.Column("other_income", sa.Numeric(19, 4), nullable=True),
        sa.Column("other_expenses", sa.Numeric(19, 4), nullable=True),
        sa.Column("net_income", sa.Numeric(19, 4), nullable=True),
        sa.Column("net_margin", sa.Numeric(19, 4), nullable=True),
        # Liquidity fields
        sa.Column("current_assets", sa.Numeric(19, 4), nullable=True),
        sa.Column("quick_assets", sa.Numeric(19, 4), nullable=True),
        sa.Column("cash_and_equivalents", sa.Numeric(19, 4), nullable=True),
        sa.Column("current_liabilities", sa.Numeric(19, 4), nullable=True),
        sa.Column("short_term_debt", sa.Numeric(19, 4), nullable=True),
        sa.Column("current_ratio", sa.Numeric(19, 4), nullable=True),
        sa.Column("quick_ratio", sa.Numeric(19, 4), nullable=True),
        sa.Column("cash_ratio", sa.Numeric(19, 4), nullable=True),
        sa.Column("working_capital", sa.Numeric(19, 4), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_financial_reports_type_period",
        "financial_reports",
        ["report_type", "period_end", "period_start"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_financial_reports_type_period", table_name="financial_reports")
    op.drop_table("financial_reports")
