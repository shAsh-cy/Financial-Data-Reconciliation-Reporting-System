/**
 * ReportJobCard — queues a P&L or liquidity report for a ledger and period,
 * then streams the Celery task status inline. One component covers both report
 * variants; only the copy and the API call differ.
 */

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Button, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

import { jobsApi } from "../../../api/jobsApi";
import { apiErrorDetail } from "../../../api/errors";
import { GlassCard } from "../../../components/ui/GlassCard";
import { LedgerSelect } from "../../../components/ui/LedgerSelect";
import { TaskStatusPoller } from "../../../components/ui/TaskStatusPoller";
import type { JobStatusValue } from "../../../types/jobs";
import type { LedgerRead } from "../../../types/ledgers";
import { JobResultLink } from "./JobResultLink";

export type ReportJobVariant = "pnl" | "liquidity";

export type ReportJobCardProps = {
  variant: ReportJobVariant;
  ledgers: LedgerRead[];
  ledgersLoading: boolean;
  onTriggered: (taskId: string) => void;
  onStatusChange: (taskId: string, status: JobStatusValue) => void;
};

const VARIANT_COPY: Record<ReportJobVariant, { title: string; blurb: string; cta: string }> = {
  pnl: {
    title: "P&L Report",
    blurb: "Aggregate revenue, cost of goods, and operating expenses over a period.",
    cta: "Generate P&L",
  },
  liquidity: {
    title: "Liquidity Report",
    blurb: "Compute current, quick, and cash ratios as of the period end date.",
    cta: "Generate Liquidity",
  },
};

export function ReportJobCard({
  variant,
  ledgers,
  ledgersLoading,
  onTriggered,
  onStatusChange,
}: ReportJobCardProps) {
  const copy = VARIANT_COPY[variant];

  const [ledgerId, setLedgerId] = useState("");
  const [periodStart, setPeriodStart] = useState<Dayjs | null>(() => dayjs().startOf("month"));
  const [periodEnd, setPeriodEnd] = useState<Dayjs | null>(() => dayjs().endOf("month"));
  const [taskId, setTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const datesValid =
    periodStart != null &&
    periodEnd != null &&
    periodStart.isValid() &&
    periodEnd.isValid() &&
    !periodStart.isAfter(periodEnd);
  const invalidRange = periodStart != null && periodEnd != null && !datesValid;
  const canSubmit = ledgerId !== "" && datesValid && !submitting;

  const submit = async () => {
    if (periodStart == null || periodEnd == null) return;
    setError(null);
    setTaskId(null);
    setSubmitting(true);
    try {
      const body = {
        ledger_id: ledgerId,
        period_start: periodStart.format("YYYY-MM-DD"),
        period_end: periodEnd.format("YYYY-MM-DD"),
      };
      const res =
        variant === "pnl"
          ? await jobsApi.triggerPnlReport(body)
          : await jobsApi.triggerLiquidityReport(body);
      setTaskId(res.task_id);
      onTriggered(res.task_id);
    } catch (e: unknown) {
      setError(apiErrorDetail(e, `Failed to queue the ${copy.title} job.`).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {copy.blurb}
        </Typography>

        <Stack spacing={2}>
          <LedgerSelect
            label="Ledger"
            value={ledgerId}
            onChange={setLedgerId}
            ledgers={ledgers}
            loading={ledgersLoading}
          />
          <DatePicker
            label="Period start"
            value={periodStart}
            onChange={setPeriodStart}
            slotProps={{ textField: { size: "small", fullWidth: true } }}
          />
          <DatePicker
            label="Period end"
            value={periodEnd}
            onChange={setPeriodEnd}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                error: invalidRange,
                ...(invalidRange ? { helperText: "End date must not precede the start date." } : {}),
              },
            }}
          />

          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={!canSubmit}
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />
            }
          >
            {submitting ? "Queueing…" : copy.cta}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <TaskStatusPoller
          taskId={taskId}
          onStatusChange={(status) => taskId && onStatusChange(taskId, status)}
          renderResult={(result) => (
            <JobResultLink result={result} pathPrefix="/reports" recordLabel="report" />
          )}
        />
      </CardContent>
    </GlassCard>
  );
}
