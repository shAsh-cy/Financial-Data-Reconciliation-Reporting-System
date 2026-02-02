"""Authentication and authorization services."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, verify_password
from app.models.user import User, UserRole


async def authenticate_user(
    session: AsyncSession,
    email: str,
    password: str,
) -> User | None:
    """Return user if credentials are valid, otherwise None."""
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    user: User | None = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    """Load user by ID."""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def create_user_access_token(user: User) -> str:
    """Create JWT access token for a user."""
    return create_access_token(str(user.id))


def user_has_role(user: User, *roles: UserRole) -> bool:
    """Check if user has one of the required roles."""
    if not roles:
        return True
    return UserRole(user.role) in roles

