"""Pydantic schemas for authentication."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class TokenResponse(BaseModel):
    """Access token response."""

    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    """Public user representation."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str | None
    role: str

