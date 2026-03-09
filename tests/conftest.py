"""Shared pytest configuration and fixtures."""

import os

# Set test env before app imports (no secrets in repo; use defaults for CI)
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-min-32-chars-for-testing")
