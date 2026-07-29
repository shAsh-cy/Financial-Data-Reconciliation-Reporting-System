/**
 * TaskStatusPoller — polls a Celery task by id and renders its live status,
 * elapsed time, and terminal result or error. Polling stops on success/failure
 * and is torn down on unmount or task change.
 */

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { Alert, AlertTitle, Box, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { jobsApi } from "../../api/jobsApi";
import type { JobStatusResponse, JobStatusValue } from "../../types/jobs";
import { StatusChip } from "./StatusChip";

/** Statuses after which the task will never change again. */
const TERMINAL_STATUSES: readonly JobStatusValue[] = ["success", "failed"];

export function isTerminalStatus(status: JobStatusValue | null): boolean {
  return status != null && TERMINAL_STATUSES.includes(status);
}

export type TaskStatusPollerProps = {
  /** Celery task id to poll. `null` renders nothing. */
  taskId: string | null;
  /** Poll cadence in milliseconds. */
  pollIntervalMs?: number;
  /** Fires on every successful status read — used to sync external job history. */
  onStatusChange?: (status: JobStatusValue, response: JobStatusResponse) => void;
  /** Custom renderer for a successful task's result payload. */
  renderResult?: (result: unknown) => ReactNode;
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${seconds}s`;
}

function defaultRenderResult(result: unknown): ReactNode {
  if (result == null) return "Task completed.";
  if (typeof result === "string" || typeof result === "number") return String(result);
  return JSON.stringify(result);
}

export function TaskStatusPoller({
  taskId,
  pollIntervalMs = 3000,
  onStatusChange,
  renderResult = defaultRenderResult,
}: TaskStatusPollerProps) {
  const [status, setStatus] = useState<JobStatusValue | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  // Held in a ref so an inline callback from the parent never restarts polling.
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    if (!taskId) {
      setStatus(null);
      setResult(null);
      setTaskError(null);
      setTransportError(null);
      setStartedAt(null);
      setElapsedMs(0);
      return;
    }

    let cancelled = false;
    let intervalId: number | null = null;

    setStatus("queued");
    setResult(null);
    setTaskError(null);
    setTransportError(null);
    setStartedAt(Date.now());
    setElapsedMs(0);

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const poll = async () => {
      try {
        const res = await jobsApi.getTaskStatus(taskId);
        if (cancelled) return;

        setStatus(res.status);
        setResult(res.result ?? null);
        setTaskError(res.error ?? null);
        setTransportError(null);
        onStatusChangeRef.current?.(res.status, res);

        if (TERMINAL_STATUSES.includes(res.status)) stop();
      } catch {
        if (cancelled) return;
        setTransportError("Unable to reach the job status API. Retrying…");
      }
    };

    void poll();
    intervalId = window.setInterval(() => void poll(), pollIntervalMs);

    return () => {
      cancelled = true;
      stop();
    };
  }, [taskId, pollIntervalMs]);

  useEffect(() => {
    if (startedAt == null || isTerminalStatus(status)) return;

    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [startedAt, status]);

  if (!taskId) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <StatusChip status={status ?? "pending"} />
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
          {taskId}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Elapsed {formatElapsed(elapsedMs)}
        </Typography>
      </Stack>

      {status === "success" && (
        <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ mt: 1.5 }}>
          <AlertTitle sx={{ mb: 0.25 }}>Completed</AlertTitle>
          {renderResult(result)}
        </Alert>
      )}

      {status === "failed" && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          <AlertTitle sx={{ mb: 0.25 }}>Task failed</AlertTitle>
          {taskError ?? "The worker reported a failure without an error message."}
        </Alert>
      )}

      {transportError && !isTerminalStatus(status) && (
        <Alert severity="warning" sx={{ mt: 1.5 }}>
          {transportError}
        </Alert>
      )}
    </Box>
  );
}
