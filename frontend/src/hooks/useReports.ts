import { useCallback, useEffect, useState } from "react";

import { type FinancialReportRead, isDemoMeta } from "../types/reporting";
import { reportsApi } from "../features/reports/api/reportsApi";

type UseReportsOptions = {
  reportType?: string;
  limit?: number;
  pollIntervalMs?: number;
  pollWhenRunning?: boolean;
};

export function useReports(options: UseReportsOptions = {}) {
  const {
    reportType,
    limit = 50,
    pollIntervalMs = 30_000,
    pollWhenRunning = true,
  } = options;

  const [reports, setReports] = useState<FinancialReportRead[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setError(null);
      const data = await reportsApi.listReports(reportType, limit, 0);
      setReports(data.items);
      setTotal(data.total);
      setIsDemo(isDemoMeta(data.meta));
    } catch {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [reportType, limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (!pollWhenRunning || loading) return;
    const hasRunning = reports.some((r) => r.status === "running");
    if (!hasRunning) return;

    const id = setInterval(fetchReports, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollWhenRunning, loading, reports, pollIntervalMs, fetchReports]);

  return { reports, total, isDemo, loading, error, refetch: fetchReports };
}
