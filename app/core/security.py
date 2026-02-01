"""Security utilities: password hashing and JWT authentication."""

from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
import jwt

from app.core.config import settings


def hash_password(plain_password: str) -> str:
    """Hash a plain password using bcrypt (cost factor 12)."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(
        plain_password.encode("utf-8"),
        salt,
    ).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def create_access_token(
    subject: str | Any,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token.

    Args:
        subject: Token subject (e.g. user id).
        expires_delta: Optional custom expiration. Defaults to
            JWT_ACCESS_TOKEN_EXPIRE_MINUTES from config.

    Returns:
        Encoded JWT string.

    Raises:
        ValueError: If JWT_SECRET_KEY is not configured.
    """
    auth = settings.auth
    if not auth.SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY must be configured")

    now = datetime.now(timezone.utc)
    if expires_delta is None:
        expires_delta = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "exp": now + expires_delta,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(
        payload,
        auth.SECRET_KEY,
        algorithm=auth.ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT access token.

    Args:
        token: Encoded JWT string.

    Returns:
        Decoded payload dict (includes 'sub', 'exp', 'iat').

    Raises:
        jwt.ExpiredSignatureError: Token has expired.
        jwt.InvalidTokenError: Token is invalid or malformed.
        ValueError: If JWT_SECRET_KEY is not configured.
    """
    auth = settings.auth
    if not auth.SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY must be configured")

    payload = jwt.decode(
        token,
        auth.SECRET_KEY,
        algorithms=[auth.ALGORITHM],
    )
    return payload
