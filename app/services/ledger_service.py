"""Ledger business logic — list, retrieve, create, and update ledgers."""

import re
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ledger import Ledger
from app.models.transaction import Transaction
from app.schemas.ledgers import LedgerCreate, LedgerDetailRead, LedgerListResponse, LedgerRead, LedgerUpdate


def _slug_code(name: str) -> str:
    slug = re.sub(r"[^A-Za-z0-9]+", "-", name.strip()).strip("-").upper()
    return (slug[:40] if slug else str(uuid4())[:8]).upper()


async def _unique_code(session: AsyncSession, base: str) -> str:
    candidate = base
    suffix = 1
    while True:
        stmt = select(Ledger.id).where(Ledger.code == candidate)
        exists = (await session.execute(stmt)).scalar_one_or_none()
        if exists is None:
            return candidate
        candidate = f"{base[:44]}-{suffix}"
        suffix += 1


class LedgerService:
    """Async ledger CRUD service."""

    @staticmethod
    async def list_ledgers(session: AsyncSession) -> LedgerListResponse:
        stmt = select(Ledger).order_by(Ledger.created_at.desc())
        result = await session.execute(stmt)
        ledgers = list(result.scalars().all())
        items = [LedgerRead.model_validate(ledger) for ledger in ledgers]
        return LedgerListResponse(items=items, total=len(items))

    @staticmethod
    async def get_ledger(session: AsyncSession, ledger_id: UUID) -> LedgerDetailRead | None:
        stmt = select(Ledger).where(Ledger.id == ledger_id)
        ledger = (await session.execute(stmt)).scalar_one_or_none()
        if ledger is None:
            return None

        count_stmt = (
            select(func.count())
            .select_from(Transaction)
            .where(Transaction.ledger_id == ledger_id)
        )
        transaction_count = int((await session.execute(count_stmt)).scalar_one())

        base = LedgerRead.model_validate(ledger)
        return LedgerDetailRead(**base.model_dump(), transaction_count=transaction_count)

    @staticmethod
    async def create_ledger(session: AsyncSession, payload: LedgerCreate) -> LedgerRead:
        code = await _unique_code(session, _slug_code(payload.name))
        ledger = Ledger(
            code=code,
            name=payload.name,
            currency=payload.currency.upper(),
            description=payload.description,
            source_system="api",
        )
        session.add(ledger)
        await session.commit()
        await session.refresh(ledger)
        return LedgerRead.model_validate(ledger)

    @staticmethod
    async def update_ledger(
        session: AsyncSession,
        ledger_id: UUID,
        payload: LedgerUpdate,
    ) -> LedgerRead | None:
        stmt = select(Ledger).where(Ledger.id == ledger_id)
        ledger = (await session.execute(stmt)).scalar_one_or_none()
        if ledger is None:
            return None

        if payload.name is not None:
            ledger.name = payload.name
        if payload.description is not None:
            ledger.description = payload.description

        await session.commit()
        await session.refresh(ledger)
        return LedgerRead.model_validate(ledger)
