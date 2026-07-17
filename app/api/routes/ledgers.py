"""Ledger CRUD API routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import DbSession, require_roles
from app.models.user import UserRole
from app.schemas.ledgers import LedgerCreate, LedgerDetailRead, LedgerListResponse, LedgerRead, LedgerUpdate
from app.services.ledger_service import LedgerService

router = APIRouter(prefix="/ledgers", tags=["ledgers"])


@router.get("", response_model=LedgerListResponse)
async def list_ledgers(
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> LedgerListResponse:
    """List all ledgers."""
    return await LedgerService.list_ledgers(session)


@router.post("", response_model=LedgerRead, status_code=status.HTTP_201_CREATED)
async def create_ledger(
    payload: LedgerCreate,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN)),
) -> LedgerRead:
    """Create a ledger (admin only)."""
    return await LedgerService.create_ledger(session, payload)


@router.get("/{ledger_id}", response_model=LedgerDetailRead)
async def get_ledger(
    ledger_id: UUID,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER)),
) -> LedgerDetailRead:
    """Get a single ledger with transaction count."""
    ledger = await LedgerService.get_ledger(session, ledger_id)
    if ledger is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ledger not found")
    return ledger


@router.patch("/{ledger_id}", response_model=LedgerRead)
async def update_ledger(
    ledger_id: UUID,
    payload: LedgerUpdate,
    session: DbSession,
    _: None = Depends(require_roles(UserRole.ADMIN)),
) -> LedgerRead:
    """Update ledger name/description (admin only)."""
    ledger = await LedgerService.update_ledger(session, ledger_id, payload)
    if ledger is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ledger not found")
    return ledger
