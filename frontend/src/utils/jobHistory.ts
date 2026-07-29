/**
 * Session-scoped history of background jobs triggered from this browser tab.
 * Persisted under sessionStorage key `ops-job-history`, newest first, capped
 * at the last 10 entries. All storage access is guarded — private-mode and
 * blocked-storage browsers degrade to an in-memory-free no-op.
 */

import type { JobStatusValue, OpsJobHistoryEntry, OpsJobType } from "../types/jobs";

export const JOB_HISTORY_KEY = "ops-job-history";
export const JOB_HISTORY_LIMIT = 10;

const TERMINAL_STATUSES: readonly JobStatusValue[] = ["success", "failed"];

export function isTerminalJobStatus(status: JobStatusValue): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function isEntry(value: unknown): value is OpsJobHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.task_id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.triggered_at === "string" &&
    typeof candidate.status === "string"
  );
}

export function readJobHistory(): OpsJobHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(JOB_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, JOB_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function writeJobHistory(entries: OpsJobHistoryEntry[]): void {
  try {
    sessionStorage.setItem(JOB_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage unavailable — history is best-effort only.
  }
}

/** Prepend a newly triggered job and return the trimmed history. */
export function recordJob(taskId: string, type: OpsJobType): OpsJobHistoryEntry[] {
  const entry: OpsJobHistoryEntry = {
    task_id: taskId,
    type,
    triggered_at: new Date().toISOString(),
    status: "queued",
  };
  const next = [entry, ...readJobHistory().filter((e) => e.task_id !== taskId)].slice(
    0,
    JOB_HISTORY_LIMIT,
  );
  writeJobHistory(next);
  return next;
}

/** Apply polled statuses to the stored history and return the updated list. */
export function applyJobStatuses(
  updates: ReadonlyArray<{ taskId: string; status: JobStatusValue }>,
): OpsJobHistoryEntry[] {
  const byId = new Map(updates.map((u) => [u.taskId, u.status]));
  const current = readJobHistory();
  let changed = false;

  const next = current.map((entry) => {
    const status = byId.get(entry.task_id);
    if (status === undefined || status === entry.status) return entry;
    changed = true;
    return { ...entry, status };
  });

  if (changed) writeJobHistory(next);
  return next;
}
