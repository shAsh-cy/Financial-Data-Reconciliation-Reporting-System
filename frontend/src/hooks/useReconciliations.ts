import { useCallback, useEffect, useState } from "react";

import { type ReconciliationRunRead, isDemoMeta } from "../types/reporting";
import { reconciliationApi } from "../features/reconciliation/api/reconciliationApi";

type UseReconciliationsOptions = {
  limit?: number;
  pollIntervalMs?: number;
  pollWhenRunning?: boolean;
};

export function useReconciliations(options: UseReconciliationsOptions = {}) {
  const {
    limit = 50,
    pollIntervalMs = 10_000,
    pollWhenRunning = true,
  } = options;

  const [runs, setRuns] = useState<ReconciliationRunRead[]>([]);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      setError(null);
      const data = await reconciliationApi.listRuns(limit, 0);
      setRuns(data.items);
      setTotal(data.total);
      setIsDemo(isDemoMeta(data.meta));
    } catch {
      setError("Failed to load reconciliation runs.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    if (!pollWhenRunning || loading) return;
    const hasRunning = runs.some((r) => r.status === "running");
    if (!hasRunning) return;

    const id = setInterval(fetchRuns, pollIntervalMs);
    return () => clearInterval(id);
  }, [pollWhenRunning, loading, runs, pollIntervalMs, fetchRuns]);

  return { runs, total, isDemo, loading, error, refetch: fetchRuns };
}
