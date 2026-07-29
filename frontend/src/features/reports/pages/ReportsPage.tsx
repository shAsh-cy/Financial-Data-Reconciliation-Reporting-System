/**
 * ReportsPage — executive reports list with glass KPIs, chart, and DataTable.
 */

import {
  Alert,
  Box,
  Button,
  CardContent,
  Grid,
  TextField,
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
import { GlassCard } from "@/components/ui/GlassCard";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StatusChip } from "@/components/ui/StatusChip";
import { VarianceChart } from "@/features/dashboard/components/VarianceChart";
import type { VarianceDataPoint } from "@/types/dashboard";
import { activateDemoFromMeta } from "@/app/state/demoStore";
import type { FinancialReportRead, ReportsOverviewResponse } from "@/types/reporting";
import { parseDecimal } from "@/utils/financialFormat";

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
    return `$${parseDecimal(r.net_income).toLocaleString()}`;
  }
  if (r.report_type === "liquidity" && r.current_ratio != null) {
    return parseDecimal(r.current_ratio).toFixed(2);
  }
  return "—";
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

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getOverview();
      setOverview(data);
      activateDemoFromMeta(data.meta);
      setLastSync(new Date());
    } catch {
      setError("Unable to load reports. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

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
        width: 140,
        renderCell: (params) => <StatusChip status={String(params.value)} />,
      },
      { field: "period_end", headerName: "Period end", width: 130 },
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

  const filterActions = (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
      <TextField
        label="Filter from"
        type="date"
        size="small"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="Filter to"
        type="date"
        size="small"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button variant="outlined" size="small" onClick={() => void loadOverview()} disabled={loading}>
        Refresh
      </Button>
    </Box>
  );

  const subtitle = `Executive summary, revenue and expense trends, and recent report jobs.${
    lastSync ? ` Updated ${lastSync.toLocaleString()}.` : ""
  }`;

  return (
    <Box>
      <PageHeader title="Reports" subtitle={subtitle} actions={filterActions} />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void loadOverview()} disabled={loading}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Total revenue", value: summary ? parseDecimal(summary.total_revenue) : 0, prefix: "$" as const },
          { label: "Total expenses", value: summary ? parseDecimal(summary.total_expenses) : 0, prefix: "$" as const },
          { label: "Net profit", value: summary ? parseDecimal(summary.net_profit) : 0, prefix: "$" as const },
          {
            label: "Liquidity ratio",
            value: summary ? parseDecimal(summary.liquidity_ratio) : 0,
            decimals: 2,
          },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            {loading ? (
              <SkeletonCard height={140} />
            ) : error ? (
              <GlassCard animateEntrance={false}>
                <CardContent>
                  <Typography color="error" variant="body2">{error}</Typography>
                </CardContent>
              </GlassCard>
            ) : (
              <KPICard
                label={kpi.label}
                value={kpi.value}
                decimals={kpi.decimals ?? 0}
                {...(kpi.prefix !== undefined ? { prefix: kpi.prefix } : {})}
              />
            )}
          </Grid>
        ))}
      </Grid>

      {loading ? (
        <SkeletonCard height={360} />
      ) : (
        <GlassCard animateEntrance={false} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue, expenses, and net income
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Succeeded PnL periods in scope
            </Typography>
            {error ? null : variance.length === 0 ? (
              <Typography color="text.secondary">No PnL time series yet.</Typography>
            ) : (
              <VarianceChart data={variance} />
            )}
          </CardContent>
        </GlassCard>
      )}

      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Recent report jobs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {overview != null ? `${overview.total_report_count} total in system` : ""}
        {filteredItems.length !== (overview?.items.length ?? 0)
          ? ` · ${filteredItems.length} shown after date filter`
          : ""}
      </Typography>

      {loading ? (
        <SkeletonCard height={520} />
      ) : !error && filteredItems.length === 0 ? (
        <EmptyState
          title="No reports found"
          subtitle="Adjust the date filter or clear it to see all rows."
          actionLabel="Clear filters"
          onAction={() => {
            setFrom("");
            setTo("");
          }}
        />
      ) : (
        <Box sx={{ height: 520, width: "100%" }}>
          <DataTable
            rows={gridRows}
            columns={columns}
            loading={loading}
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
      )}
    </Box>
  );
}
