/**
 * TypeScript types for ledger CRUD API responses.
 */

export type LedgerRead = {
  id: string;
  name: string;
  currency: string;
  description: string | null;
  created_at: string;
};

export type LedgerDetailRead = LedgerRead & {
  transaction_count: number;
};

export type LedgerListResponse = {
  items: LedgerRead[];
  total: number;
};

export type LedgerCreate = {
  name: string;
  currency: string;
  description?: string | null;
};

export type LedgerUpdate = {
  name?: string;
  description?: string | null;
};
