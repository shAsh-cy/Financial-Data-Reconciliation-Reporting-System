/**
 * TypeScript types for background job trigger and status APIs.
 */

export type JobStatusValue = "queued" | "running" | "success" | "failed";

export type JobTriggerResponse = {
  task_id: string;
  status: "queued";
};

export type JobStatusResponse = {
  task_id: string;
  status: JobStatusValue;
  result?: unknown;
  error?: string | null;
};

export type ReconciliationJobRequest = {
  left_ledger_id: string;
  right_ledger_id: string;
};

export type PnlReportJobRequest = {
  ledger_id: string;
  period_start: string;
  period_end: string;
};

export type LiquidityReportJobRequest = {
  ledger_id: string;
  period_start: string;
  period_end: string;
};

export type OpsJobType = "reconciliation" | "pnl" | "liquidity" | "ingest";

export type OpsJobHistoryEntry = {
  task_id: string;
  type: OpsJobType;
  triggered_at: string;
  status: JobStatusValue;
};
