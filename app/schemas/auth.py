"""Pydantic schemas for authentication."""

from uuid import UUID

from pydantic import BaseModel, EmailStr


class TokenResponse(BaseModel):
    """Access token response."""

    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    """Public user representation."""

    id: UUID
    email: EmailStr
    full_name: str | None
    role: str

    class Config:
        from_attributes = True

