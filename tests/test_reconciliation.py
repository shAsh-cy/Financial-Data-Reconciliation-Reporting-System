"""Unit tests for pure reconciliation engine."""

from decimal import Decimal

import pytest

from app.services.reconciliation import (
    Match,
    ReconciliationResult,
    TransactionRecord,
    build_match_key,
    reconcile,
)


class TestBuildMatchKey:
    """Tests for build_match_key."""

    def test_amount_normalization(self) -> None:
        """Amount is normalized for deterministic comparison."""
        r: TransactionRecord = {
            "amount": 100.50,
            "transaction_date": "2024-01-15",
            "reference": "REF1",
        }
        keys = ("amount", "transaction_date", "reference")
        assert build_match_key(r, keys) == (
            Decimal("100.50"),
            "2024-01-15",
            "REF1",
        )

    def test_same_input_same_output(self) -> None:
        """Same record and keys always produce same tuple."""
        r: TransactionRecord = {
            "amount": Decimal("50.25"),
            "transaction_date": "2024-01-15",
            "reference": "R1",
        }
        keys = ("amount", "transaction_date", "reference")
        assert build_match_key(r, keys) == build_match_key(r, keys)

    def test_none_reference_becomes_empty(self) -> None:
        """None reference normalizes to empty string."""
        r: TransactionRecord = {
            "amount": 100,
            "transaction_date": "2024-01-15",
            "reference": None,
        }
        keys = ("amount", "transaction_date", "reference")
        assert build_match_key(r, keys) == (Decimal("100"), "2024-01-15", "")


class TestReconcile:
    """Tests for reconcile."""

    def test_empty_both_sides(self) -> None:
        """Empty lists produce empty result."""
        result = reconcile([], [])
        assert result.match_count == 0
        assert result.unmatched_left_count == 0
        assert result.unmatched_right_count == 0

    def test_empty_left(self) -> None:
        """All right appear as only_right."""
        right: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        result = reconcile([], right)
        assert result.match_count == 0
        assert result.unmatched_left_count == 0
        assert result.unmatched_right_count == 1

    def test_empty_right(self) -> None:
        """All left appear as only_left."""
        left: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        result = reconcile(left, [])
        assert result.match_count == 0
        assert result.unmatched_left_count == 1
        assert result.unmatched_right_count == 0

    def test_single_match(self) -> None:
        """Single matching pair."""
        left: list[TransactionRecord] = [
            {"id": "L1", "amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        right: list[TransactionRecord] = [
            {"id": "R1", "amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        result = reconcile(left, right)
        assert result.match_count == 1
        assert result.matches[0].left["id"] == "L1"
        assert result.matches[0].right["id"] == "R1"
        assert result.unmatched_left_count == 0
        assert result.unmatched_right_count == 0

    def test_amount_as_string_matches_decimal(self) -> None:
        """Amount as string matches Decimal (normalized)."""
        left: list[TransactionRecord] = [
            {"amount": "100.50", "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        right: list[TransactionRecord] = [
            {"amount": Decimal("100.50"), "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        result = reconcile(left, right)
        assert result.match_count == 1

    def test_deterministic_same_input_same_output(self) -> None:
        """Same inputs always produce same outputs."""
        left: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        right: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "reference": "R1"},
        ]
        r1 = reconcile(left, right)
        r2 = reconcile(left, right)
        assert r1.match_count == r2.match_count
        assert r1.unmatched_left_count == r2.unmatched_left_count
        assert r1.unmatched_right_count == r2.unmatched_right_count

    def test_custom_match_keys(self) -> None:
        """Custom match keys work."""
        left: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "currency": "USD", "reference": "X"},
        ]
        right: list[TransactionRecord] = [
            {"amount": 100, "transaction_date": "2024-01-15", "currency": "USD", "reference": "Y"},
        ]
        result_amount_date = reconcile(left, right, match_keys=("amount", "transaction_date"))
        assert result_amount_date.match_count == 1

        result_with_ref = reconcile(left, right, match_keys=("amount", "transaction_date", "reference"))
        assert result_with_ref.match_count == 0

    def test_one_to_one_matching_with_duplicates(self) -> None:
        """Multiple same-key items match one-to-one in order."""
        left: list[TransactionRecord] = [
            {"amount": 50, "transaction_date": "2024-01-15", "reference": "R"},
            {"amount": 50, "transaction_date": "2024-01-15", "reference": "R"},
        ]
        right: list[TransactionRecord] = [
            {"amount": 50, "transaction_date": "2024-01-15", "reference": "R"},
            {"amount": 50, "transaction_date": "2024-01-15", "reference": "R"},
        ]
        result = reconcile(left, right)
        assert result.match_count == 2
        assert result.unmatched_left_count == 0
        assert result.unmatched_right_count == 0
