/**
 * OperationsPage — the operator hub: trigger reconciliation and report jobs,
 * watch each task poll to completion, and review this session's job history.
 */

import RefreshIcon from "@mui/icons-material/Refresh";
import { Alert, Box, Button, Grid } from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useCallback } from "react";

import { PageHeader } from "../../../components/ui/PageHeader";
import { SkeletonCard } from "../../../components/ui/SkeletonCard";
import { useJobHistory } from "../../../hooks/useJobHistory";
import { useLedgers } from "../../../hooks/useLedgers";
import type { JobStatusValue } from "../../../types/jobs";
import { JobHistoryCard } from "../components/JobHistoryCard";
import { ReconciliationJobCard } from "../components/ReconciliationJobCard";
import { ReportJobCard } from "../components/ReportJobCard";

export function OperationsPage() {
  const { ledgers, loading: ledgersLoading, error: ledgersError, refetch } = useLedgers();
  const { entries, record, syncStatus } = useJobHistory();

  const handleReconciliationTriggered = useCallback(
    (taskId: string) => record(taskId, "reconciliation"),
    [record],
  );
  const handlePnlTriggered = useCallback((taskId: string) => record(taskId, "pnl"), [record]);
  const handleLiquidityTriggered = useCallback(
    (taskId: string) => record(taskId, "liquidity"),
    [record],
  );
  const handleStatusChange = useCallback(
    (taskId: string, status: JobStatusValue) => syncStatus(taskId, status),
    [syncStatus],
  );

  return (
    <Box>
      <PageHeader
        title="Operations"
        subtitle="Trigger reconciliation and reporting jobs, then watch them run in real time."
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={() => void refetch()}
            disabled={ledgersLoading}
          >
            Reload ledgers
          </Button>
        }
      />

      {ledgersError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          {ledgersError}
        </Alert>
      )}

      {!ledgersError && !ledgersLoading && ledgers.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No ledgers exist yet. An admin can create one with{" "}
          <code>POST /api/v1/ledgers</code> before jobs can be queued.
        </Alert>
      )}

      {ledgersLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((k) => (
            <Grid item xs={12} md={4} key={k}>
              <SkeletonCard height={340} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <SkeletonCard height={380} />
          </Grid>
        </Grid>
      ) : (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ReconciliationJobCard
                ledgers={ledgers}
                ledgersLoading={ledgersLoading}
                onTriggered={handleReconciliationTriggered}
                onStatusChange={handleStatusChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ReportJobCard
                variant="pnl"
                ledgers={ledgers}
                ledgersLoading={ledgersLoading}
                onTriggered={handlePnlTriggered}
                onStatusChange={handleStatusChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <ReportJobCard
                variant="liquidity"
                ledgers={ledgers}
                ledgersLoading={ledgersLoading}
                onTriggered={handleLiquidityTriggered}
                onStatusChange={handleStatusChange}
              />
            </Grid>
            <Grid item xs={12}>
              <JobHistoryCard entries={entries} />
            </Grid>
          </Grid>
        </LocalizationProvider>
      )}
    </Box>
  );
}
