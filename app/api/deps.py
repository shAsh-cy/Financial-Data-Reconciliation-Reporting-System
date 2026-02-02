"""Shared API dependencies (DB session, auth, role checks)."""

from typing import Annotated, Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database.session import get_session
from app.models.user import User, UserRole
from app.schemas import UserRead
from app.services.auth import get_user_by_id, user_has_role


DbSession = Annotated[AsyncSession, Depends(get_session)]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: DbSession,
) -> User:
    """Resolve current user from JWT access token."""
    unauthorized_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
    except Exception:
        raise unauthorized_exc

    sub = payload.get("sub")
    if not sub:
        raise unauthorized_exc

    try:
        user_id = UUID(str(sub))
    except ValueError:
        raise unauthorized_exc

    user = await get_user_by_id(session, user_id)
    if user is None or not user.is_active:
        raise unauthorized_exc

    return user


async def get_current_user_read(user: Annotated[User, Depends(get_current_user)]) -> UserRead:
    """Return a `UserRead` schema for current user."""
    return UserRead.model_validate(user)


def require_roles(*roles: UserRole) -> Callable[[User], User]:
    """Dependency factory enforcing that current user has one of the given roles."""

    async def _role_checker(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if not user_has_role(user, *roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return _role_checker

