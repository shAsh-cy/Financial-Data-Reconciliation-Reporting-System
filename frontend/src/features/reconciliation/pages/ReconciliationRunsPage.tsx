/**
 * ReconciliationRunsPage — reconciliation runs list with DataTable and status chips.
 */

import {
  Alert,
  Box,
  Button,
  Typography,
} from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { activateDemoFromMeta } from "@/app/state/demoStore";
import type { ReconciliationRunRead } from "@/types/reporting";

import { reconciliationApi } from "../api/reconciliationApi";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function RunsToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ fileName: "reconciliation-runs" }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

export function ReconciliationRunsPage() {
  const [runs, setRuns] = useState<ReconciliationRunRead[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reconciliationApi.listRuns(100, 0);
      setRuns(data.items);
      setTotal(data.total);
      activateDemoFromMeta(data.meta);
      setLastSync(new Date());
    } catch {
      setError("Failed to load reconciliation runs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const rows = useMemo(
    () =>
      runs.map((r) => ({
        id: r.id,
        started_at: r.started_at ?? r.created_at,
        status: r.status,
        matched_count: r.matched_count,
        unmatched_count: r.unmatched_count,
      })),
    [runs],
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "started_at",
        headerName: "Started",
        flex: 1,
        minWidth: 180,
        valueFormatter: (v) => formatWhen(v as string | null),
      },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        renderCell: (params) => <StatusChip status={String(params.value)} />,
      },
      {
        field: "matched_count",
        headerName: "Matched",
        width: 110,
        type: "number",
        align: "right",
        headerAlign: "right",
      },
      {
        field: "unmatched_count",
        headerName: "Unmatched",
        width: 120,
        type: "number",
        align: "right",
        headerAlign: "right",
      },
      {
        field: "open",
        headerName: "",
        sortable: false,
        filterable: false,
        width: 100,
        renderCell: (params) => (
          <Button
            component={RouterLink}
            to={`/reconciliations/${params.row.id}`}
            size="small"
            variant="outlined"
          >
            Open
          </Button>
        ),
      },
    ],
    [],
  );

  const headerActions = (
    <Button variant="outlined" size="small" onClick={() => void loadRuns()} disabled={loading}>
      Refresh
    </Button>
  );

  const subtitle = `Ledger matching jobs, match counts, and exceptions.${
    total > 0 ? ` ${total} total.` : ""
  }${lastSync ? ` Updated ${lastSync.toLocaleString()}.` : ""}`;

  return (
    <Box>
      <PageHeader
        title="Reconciliation runs"
        subtitle={subtitle}
        actions={headerActions}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void loadRuns()} disabled={loading}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <SkeletonCard height={520} />
      ) : !error && runs.length === 0 ? (
        <EmptyState
          title="No reconciliation runs yet"
          subtitle="When jobs complete, they will appear here with sortable columns and CSV export."
        />
      ) : (
        <Box sx={{ height: 520, width: "100%" }}>
          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
            slots={{ toolbar: RunsToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 400 },
              },
            }}
          />
        </Box>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <Button component={RouterLink} to="/" size="small" variant="text">
          Back to dashboard
        </Button>
      </Typography>
    </Box>
  );
}
