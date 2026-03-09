"""Integration tests for JWT authentication flow."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_returns_token(
    http_client,
    db_session: AsyncSession,
) -> None:
    """Valid credentials return access token."""
    user = User(
        email="finance@example.com",
        hashed_password=hash_password("SecurePass123"),
        full_name="Finance User",
        role=UserRole.ACCOUNTANT.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await http_client.post(
        "/api/v1/auth/login",
        data={"username": "finance@example.com", "password": "SecurePass123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_invalid_password_returns_400(
    http_client,
    db_session: AsyncSession,
) -> None:
    """Invalid password returns 400."""
    user = User(
        email="finance@example.com",
        hashed_password=hash_password("SecurePass123"),
        full_name="Finance User",
        role=UserRole.VIEWER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    response = await http_client.post(
        "/api/v1/auth/login",
        data={"username": "finance@example.com", "password": "WrongPassword"},
    )

    assert response.status_code == 400
    assert "access_token" not in response.json()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_login_unknown_user_returns_400(http_client) -> None:
    """Unknown user returns 400."""
    response = await http_client.post(
        "/api/v1/auth/login",
        data={"username": "nobody@example.com", "password": "any"},
    )

    assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.asyncio
async def test_me_returns_user_with_valid_token(
    http_client,
    db_session: AsyncSession,
) -> None:
    """GET /me with valid token returns user."""
    from app.services.auth import create_user_access_token

    user = User(
        email="admin@example.com",
        hashed_password=hash_password("AdminPass"),
        full_name="Admin User",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_user_access_token(user)

    response = await http_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_me_without_token_returns_401(http_client) -> None:
    """GET /me without token returns 401."""
    response = await http_client.get("/api/v1/auth/me")
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401(http_client) -> None:
    """GET /me with invalid token returns 401."""
    response = await http_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
