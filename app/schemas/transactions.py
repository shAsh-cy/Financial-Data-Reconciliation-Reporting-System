"""Schemas for transaction ingestion APIs."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class TransactionIngestItem(BaseModel):
    """Single transaction to be ingested."""

    external_id: str = Field(..., max_length=255)
    transaction_date: date
    amount: Decimal
    currency: str = Field(..., min_length=3, max_length=3)
    type: str = Field(..., pattern="^(debit|credit)$")
    description: str | None = None
    reference: str | None = None


class TransactionIngestRequest(BaseModel):
    """Batch of transactions for a given ledger."""

    ledger_id: UUID
    transactions: list[TransactionIngestItem]

