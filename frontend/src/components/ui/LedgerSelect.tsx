/**
 * LedgerSelect — MUI select populated from the ledger list, shared by the
 * Operations job forms and the transaction ingest form.
 */

import { MenuItem, TextField } from "@mui/material";

import type { LedgerRead } from "../../types/ledgers";

export type LedgerSelectProps = {
  label: string;
  value: string;
  onChange: (ledgerId: string) => void;
  ledgers: LedgerRead[];
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

export function LedgerSelect({
  label,
  value,
  onChange,
  ledgers,
  loading = false,
  disabled = false,
  error = false,
  helperText,
}: LedgerSelectProps) {
  const isEmpty = !loading && ledgers.length === 0;
  const resolvedHelperText =
    helperText ??
    (loading
      ? "Loading ledgers…"
      : isEmpty
        ? "No ledgers available — create one first."
        : undefined);

  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || loading || isEmpty}
      error={error}
      {...(resolvedHelperText ? { helperText: resolvedHelperText } : {})}
    >
      {ledgers.map((ledger) => (
        <MenuItem key={ledger.id} value={ledger.id}>
          {ledger.name} · {ledger.currency}
        </MenuItem>
      ))}
    </TextField>
  );
}
