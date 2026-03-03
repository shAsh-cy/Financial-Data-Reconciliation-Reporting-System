import { getApiClient } from "../../../api/client";

export type TransactionIngestItem = {
  external_id: string;
  transaction_date: string; // ISO date
  amount: string;
  currency: string;
  type: "debit" | "credit";
  description?: string | null;
  reference?: string | null;
};

export type TransactionIngestRequest = {
  ledger_id: string;
  transactions: TransactionIngestItem[];
};

export const transactionsApi = {
  async ingest(payload: TransactionIngestRequest): Promise<{ task_id: string }> {
    const res = await getApiClient().post<{ task_id: string }>(
      "/api/v1/transactions/ingest",
      payload,
    );
    return res.data;
  },
};

