"""Unit tests for auth service (user_has_role, token creation)."""

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.services.auth import create_user_access_token, user_has_role


def _make_user(role: str = "viewer", email: str = "test@example.com") -> User:
    """Create a User instance for testing (no DB)."""
    return User(
        id=uuid4(),
        email=email,
        hashed_password="hashed",
        full_name="Test User",
        role=role,
        is_active=True,
    )


class TestUserHasRole:
    """Tests for user_has_role."""

    def test_admin_has_admin_role(self) -> None:
        """Admin user has admin role."""
        user = _make_user(role="admin")
        assert user_has_role(user, UserRole.ADMIN) is True

    def test_admin_has_accountant_role(self) -> None:
        """Admin does not have accountant role (strict check)."""
        user = _make_user(role="admin")
        assert user_has_role(user, UserRole.ACCOUNTANT) is False

    def test_accountant_has_accountant_role(self) -> None:
        """Accountant has accountant role."""
        user = _make_user(role="accountant")
        assert user_has_role(user, UserRole.ACCOUNTANT) is True

    def test_accountant_has_admin_or_accountant(self) -> None:
        """Accountant satisfies admin OR accountant check."""
        user = _make_user(role="accountant")
        assert user_has_role(user, UserRole.ADMIN, UserRole.ACCOUNTANT) is True

    def test_viewer_denied_admin_or_accountant(self) -> None:
        """Viewer does not satisfy admin or accountant."""
        user = _make_user(role="viewer")
        assert user_has_role(user, UserRole.ADMIN, UserRole.ACCOUNTANT) is False

    def test_viewer_has_viewer_role(self) -> None:
        """Viewer has viewer role."""
        user = _make_user(role="viewer")
        assert user_has_role(user, UserRole.VIEWER) is True

    def test_empty_roles_returns_true(self) -> None:
        """No roles required means any user passes."""
        user = _make_user(role="viewer")
        assert user_has_role(user) is True


class TestCreateUserAccessToken:
    """Tests for create_user_access_token."""

    def test_creates_valid_token_with_user_id(self) -> None:
        """Token encodes user ID as subject."""
        user = _make_user(role="admin")
        token = create_user_access_token(user)
        assert isinstance(token, str)
        assert len(token) > 0
        from app.core.security import decode_access_token

        payload = decode_access_token(token)
        assert payload["sub"] == str(user.id)
