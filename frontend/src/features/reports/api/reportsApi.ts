import { getApiClient } from "../../../api/client";
import type { FinancialReportRead } from "../../../types/reporting";

export const reportsApi = {
  async listReports(
    reportType?: string,
    limit = 50,
    offset = 0,
  ): Promise<FinancialReportRead[]> {
    const res = await getApiClient().get<FinancialReportRead[]>("/api/v1/reporting/reports", {
      params: { report_type: reportType, limit, offset },
    });
    return res.data;
  },

  async getReport(reportId: string): Promise<FinancialReportRead> {
    const res = await getApiClient().get<FinancialReportRead>(`/api/v1/reporting/reports/${reportId}`);
    return res.data;
  },
};

