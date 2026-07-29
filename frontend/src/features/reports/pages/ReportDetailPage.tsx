/**
 * ReportDetailPage — structured report detail with glass KPIs, statement grid, and charts.
 */

import {
  Alert,
  Box,
  Button,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";
import {
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { apiErrorDetail } from "@/api/errors";
import { DataTable } from "@/components/ui/DataTable";
import { GlassCard } from "@/components/ui/GlassCard";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { StatusChip } from "@/components/ui/StatusChip";
import type { CashflowPoint, VarianceDataPoint } from "@/types/dashboard";
import type { FinancialReportDetailEnvelope } from "@/types/reporting";
import { activateDemoFromMeta } from "@/app/state/demoStore";
import {
  formatCurrencyDetailed,
  formatPercent,
  formatRatio,
  parseDecimal,
  trendFromSeries,
} from "@/utils/financialFormat";
import { trendToDeltaType } from "@/utils/kpiHelpers";
import { isValidUuid } from "@/utils/uuid";

import { reportsApi } from "../api/reportsApi";
import type { ReportDetailChartsProps } from "../components/ReportDetailCharts";

const ReportDetailCharts = lazy(() => import("../components/ReportDetailCharts"));

function StatementToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ fileName: "report-pl-lines" }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [detail, setDetail] = useState<FinancialReportDetailEnvelope | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [badId, setBadId] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!reportId || !isValidUuid(reportId)) {
      setBadId(true);
      setLoading(false);
      return;
    }
    setBadId(false);
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const detailRes = await reportsApi.getReport(reportId);
      if (!detailRes?.data?.summary?.snapshot) {
        setNotFound(true);
        setDetail(null);
        return;
      }
      setDetail(detailRes);
      activateDemoFromMeta(detailRes.meta);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      const { status, message } = apiErrorDetail(e, "Failed to load report.");
      if (import.meta.env.DEV && status === 404) {
        console.warn(
          "[reports] GET detail 404 — check API and VITE_API_BASE_URL (origin only, no /api/v1 suffix).",
        );
      }
      if (status === 404) {
        setNotFound(true);
        setDetail(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const snapshot = detail?.data.summary.snapshot;
  const isPnL = snapshot?.report_type === "pnl";
  const isLiquidity = snapshot?.report_type === "liquidity";
  const ts = detail?.data.timeseries ?? [];

  const revTrend = useMemo(() => {
    if (ts.length < 2) return null;
    return trendFromSeries(parseDecimal(ts[ts.length - 1]?.revenue), parseDecimal(ts[ts.length - 2]?.revenue));
  }, [ts]);

  const expTrend = useMemo(() => {
    if (ts.length < 2) return null;
    return trendFromSeries(parseDecimal(ts[ts.length - 1]?.expenses), parseDecimal(ts[ts.length - 2]?.expenses));
  }, [ts]);

  const profitTrend = useMemo(() => {
    if (ts.length < 2) return null;
    return trendFromSeries(parseDecimal(ts[ts.length - 1]?.net_income), parseDecimal(ts[ts.length - 2]?.net_income));
  }, [ts]);

  const chartProps: ReportDetailChartsProps | null = useMemo(() => {
    if (!detail) return null;
    const lineSeries: VarianceDataPoint[] = detail.data.timeseries.map((p) => ({
      periodEnd: p.period_end,
      revenue: parseDecimal(p.revenue),
      expenses: parseDecimal(p.expenses),
      netIncome: parseDecimal(p.net_income),
    }));
    const cashflowSeries: CashflowPoint[] = detail.data.timeseries.map((p) => {
      let periodLabel = p.period_end;
      try {
        periodLabel = new Date(p.period_end).toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        });
      } catch {
        /* ignore */
      }
      return {
        periodEnd: p.period_end,
        periodLabel,
        cashflow: parseDecimal(p.cashflow ?? p.net_income),
      };
    });
    const revenueSlices = detail.data.breakdown
      .filter((b) => b.segment === "revenue" && parseDecimal(b.amount) > 0)
      .map((b) => ({ name: b.name, value: parseDecimal(b.amount) }));
    const expenseSlices = detail.data.breakdown
      .filter((b) => b.segment === "expense" && parseDecimal(b.amount) > 0)
      .map((b) => ({ name: b.name, value: parseDecimal(b.amount) }));
    const liquiditySlices = detail.data.breakdown
      .filter((b) => b.segment === "liquidity" && parseDecimal(b.amount) > 0)
      .map((b) => ({ name: b.name, value: parseDecimal(b.amount) }));
    return {
      reportType: detail.data.summary.snapshot.report_type,
      lineSeries,
      cashflowSeries,
      revenueSlices,
      expenseSlices,
      liquiditySlices,
    };
  }, [detail]);

  const statementColumns: GridColDef[] = useMemo(
    () => [
      { field: "label", headerName: "Line item", flex: 1, minWidth: 200 },
      {
        field: "line_kind",
        headerName: "Type",
        width: 120,
        type: "singleSelect",
        valueOptions: [
          { value: "revenue", label: "Revenue" },
          { value: "expense", label: "Expense" },
          { value: "subtotal", label: "Subtotal" },
          { value: "metric", label: "Metric" },
          { value: "ratio", label: "Ratio" },
        ],
      },
      {
        field: "amount",
        headerName: "Value",
        width: 160,
        valueGetter: (_, row) => {
          const kind = row.line_kind as string;
          const raw = row.amount as string | null;
          if (kind === "ratio") return formatRatio(parseDecimal(raw));
          return formatCurrencyDetailed(parseDecimal(raw));
        },
      },
    ],
    [],
  );

  const statementRows = useMemo(() => {
    const lines = detail?.data.summary.statement_lines ?? [];
    return lines.map((line, index) => ({
      id: index,
      label: line.label,
      line_kind: line.line_kind,
      amount: line.amount,
    }));
  }, [detail]);

  if (!reportId) return null;

  if (badId) {
    return (
      <Alert severity="warning">The report link is not a valid UUID.</Alert>
    );
  }

  if (loading) {
    return (
      <Box>
        <SkeletonCard height={80} />
        <Grid container spacing={3} sx={{ mt: 1, mb: 3 }}>
          {[1, 2, 3, 4].map((k) => (
            <Grid item xs={12} sm={6} md={3} key={k}>
              <SkeletonCard height={140} />
            </Grid>
          ))}
        </Grid>
        <SkeletonCard height={380} />
        <Box sx={{ mt: 3 }}>
          <SkeletonCard height={320} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {!loading && notFound && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This report was not found. It may have been deleted or the link may be invalid.
        </Alert>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {!loading && snapshot != null && detail != null && chartProps != null && (
        <>
          <PageHeader
            title={`${snapshot.report_type} report`}
            subtitle={`Period ending ${snapshot.period_end}${
              snapshot.period_start ? ` · From ${snapshot.period_start}` : ""
            }${lastUpdated ? ` · Updated ${lastUpdated.toLocaleString()}` : ""}`}
            actions={
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <StatusChip status={snapshot.status} />
                <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading}>
                  Refresh
                </Button>
              </Box>
            }
          />

          {detail.data.summary.quick_insights.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick insights
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                {detail.data.summary.quick_insights.map((t) => (
                  <li key={t}>
                    <Typography variant="body2">{t}</Typography>
                  </li>
                ))}
              </Box>
            </Alert>
          )}

          {isPnL && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  label="Revenue"
                  value={parseDecimal(snapshot.revenue)}
                  prefix="$"
                  decimals={0}
                  {...(revTrend
                    ? { delta: Math.abs(revTrend.deltaPct), deltaType: trendToDeltaType(revTrend.trend) }
                    : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  label="Total expenses"
                  value={parseDecimal(detail.data.summary.total_expenses)}
                  prefix="$"
                  decimals={0}
                  {...(expTrend
                    ? { delta: Math.abs(expTrend.deltaPct), deltaType: trendToDeltaType(expTrend.trend, true) }
                    : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  label="Net profit"
                  value={parseDecimal(snapshot.net_income)}
                  prefix="$"
                  decimals={0}
                  {...(profitTrend
                    ? { delta: Math.abs(profitTrend.deltaPct), deltaType: trendToDeltaType(profitTrend.trend) }
                    : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  label="Operating income"
                  value={parseDecimal(snapshot.operating_income)}
                  prefix="$"
                  decimals={0}
                />
              </Grid>
            </Grid>
          )}

          {isPnL && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <KPICard
                  label="Gross margin"
                  value={parseDecimal(detail.data.summary.gross_margin_pct)}
                  suffix="%"
                  decimals={1}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KPICard
                  label="Net margin"
                  value={parseDecimal(detail.data.summary.net_margin_pct)}
                  suffix="%"
                  decimals={1}
                />
              </Grid>
            </Grid>
          )}

          {isLiquidity && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <KPICard label="Current ratio" value={parseDecimal(snapshot.current_ratio)} decimals={2} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <KPICard label="Quick ratio" value={parseDecimal(snapshot.quick_ratio)} decimals={2} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <KPICard
                  label="Working capital"
                  value={parseDecimal(snapshot.working_capital)}
                  prefix="$"
                  decimals={0}
                />
              </Grid>
            </Grid>
          )}

          <GlassCard animateEntrance={false} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Structured statement
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isPnL ? "Profit & loss" : isLiquidity ? "Liquidity & ratios" : "Report lines"}
              </Typography>
              <Box sx={{ height: 380, width: "100%" }}>
                <DataTable
                  rows={statementRows}
                  columns={statementColumns}
                  pageSizeOptions={[10, 25]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  slots={{ toolbar: StatementToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                      quickFilterProps: { debounceMs: 400 },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </GlassCard>

          <Suspense fallback={<SkeletonCard height={320} />}>
            <Box sx={{ mb: 3 }}>
              <ReportDetailCharts {...chartProps} />
            </Box>
          </Suspense>
        </>
      )}
    </Box>
  );
}
