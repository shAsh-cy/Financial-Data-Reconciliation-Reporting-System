"""add reconciliation result tables

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-02-02

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "reconciliation_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("left_ledger_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("right_ledger_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("matched_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "unmatched_left_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "unmatched_right_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column("error_message", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["left_ledger_id"], ["ledgers.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(
            ["right_ledger_id"],
            ["ledgers.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reconciliation_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("left_transaction_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("right_transaction_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("match_type", sa.String(length=20), nullable=False),
        sa.ForeignKeyConstraint(
            ["left_transaction_id"],
            ["transactions.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["right_transaction_id"],
            ["transactions.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["run_id"],
            ["reconciliation_runs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_reconciliation_items_run_id",
        "reconciliation_items",
        ["run_id"],
    )
    op.create_index(
        "ix_reconciliation_items_left_txn",
        "reconciliation_items",
        ["left_transaction_id"],
    )
    op.create_index(
        "ix_reconciliation_items_right_txn",
        "reconciliation_items",
        ["right_transaction_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_reconciliation_items_right_txn", table_name="reconciliation_items")
    op.drop_index("ix_reconciliation_items_left_txn", table_name="reconciliation_items")
    op.drop_index("ix_reconciliation_items_run_id", table_name="reconciliation_items")
    op.drop_table("reconciliation_items")
    op.drop_table("reconciliation_runs")

