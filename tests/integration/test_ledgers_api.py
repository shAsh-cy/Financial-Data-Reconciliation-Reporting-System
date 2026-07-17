"""Tests for ledger CRUD API — auth, RBAC, list/create/get."""

from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.ledger import Ledger
from app.models.user import User, UserRole
from app.services.auth import create_user_access_token


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_ledgers_requires_auth(http_client) -> None:
    """Unauthenticated requests to /ledgers are rejected."""
    response = await http_client.get("/api/v1/ledgers")
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_ledgers_viewer_ok(http_client, db_session: AsyncSession) -> None:
    """Viewer can list ledgers."""
    ledger = Ledger(code="REV-01", name="Revenue", currency="USD", source_system="test")
    db_session.add(ledger)
    await db_session.flush()

    user = User(
        email="viewer-ledgers@example.com",
        hashed_password=hash_password("ViewerPass"),
        full_name="Viewer",
        role=UserRole.VIEWER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_user_access_token(user)
    response = await http_client.get(
        "/api/v1/ledgers",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 1
    assert any(item["name"] == "Revenue" for item in payload["items"])


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_ledger_admin_only(http_client, db_session: AsyncSession) -> None:
    """Only admin can create ledgers; viewer receives 403."""
    viewer = User(
        email="viewer-create@example.com",
        hashed_password=hash_password("ViewerPass"),
        full_name="Viewer",
        role=UserRole.VIEWER.value,
        is_active=True,
    )
    db_session.add(viewer)
    await db_session.flush()
    viewer_token = create_user_access_token(viewer)

    denied = await http_client.post(
        "/api/v1/ledgers",
        headers={"Authorization": f"Bearer {viewer_token}"},
        json={"name": "Blocked Ledger", "currency": "USD"},
    )
    assert denied.status_code == 403

    admin = User(
        email="admin-create@example.com",
        hashed_password=hash_password("AdminPass"),
        full_name="Admin",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.flush()
    admin_token = create_user_access_token(admin)

    created = await http_client.post(
        "/api/v1/ledgers",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"name": "Operating Expenses", "currency": "EUR", "description": "Opex book"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Operating Expenses"
    assert body["currency"] == "EUR"
    assert body["description"] == "Opex book"
    assert "id" in body


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_ledger_with_transaction_count(http_client, db_session: AsyncSession) -> None:
    """GET /ledgers/{id} returns ledger detail and transaction count."""
    ledger = Ledger(code="CASH-01", name="Cash", currency="USD", source_system="test")
    db_session.add(ledger)
    await db_session.flush()

    admin = User(
        email="admin-get@example.com",
        hashed_password=hash_password("AdminPass"),
        full_name="Admin",
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    db_session.add(admin)
    await db_session.flush()
    token = create_user_access_token(admin)

    response = await http_client.get(
        f"/api/v1/ledgers/{ledger.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == str(ledger.id)
    assert payload["transaction_count"] == 0

    missing = await http_client.get(
        f"/api/v1/ledgers/{uuid4()}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert missing.status_code == 404
