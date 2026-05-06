import { getApiClient } from "../../../api/client";
import type {
  ReconciliationItemListResponse,
  ReconciliationRunDetailEnvelope,
  ReconciliationRunListResponse,
} from "../../../types/reporting";

export const reconciliationApi = {
  async listRuns(limit = 50, offset = 0): Promise<ReconciliationRunListResponse> {
    const res = await getApiClient().get<ReconciliationRunListResponse>(
      "/api/v1/reconciliations",
      { params: { limit, offset } },
    );
    return res.data;
  },

  async getRun(runId: string): Promise<ReconciliationRunDetailEnvelope> {
    const res = await getApiClient().get<ReconciliationRunDetailEnvelope>(
      `/api/v1/reconciliations/${runId}`,
    );
    return res.data;
  },

  async listItems(runId: string, limit = 100, offset = 0): Promise<ReconciliationItemListResponse> {
    const res = await getApiClient().get<ReconciliationItemListResponse>(
      `/api/v1/reconciliations/${runId}/items`,
      { params: { limit, offset } },
    );
    return res.data;
  },
};
