/**
 * ReconciliationJobCard — picks two ledgers and queues a reconciliation run,
 * then streams the Celery task status inline.
 */

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Alert, Button, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useState } from "react";

import { jobsApi } from "../../../api/jobsApi";
import { apiErrorDetail } from "../../../api/errors";
import { GlassCard } from "../../../components/ui/GlassCard";
import { LedgerSelect } from "../../../components/ui/LedgerSelect";
import { TaskStatusPoller } from "../../../components/ui/TaskStatusPoller";
import type { JobStatusValue } from "../../../types/jobs";
import type { LedgerRead } from "../../../types/ledgers";
import { JobResultLink } from "./JobResultLink";

export type ReconciliationJobCardProps = {
  ledgers: LedgerRead[];
  ledgersLoading: boolean;
  onTriggered: (taskId: string) => void;
  onStatusChange: (taskId: string, status: JobStatusValue) => void;
};

export function ReconciliationJobCard({
  ledgers,
  ledgersLoading,
  onTriggered,
  onStatusChange,
}: ReconciliationJobCardProps) {
  const [leftLedgerId, setLeftLedgerId] = useState("");
  const [rightLedgerId, setRightLedgerId] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sameLedger = leftLedgerId !== "" && leftLedgerId === rightLedgerId;
  const canSubmit = leftLedgerId !== "" && rightLedgerId !== "" && !sameLedger && !submitting;

  const submit = async () => {
    setError(null);
    setTaskId(null);
    setSubmitting(true);
    try {
      const res = await jobsApi.triggerReconciliation({
        left_ledger_id: leftLedgerId,
        right_ledger_id: rightLedgerId,
      });
      setTaskId(res.task_id);
      onTriggered(res.task_id);
    } catch (e: unknown) {
      setError(apiErrorDetail(e, "Failed to queue the reconciliation job.").message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Reconciliation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Match transactions across two ledgers on amount, date, and reference.
        </Typography>

        <Stack spacing={2}>
          <LedgerSelect
            label="Left ledger"
            value={leftLedgerId}
            onChange={setLeftLedgerId}
            ledgers={ledgers}
            loading={ledgersLoading}
          />
          <LedgerSelect
            label="Right ledger"
            value={rightLedgerId}
            onChange={setRightLedgerId}
            ledgers={ledgers}
            loading={ledgersLoading}
            error={sameLedger}
            {...(sameLedger ? { helperText: "Pick a different ledger than the left side." } : {})}
          />

          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={!canSubmit}
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />
            }
          >
            {submitting ? "Queueing…" : "Run Reconciliation"}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <TaskStatusPoller
          taskId={taskId}
          onStatusChange={(status, response) => onStatusChange(response.task_id, status)}
          renderResult={(result) => (
            <JobResultLink
              result={result}
              pathPrefix="/reconciliations"
              recordLabel="reconciliation run"
            />
          )}
        />
      </CardContent>
    </GlassCard>
  );
}
