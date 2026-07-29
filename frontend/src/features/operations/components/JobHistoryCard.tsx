/**
 * JobHistoryCard — the last 10 jobs triggered from this browser session, with
 * live status refreshed by useJobHistory's 5s poll.
 */

import HistoryIcon from "@mui/icons-material/History";
import { Box, CardContent, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";

import { DataTable } from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { GlassCard } from "../../../components/ui/GlassCard";
import { StatusChip } from "../../../components/ui/StatusChip";
import type { OpsJobHistoryEntry, OpsJobType } from "../../../types/jobs";

export type JobHistoryCardProps = {
  entries: OpsJobHistoryEntry[];
};

const TYPE_LABELS: Record<OpsJobType, string> = {
  reconciliation: "Reconciliation",
  pnl: "P&L Report",
  liquidity: "Liquidity Report",
  ingest: "Transaction Ingest",
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function JobHistoryCard({ entries }: JobHistoryCardProps) {
  const rows = useMemo(
    () =>
      entries.map((entry) => ({
        id: entry.task_id,
        task_id: entry.task_id,
        type: TYPE_LABELS[entry.type],
        triggered_at: formatWhen(entry.triggered_at),
        status: entry.status,
      })),
    [entries],
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "task_id",
        headerName: "Task ID",
        flex: 1.4,
        minWidth: 260,
        renderCell: (params) => (
          <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
            {String(params.value)}
          </Typography>
        ),
      },
      { field: "type", headerName: "Job", flex: 1, minWidth: 160 },
      { field: "triggered_at", headerName: "Triggered", flex: 1, minWidth: 180 },
      {
        field: "status",
        headerName: "Status",
        flex: 0.6,
        minWidth: 130,
        renderCell: (params) => <StatusChip status={String(params.value)} />,
      },
    ],
    [],
  );

  return (
    <GlassCard>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Active jobs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          The last {rows.length > 0 ? rows.length : 10} jobs triggered from this session. Non-terminal
          tasks refresh every 5 seconds.
        </Typography>

        {rows.length === 0 ? (
          <EmptyState
            icon={<HistoryIcon fontSize="inherit" />}
            title="No jobs triggered yet"
            subtitle="Queue a reconciliation or report above and it will appear here with live status."
          />
        ) : (
          <Box sx={{ height: 380 }}>
            <DataTable
              rows={rows}
              columns={columns}
              hideFooterSelectedRowCount
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10]}
            />
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );
}
