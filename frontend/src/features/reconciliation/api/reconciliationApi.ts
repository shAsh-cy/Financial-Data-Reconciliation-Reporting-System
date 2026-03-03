import { getApiClient } from "../../../api/client";
import type { ReconciliationItemRead, ReconciliationRunRead } from "../../../types/reporting";

export const reconciliationApi = {
  async listRuns(limit = 50, offset = 0): Promise<ReconciliationRunRead[]> {
    const res = await getApiClient().get<ReconciliationRunRead[]>(
      "/api/v1/reporting/reconciliations",
      { params: { limit, offset } },
    );
    return res.data;
  },

  async getRun(runId: string): Promise<ReconciliationRunRead> {
    const res = await getApiClient().get<ReconciliationRunRead>(
      `/api/v1/reporting/reconciliations/${runId}`,
    );
    return res.data;
  },

  async listItems(runId: string, limit = 100, offset = 0): Promise<ReconciliationItemRead[]> {
    const res = await getApiClient().get<ReconciliationItemRead[]>(
      `/api/v1/reporting/reconciliations/${runId}/items`,
      { params: { limit, offset } },
    );
    return res.data;
  },
};

