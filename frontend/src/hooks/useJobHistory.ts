/**
 * useJobHistory — session-scoped list of triggered background jobs, kept fresh
 * by polling the task-status API every 5s for entries that are not yet terminal.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { jobsApi } from "../api/jobsApi";
import type { JobStatusValue, OpsJobHistoryEntry, OpsJobType } from "../types/jobs";
import { applyJobStatuses, isTerminalJobStatus, readJobHistory, recordJob } from "../utils/jobHistory";

const POLL_INTERVAL_MS = 5000;

export function useJobHistory() {
  const [entries, setEntries] = useState<OpsJobHistoryEntry[]>(() => readJobHistory());

  const record = useCallback((taskId: string, type: OpsJobType) => {
    setEntries(recordJob(taskId, type));
  }, []);

  const syncStatus = useCallback((taskId: string, status: JobStatusValue) => {
    setEntries(applyJobStatuses([{ taskId, status }]));
  }, []);

  const pendingIds = useMemo(
    () => entries.filter((e) => !isTerminalJobStatus(e.status)).map((e) => e.task_id),
    [entries],
  );
  // Stable dependency: the interval only restarts when the pending set changes.
  const pendingKey = pendingIds.join(",");

  useEffect(() => {
    const ids = pendingKey.split(",").filter(Boolean);
    if (ids.length === 0) return;

    let cancelled = false;

    const refresh = async () => {
      const settled = await Promise.all(
        ids.map(async (taskId) => {
          try {
            const res = await jobsApi.getTaskStatus(taskId);
            return { taskId, status: res.status };
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;

      const updates = settled.filter(
        (u): u is { taskId: string; status: JobStatusValue } => u !== null,
      );
      if (updates.length > 0) setEntries(applyJobStatuses(updates));
    };

    const intervalId = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingKey]);

  return { entries, record, syncStatus };
}
