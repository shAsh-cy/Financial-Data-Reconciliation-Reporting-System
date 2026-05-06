import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import type { ReconciliationRunRead } from "../../../types/reporting";
import { isDemoMeta } from "../../../types/reporting";
import { reconciliationApi } from "../api/reconciliationApi";

function statusChipColor(
  status: string,
): "default" | "success" | "error" | "info" | "warning" {
  switch (status) {
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "info";
    default:
      return "warning";
  }
}

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
  const [isDemo, setIsDemo] = useState(false);
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
      setIsDemo(isDemoMeta(data.meta));
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
        type: "singleSelect",
        valueOptions: ["succeeded", "failed", "running", "pending"],
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color={statusChipColor(String(params.value))}
            variant="outlined"
          />
        ),
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Reconciliation runs
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Ledger matching jobs, match counts, and exceptions.
        {total > 0 ? ` ${total} total.` : ""}
        {lastSync && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Updated {lastSync.toLocaleString()}
          </Typography>
        )}
      </Typography>

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

      {isDemo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo sample data — ingest transactions and run reconciliation to replace this view.
        </Alert>
      )}

      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick
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

      {!loading && runs.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No reconciliation runs yet. When jobs complete, they will appear here with sortable columns
          and CSV export.
        </Alert>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/" underline="hover">
          Back to dashboard
        </Link>
        <Button size="small" sx={{ ml: 1 }} onClick={() => void loadRuns()} disabled={loading}>
          Refresh
        </Button>
      </Typography>
    </Box>
  );
}
