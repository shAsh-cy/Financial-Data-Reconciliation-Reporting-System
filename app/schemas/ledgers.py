"""Pydantic schemas for ledger CRUD."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LedgerCreate(BaseModel):
    """Request body for creating a ledger."""

    name: str = Field(min_length=1, max_length=255)
    currency: str = Field(min_length=3, max_length=3, pattern=r"^[A-Z]{3}$")
    description: str | None = None


class LedgerUpdate(BaseModel):
    """Request body for updating a ledger."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None


class LedgerRead(BaseModel):
    """Public ledger representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    currency: str
    description: str | None
    created_at: datetime


class LedgerDetailRead(LedgerRead):
    """Ledger with aggregate transaction count."""

    transaction_count: int


class LedgerListResponse(BaseModel):
    """Paginated ledger list."""

    items: list[LedgerRead]
    total: int
