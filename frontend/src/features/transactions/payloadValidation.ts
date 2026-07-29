/**
 * Client-side validation for the transaction ingest JSON payload. Mirrors the
 * server's TransactionIngestItem schema so operators see field-level problems
 * before the request is queued.
 */

import type { TransactionIngestItem } from "./api/transactionsApi";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Za-z]{3}$/;
const MAX_REPORTED_ERRORS = 10;

export type PayloadValidation =
  | { ok: true; items: TransactionIngestItem[] }
  | { ok: false; errors: string[] };

export const EXAMPLE_PAYLOAD: TransactionIngestItem[] = [
  {
    external_id: "INV-1001",
    transaction_date: "2026-01-15",
    amount: "1250.00",
    currency: "USD",
    type: "credit",
    description: "Consulting revenue",
    reference: "PO-88213",
  },
  {
    external_id: "EXP-2044",
    transaction_date: "2026-01-18",
    amount: "310.45",
    currency: "USD",
    type: "debit",
    description: "Cloud hosting",
    reference: null,
  },
];

export const EXAMPLE_PAYLOAD_TEXT = JSON.stringify(EXAMPLE_PAYLOAD, null, 2);

function validateItem(raw: unknown, index: number, errors: string[]): TransactionIngestItem | null {
  const label = `Item ${index + 1}`;

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    errors.push(`${label}: must be a JSON object.`);
    return null;
  }

  const item = raw as Record<string, unknown>;
  const before = errors.length;

  if (typeof item.external_id !== "string" || item.external_id.trim() === "") {
    errors.push(`${label}: "external_id" must be a non-empty string.`);
  } else if (item.external_id.length > 255) {
    errors.push(`${label}: "external_id" exceeds 255 characters.`);
  }

  if (typeof item.transaction_date !== "string" || !ISO_DATE_RE.test(item.transaction_date)) {
    errors.push(`${label}: "transaction_date" must be an ISO date (YYYY-MM-DD).`);
  }

  const amount = item.amount;
  if (typeof amount !== "string" && typeof amount !== "number") {
    errors.push(`${label}: "amount" must be a numeric string or number.`);
  } else if (!Number.isFinite(Number(amount)) || String(amount).trim() === "") {
    errors.push(`${label}: "amount" is not a valid number.`);
  }

  if (typeof item.currency !== "string" || !CURRENCY_RE.test(item.currency)) {
    errors.push(`${label}: "currency" must be a 3-letter code such as USD.`);
  }

  if (item.type !== "debit" && item.type !== "credit") {
    errors.push(`${label}: "type" must be either "debit" or "credit".`);
  }

  for (const field of ["description", "reference"] as const) {
    const value = item[field];
    if (value !== undefined && value !== null && typeof value !== "string") {
      errors.push(`${label}: "${field}" must be a string or null.`);
    }
  }

  if (errors.length > before) return null;

  return {
    external_id: item.external_id as string,
    transaction_date: item.transaction_date as string,
    amount: String(amount),
    currency: (item.currency as string).toUpperCase(),
    type: item.type as "debit" | "credit",
    description: (item.description as string | null | undefined) ?? null,
    reference: (item.reference as string | null | undefined) ?? null,
  };
}

export function validateIngestPayload(text: string): PayloadValidation {
  if (text.trim() === "") {
    return { ok: false, errors: ["Payload is empty — paste a JSON array of transactions."] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : "Unknown parse error";
    return { ok: false, errors: [`Invalid JSON: ${detail}`] };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, errors: ['Payload must be a JSON array, e.g. [{ "external_id": … }].'] };
  }
  if (parsed.length === 0) {
    return { ok: false, errors: ["Payload contains no transactions."] };
  }

  const errors: string[] = [];
  const items: TransactionIngestItem[] = [];

  parsed.forEach((raw, index) => {
    const item = validateItem(raw, index, errors);
    if (item) items.push(item);
  });

  if (errors.length > 0) {
    const reported = errors.slice(0, MAX_REPORTED_ERRORS);
    if (errors.length > MAX_REPORTED_ERRORS) {
      reported.push(`…and ${errors.length - MAX_REPORTED_ERRORS} more problem(s).`);
    }
    return { ok: false, errors: reported };
  }

  return { ok: true, items };
}
