"""Integration test for reconciliation task (DB + pure engine)."""

import asyncio
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import session as db_session_module
from app.models import Ledger, ReconciliationRun, Transaction
from app.workers.tasks import _run_reconciliation_async


@pytest.mark.integration
@pytest.mark.asyncio
async def test_reconciliation_task_persists_run_and_items(
    db_url: str,
    create_tables,
) -> None:
    """
    Run reconciliation workflow against real DB.
    Verifies run is created, status is succeeded, and match items are persisted.
    """
    engine = create_async_engine(db_url, echo=False, pool_pre_ping=True)
    factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with factory() as session:
        # Create two ledgers with matching and unmatched transactions
        left_ledger = Ledger(code="LEFT-01", name="Left Ledger", currency="USD", source_system="test")
        right_ledger = Ledger(code="RIGHT-01", name="Right Ledger", currency="USD", source_system="test")
        session.add(left_ledger)
        session.add(right_ledger)
        await session.flush()

        # Left: 2 transactions (one will match, one only-left)
        # Right: 2 transactions (one will match, one only-right)
        left_tx1 = Transaction(
            ledger_id=left_ledger.id,
            external_id="L1",
            transaction_date=date(2024, 1, 15),
            amount=Decimal("100.00"),
            currency="USD",
            type="debit",
            reference="INV-001",
            description="Invoice 1",
            status="posted",
        )
        left_tx2 = Transaction(
            ledger_id=left_ledger.id,
            external_id="L2",
            transaction_date=date(2024, 1, 16),
            amount=Decimal("200.00"),
            currency="USD",
            type="debit",
            reference="INV-002",
            description="Invoice 2",
            status="posted",
        )
        right_tx1 = Transaction(
            ledger_id=right_ledger.id,
            external_id="R1",
            transaction_date=date(2024, 1, 15),
            amount=Decimal("100.00"),
            currency="USD",
            type="debit",
            reference="INV-001",
            description="Invoice 1",
            status="posted",
        )
        right_tx2 = Transaction(
            ledger_id=right_ledger.id,
            external_id="R2",
            transaction_date=date(2024, 1, 17),
            amount=Decimal("300.00"),
            currency="USD",
            type="debit",
            reference="INV-003",
            description="Invoice 3",
            status="posted",
        )
        session.add_all([left_tx1, left_tx2, right_tx1, right_tx2])
        await session.commit()

    # Patch session factory so task uses our test engine
    original_factory = db_session_module.async_session_factory
    test_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    db_session_module.async_session_factory = test_factory

    try:
        run_id = asyncio.run(
            _run_reconciliation_async(left_ledger.id, right_ledger.id)
        )
    finally:
        db_session_module.async_session_factory = original_factory

    assert run_id is not None

    # Verify run and items in DB
    async with factory() as session:
        from sqlalchemy import select

        stmt = select(ReconciliationRun).where(ReconciliationRun.id == run_id)
        result = await session.execute(stmt)
        run = result.scalar_one_or_none()

    assert run is not None
    assert run.status == "succeeded"
    assert run.matched_count == 1
    assert run.unmatched_left_count == 1
    assert run.unmatched_right_count == 1

    await engine.dispose()
