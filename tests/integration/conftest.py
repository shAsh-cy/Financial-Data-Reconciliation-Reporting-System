"""Integration test fixtures: DB session, HTTP client."""

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio

# Ensure all models are registered before create_all
import app.models  # noqa: F401


@pytest.fixture(autouse=True)
def celery_eager_mode():
    """Run Celery tasks synchronously (no Redis required)."""
    from app.workers import celery_app

    celery_app.app.conf.task_always_eager = True
    yield
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.session import get_session
from app.main import app
from app.models.base import Base

# Use test DB; skip integration tests if not configured
TEST_DB_URL = os.getenv("TEST_DATABASE_URL") or os.getenv("DATABASE_URL")


def _async_url(url: str) -> str:
    if url.startswith("postgresql://") and "+" not in url.split("://")[1]:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


@pytest.fixture(scope="session")
def db_url() -> str:
    """Database URL for integration tests."""
    url = TEST_DB_URL
    if not url:
        pytest.skip(
            "Set TEST_DATABASE_URL or DATABASE_URL for integration tests",
            allow_module_level=True,
        )
    return _async_url(url)


@pytest_asyncio.fixture
async def engine(db_url: str):
    """Create async engine for test DB."""
    eng = create_async_engine(
        db_url,
        echo=False,
        pool_pre_ping=True,
    )
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def create_tables(engine):
    """Create all tables in test DB."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def db_session(engine, create_tables):
    """Provide an async session for each test."""
    factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest_asyncio.fixture
async def http_client(db_session: AsyncSession):
    """HTTP client with app dependency overridden to use test session."""

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_session] = override_get_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
