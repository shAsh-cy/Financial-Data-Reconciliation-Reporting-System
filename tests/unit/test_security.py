"""Unit tests for JWT and password hashing."""

from datetime import timedelta

import jwt
import pytest

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    """Tests for password hashing and verification."""

    def test_hash_produces_different_output_each_time(self) -> None:
        """Bcrypt uses random salt; hashes differ per call."""
        h1 = hash_password("secret123")
        h2 = hash_password("secret123")
        assert h1 != h2
        assert verify_password("secret123", h1)
        assert verify_password("secret123", h2)

    def test_verify_password_correct(self) -> None:
        """Correct password verifies against hash."""
        hashed = hash_password("my-password")
        assert verify_password("my-password", hashed) is True

    def test_verify_password_incorrect(self) -> None:
        """Wrong password fails verification."""
        hashed = hash_password("my-password")
        assert verify_password("wrong-password", hashed) is False

    def test_empty_password(self) -> None:
        """Empty password can be hashed and verified."""
        hashed = hash_password("")
        assert verify_password("", hashed) is True


class TestJWT:
    """Tests for JWT create and decode."""

    def test_create_token_contains_subject(self) -> None:
        """Token payload includes subject."""
        token = create_access_token("user-123")
        payload = decode_access_token(token)
        assert payload["sub"] == "user-123"

    def test_create_token_contains_exp_and_iat(self) -> None:
        """Token includes exp and iat claims."""
        token = create_access_token("user-123")
        payload = decode_access_token(token)
        assert "exp" in payload
        assert "iat" in payload
        assert payload["exp"] > payload["iat"]

    def test_create_token_contains_type(self) -> None:
        """Token includes type claim."""
        token = create_access_token("user-123")
        payload = decode_access_token(token)
        assert payload.get("type") == "access"

    def test_custom_expires_delta(self) -> None:
        """Custom expiration is respected."""
        token = create_access_token("user-123", expires_delta=timedelta(minutes=5))
        payload = decode_access_token(token)
        assert payload["exp"] - payload["iat"] == 300

    def test_decode_expired_token_raises(self) -> None:
        """Expired token raises ExpiredSignatureError."""
        token = create_access_token("user-123", expires_delta=timedelta(seconds=-1))
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_access_token(token)

    def test_decode_invalid_token_raises(self) -> None:
        """Invalid token raises InvalidTokenError."""
        with pytest.raises(jwt.InvalidTokenError):
            decode_access_token("not-a-valid-jwt")

    def test_decode_tampered_token_raises(self) -> None:
        """Tampered token fails verification."""
        token = create_access_token("user-123")
        tampered = token[:-5] + "xxxxx"
        with pytest.raises(jwt.InvalidTokenError):
            decode_access_token(tampered)
