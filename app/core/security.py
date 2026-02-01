"""Password hashing utilities."""

import bcrypt


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
