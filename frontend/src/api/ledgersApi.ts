/**
 * Ledger CRUD API client.
 */

import { getApiClient } from "./client";
import type {
  LedgerCreate,
  LedgerDetailRead,
  LedgerListResponse,
  LedgerRead,
  LedgerUpdate,
} from "../types/ledgers";

export const ledgersApi = {
  async listLedgers(): Promise<LedgerListResponse> {
    const res = await getApiClient().get<LedgerListResponse>("/api/v1/ledgers");
    return res.data;
  },

  async createLedger(data: LedgerCreate): Promise<LedgerRead> {
    const res = await getApiClient().post<LedgerRead>("/api/v1/ledgers", data);
    return res.data;
  },

  async getLedger(id: string): Promise<LedgerDetailRead> {
    const res = await getApiClient().get<LedgerDetailRead>(`/api/v1/ledgers/${id}`);
    return res.data;
  },

  async updateLedger(id: string, data: LedgerUpdate): Promise<LedgerRead> {
    const res = await getApiClient().patch<LedgerRead>(`/api/v1/ledgers/${id}`, data);
    return res.data;
  },
};
