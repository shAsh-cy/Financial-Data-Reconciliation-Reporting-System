"""Async database engine and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings


def _async_url(url: str) -> str:
    """Ensure URL uses asyncpg driver for async engine."""
    if url.startswith("postgresql://") and "+" not in url.split("://")[1]:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _sync_url(url: str) -> str:
    """Convert to sync URL for Alembic migrations."""
    if "asyncpg" in url:
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+" not in url.split("://")[1]:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def get_sync_url() -> str:
    """Return sync database URL for Alembic migrations."""
    return _sync_url(_db_config.URL)


_db_config = settings.database
_async_database_url = _async_url(_db_config.URL)

engine = create_async_engine(
    _async_database_url,
    echo=_db_config.ECHO,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency yielding an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
