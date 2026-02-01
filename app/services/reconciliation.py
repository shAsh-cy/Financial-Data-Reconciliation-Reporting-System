"""Pure reconciliation engine. No database, no pandas, deterministic."""

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Literal, TypedDict


class TransactionRecord(TypedDict, total=False):
    """Plain transaction record for reconciliation. All values JSON-serializable."""

    id: str
    amount: Decimal | str | float
    transaction_date: str
    currency: str
    type: str
    reference: str | None
    description: str | None
    external_id: str


@dataclass(frozen=True)
class Match:
    """A matched pair of transactions."""

    left: TransactionRecord
    right: TransactionRecord


@dataclass
class ReconciliationResult:
    """Result of reconciling two transaction sets."""

    matches: list[Match] = field(default_factory=list)
    only_left: list[TransactionRecord] = field(default_factory=list)
    only_right: list[TransactionRecord] = field(default_factory=list)

    @property
    def match_count(self) -> int:
        return len(self.matches)

    @property
    def unmatched_left_count(self) -> int:
        return len(self.only_left)

    @property
    def unmatched_right_count(self) -> int:
        return len(self.only_right)


MatchKey = Literal[
    "amount", "transaction_date", "reference", "description", "type", "currency"
]


def _normalize_amount(value: Decimal | str | float) -> Decimal:
    """Normalize amount for deterministic comparison."""
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    return Decimal(str(value))


def _normalize_date(value: str) -> str:
    """Normalize date string for deterministic comparison (YYYY-MM-DD)."""
    s = str(value).strip()
    if len(s) == 10 and s[4] == "-" and s[7] == "-":
        return s
    return s


def _normalize_str(value: str | None) -> str:
    """Normalize string for matching. None -> empty string."""
    if value is None:
        return ""
    return str(value).strip()


def build_match_key(record: TransactionRecord, keys: tuple[MatchKey, ...]) -> tuple:
    """
    Build a deterministic match key from a transaction record.
    Same record + same keys always produces the same tuple.
    """
    parts: list = []
    for key in keys:
        val = record.get(key)
        if key == "amount":
            parts.append(_normalize_amount(val) if val is not None else Decimal("0"))
        elif key == "transaction_date":
            parts.append(_normalize_date(val) if val else "")
        else:
            parts.append(_normalize_str(val) if val is not None else "")
    return tuple(parts)


def reconcile(
    left: list[TransactionRecord],
    right: list[TransactionRecord],
    match_keys: tuple[MatchKey, ...] = ("amount", "transaction_date", "reference"),
) -> ReconciliationResult:
    """
    Reconcile two transaction sets. Deterministic one-to-one matching.
    Same inputs always produce same outputs. No side effects.
    """
    result = ReconciliationResult()
    used_right_indices: set[int] = set()

    for left_record in left:
        left_key = build_match_key(left_record, match_keys)
        matched = False

        for i, right_record in enumerate(right):
            if i in used_right_indices:
                continue
            right_key = build_match_key(right_record, match_keys)
            if left_key == right_key:
                result.matches.append(Match(left=left_record, right=right_record))
                used_right_indices.add(i)
                matched = True
                break

        if not matched:
            result.only_left.append(left_record)

    for i, right_record in enumerate(right):
        if i not in used_right_indices:
            result.only_right.append(right_record)

    return result
