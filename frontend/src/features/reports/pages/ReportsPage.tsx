import {
  Alert,
  Box,
  Button,
  Grid,
  Link,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { KPICard } from "../../dashboard/components/KPICard";
import { VarianceChart } from "../../dashboard/components/VarianceChart";
import type { VarianceDataPoint } from "../../../types/dashboard";
import type { FinancialReportRead, ReportsOverviewResponse } from "../../../types/reporting";
import { isDemoMeta } from "../../../types/reporting";
import { formatCurrency, formatRatio, parseDecimal } from "../../../utils/financialFormat";
import { reportsApi } from "../api/reportsApi";

function toVarianceSeries(overview: ReportsOverviewResponse | null): VarianceDataPoint[] {
  if (!overview) return [];
  return overview.time_series.map((p) => ({
    periodEnd: p.period_end,
    revenue: parseDecimal(p.revenue),
    expenses: parseDecimal(p.expenses),
    netIncome: parseDecimal(p.net_income),
  }));
}

function reportHighlight(r: FinancialReportRead): string {
  if (r.report_type === "pnl" && r.net_income != null) {
    return formatCurrency(parseDecimal(r.net_income));
  }
  if (r.report_type === "liquidity" && r.current_ratio != null) {
    return formatRatio(parseDecimal(r.current_ratio));
  }
  return "—";
}

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

function ReportsToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ fileName: "reports-recent" }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

function rowInPeriod(periodEnd: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = periodEnd.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function ReportsPage() {
  const [overview, setOverview] = useState<ReportsOverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => sessionStorage.getItem("reports-list-from") ?? "");
  const [to, setTo] = useState(() => sessionStorage.getItem("reports-list-to") ?? "");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (from) sessionStorage.setItem("reports-list-from", from);
    else sessionStorage.removeItem("reports-list-from");
  }, [from]);

  useEffect(() => {
    if (to) sessionStorage.setItem("reports-list-to", to);
    else sessionStorage.removeItem("reports-list-to");
  }, [to]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await reportsApi.getOverview();
        if (!cancelled) {
          setOverview(data);
          setLastSync(new Date());
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load reports. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const variance = toVarianceSeries(overview);
  const summary = overview?.summary;

  const filteredItems = useMemo(() => {
    const xs = overview?.items ?? [];
    return xs.filter((r) => rowInPeriod(r.period_end, from, to));
  }, [overview, from, to]);

  const gridRows = useMemo(
    () =>
      filteredItems.map((r) => ({
        id: r.id,
        report_type: r.report_type,
        status: r.status,
        period_end: r.period_end,
        key_metric: reportHighlight(r),
      })),
    [filteredItems],
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: "report_type",
        headerName: "Type",
        width: 120,
        type: "singleSelect",
        valueOptions: ["pnl", "liquidity"],
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        type: "singleSelect",
        valueOptions: ["succeeded", "failed", "running", "pending"],
        renderCell: (params) => (
          <Typography
            component="span"
            variant="body2"
            color={
              statusChipColor(String(params.value)) === "success"
                ? "success.main"
                : statusChipColor(String(params.value)) === "error"
                  ? "error.main"
                  : "text.primary"
            }
            fontWeight={500}
          >
            {String(params.value)}
          </Typography>
        ),
      },
      { field: "period_end", headerName: "Period end", width: 130, type: "string" },
      { field: "key_metric", headerName: "Key metric", flex: 1, minWidth: 120 },
      {
        field: "id",
        headerName: "Detail",
        minWidth: 220,
        flex: 0.8,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" noWrap sx={{ fontFamily: "monospace" }}>
              {String(params.value).slice(0, 8)}…
            </Typography>
            <Button
              component={RouterLink}
              to={`/reports/${params.value}`}
              size="small"
              variant="outlined"
            >
              View
            </Button>
          </Box>
        ),
      },
    ],
    [],
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Reports
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Executive summary, revenue and expense trends, and recent report jobs.
        {lastSync && (
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Updated {lastSync.toLocaleString()}
          </Typography>
        )}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField
          label="Filter from"
          type="date"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Filter to"
          type="date"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="text"
          size="small"
          onClick={() => {
            void reportsApi.getOverview().then((data) => {
              setOverview(data);
              setLastSync(new Date());
            });
          }}
          disabled={loading}
        >
          Refresh data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {overview != null && isDemoMeta(overview.meta) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo sample data — connect live report jobs to replace this view.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total revenue"
            value={summary ? formatCurrency(parseDecimal(summary.total_revenue)) : null}
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total expenses"
            value={summary ? formatCurrency(parseDecimal(summary.total_expenses)) : null}
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Net profit"
            value={summary ? formatCurrency(parseDecimal(summary.net_profit)) : null}
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Liquidity ratio"
            value={summary ? formatRatio(parseDecimal(summary.liquidity_ratio)) : null}
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Box sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 1 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue, expenses, and net income
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Succeeded PnL periods in scope
            </Typography>
            {loading ? (
              <Skeleton variant="rectangular" height={280} animation="wave" />
            ) : error ? null : variance.length === 0 ? (
              <Typography color="text.secondary">No PnL time series yet.</Typography>
            ) : (
              <VarianceChart data={variance} />
            )}
          </Box>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Recent report jobs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {overview != null ? `${overview.total_report_count} total in system` : ""}
        {filteredItems.length !== (overview?.items.length ?? 0)
          ? ` · ${filteredItems.length} shown after date filter`
          : ""}
      </Typography>

      <Box sx={{ height: 520, width: "100%" }}>
        <DataGrid
          rows={gridRows}
          columns={columns}
          loading={loading}
          density="compact"
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          slots={{ toolbar: ReportsToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 400 },
            },
          }}
        />
      </Box>

      {!loading && filteredItems.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No reports match the selected period. Adjust the date filter or clear it to see all rows.
        </Alert>
      )}

      <Typography variant="body2" sx={{ mt: 2 }}>
        <Link component={RouterLink} to="/" underline="hover">
          Back to dashboard
        </Link>
      </Typography>
    </Box>
  );
}
