import { getApiClient } from "../../../api/client";
import type {
  FinancialReportDetailEnvelope,
  FinancialReportListResponse,
  ReportsOverviewResponse,
} from "../../../types/reporting";

export const reportsApi = {
  async listReports(
    reportType?: string,
    limit = 50,
    offset = 0,
  ): Promise<FinancialReportListResponse> {
    const res = await getApiClient().get<FinancialReportListResponse>("/api/v1/reports", {
      params: { report_type: reportType, limit, offset },
    });
    return res.data;
  },

  async getOverview(): Promise<ReportsOverviewResponse> {
    const res = await getApiClient().get<ReportsOverviewResponse>("/api/v1/reports/overview");
    return res.data;
  },

  async getReport(reportId: string): Promise<FinancialReportDetailEnvelope> {
    const res = await getApiClient().get<FinancialReportDetailEnvelope>(`/api/v1/reports/${reportId}`);
    return res.data;
  },
};
