/**
 * Background job trigger and Celery task status API client.
 */

import { getApiClient } from "./client";
import type {
  JobStatusResponse,
  JobTriggerResponse,
  LiquidityReportJobRequest,
  PnlReportJobRequest,
  ReconciliationJobRequest,
} from "../types/jobs";

export const jobsApi = {
  async triggerReconciliation(body: ReconciliationJobRequest): Promise<JobTriggerResponse> {
    const res = await getApiClient().post<JobTriggerResponse>(
      "/api/v1/jobs/reconciliation",
      body,
    );
    return res.data;
  },

  async triggerPnlReport(body: PnlReportJobRequest): Promise<JobTriggerResponse> {
    const res = await getApiClient().post<JobTriggerResponse>("/api/v1/jobs/reports/pnl", body);
    return res.data;
  },

  async triggerLiquidityReport(body: LiquidityReportJobRequest): Promise<JobTriggerResponse> {
    const res = await getApiClient().post<JobTriggerResponse>(
      "/api/v1/jobs/reports/liquidity",
      body,
    );
    return res.data;
  },

  async getTaskStatus(taskId: string): Promise<JobStatusResponse> {
    const res = await getApiClient().get<JobStatusResponse>(`/api/v1/jobs/${taskId}`);
    return res.data;
  },
};
