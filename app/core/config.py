"""Application configuration loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


_SHARED_CONFIG = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    case_sensitive=False,
)


class DatabaseSettings(BaseSettings):
    """Database configuration. All values from environment."""

    model_config = SettingsConfigDict(**_SHARED_CONFIG, env_prefix="DATABASE_")

    URL: str = ""
    ECHO: bool = False


class AuthSettings(BaseSettings):
    """Authentication configuration. All secrets from environment."""

    model_config = SettingsConfigDict(**_SHARED_CONFIG, env_prefix="JWT_")

    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


class CelerySettings(BaseSettings):
    """Celery worker configuration. All values from environment."""

    model_config = SettingsConfigDict(**_SHARED_CONFIG, env_prefix="CELERY_")

    BROKER_URL: str = ""
    RESULT_BACKEND: str = ""


class Settings(BaseSettings):
    """Application settings. Composes database, auth, and Celery config."""

    model_config = _SHARED_CONFIG

    APP_ENV: Literal["development", "staging", "production"] = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    @property
    def database(self) -> DatabaseSettings:
        return _get_database_settings()

    @property
    def auth(self) -> AuthSettings:
        return _get_auth_settings()

    @property
    def celery(self) -> CelerySettings:
        return _get_celery_settings()


@lru_cache
def _get_database_settings() -> DatabaseSettings:
    return DatabaseSettings()


@lru_cache
def _get_auth_settings() -> AuthSettings:
    return AuthSettings()


@lru_cache
def _get_celery_settings() -> CelerySettings:
    return CelerySettings()


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
