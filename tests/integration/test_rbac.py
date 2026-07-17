"""Integration tests for role-based access control."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.user import User, UserRole


@pytest.mark.integration
@pytest.mark.asyncio
async def test_viewer_can_access_reporting(
    http_client,
    db_session: AsyncSession,
) -> None:
    """Viewer can access reporting endpoints (read-only)."""
    from app.services.auth import create_user_access_token

    user = User(
        email="viewer@example.com",
        hashed_password=hash_password("ViewerPass"),
        full_name="Viewer User",
        role=UserRole.VIEWER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_user_access_token(user)

    response = await http_client.get(
        "/api/v1/reporting/reconciliations",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert "items" in payload and "total" in payload
    assert "meta" in payload and isinstance(payload["meta"], dict)
    assert isinstance(payload["items"], list)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_viewer_denied_transaction_ingest(
    http_client,
    db_session: AsyncSession,
) -> None:
    """Viewer cannot access transaction ingest (403)."""
    from uuid import uuid4

    from app.services.auth import create_user_access_token

    user = User(
        email="viewer@example.com",
        hashed_password=hash_password("ViewerPass"),
        full_name="Viewer User",
        role=UserRole.VIEWER.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_user_access_token(user)

    # Ingest requires admin or accountant
    response = await http_client.post(
        "/api/v1/transactions/ingest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "ledger_id": str(uuid4()),
            "transactions": [],
        },
    )

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.asyncio
async def test_accountant_can_access_transaction_ingest(
    http_client,
    db_session: AsyncSession,
) -> None:
    """Accountant can access transaction ingest (202 accepted)."""
    from uuid import uuid4

    from app.models.ledger import Ledger
    from app.services.auth import create_user_access_token

    ledger = Ledger(code="BANK-01", name="Bank Account", currency="USD", source_system="test")
    db_session.add(ledger)
    await db_session.flush()

    user = User(
        email="accountant@example.com",
        hashed_password=hash_password("AcctPass"),
        full_name="Accountant User",
        role=UserRole.ACCOUNTANT.value,
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    token = create_user_access_token(user)

    response = await http_client.post(
        "/api/v1/transactions/ingest",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "ledger_id": str(ledger.id),
            "transactions": [
                {
                    "external_id": "ext-001",
                    "transaction_date": "2024-01-15",
                    "amount": "100.00",
                    "currency": "USD",
                    "type": "debit",
                    "description": "Test",
                    "reference": "REF1",
                },
            ],
        },
    )

    # 202 Accepted (task enqueued)
    assert response.status_code == 202
    assert "task_id" in response.json()
