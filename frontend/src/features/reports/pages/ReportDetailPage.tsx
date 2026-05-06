import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Skeleton,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

import { apiErrorDetail } from "../../../api/errors";
import type { CashflowPoint, VarianceDataPoint } from "../../../types/dashboard";
import type { FinancialReportDetailEnvelope } from "../../../types/reporting";
import { isDemoMeta } from "../../../types/reporting";
import {
  formatCurrencyDetailed,
  formatPercent,
  formatRatio,
  parseDecimal,
  trendFromSeries,
} from "../../../utils/financialFormat";
import { isValidUuid } from "../../../utils/uuid";
import { KPICard } from "../../dashboard/components/KPICard";
import { reportsApi } from "../api/reportsApi";
import type { ReportDetailChartsProps } from "../components/ReportDetailCharts";

const ReportDetailCharts = lazy(() => import("../components/ReportDetailCharts"));

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

function StatementToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport csvOptions={{ fileName: "report-pl-lines" }} />
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

function invertTrend(t: "up" | "down" | "flat"): "up" | "down" | "flat" {
  if (t === "flat") return "flat";
  return t === "up" ? "down" : "up";
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
  const detailDemo = detail != null && isDemoMeta(detail.meta);

  const ts = detail?.data.timeseries ?? [];

  const revTrend = useMemo(() => {
    if (ts.length < 2) return null;
    const a = parseDecimal(ts[ts.length - 1]?.revenue);
    const b = parseDecimal(ts[ts.length - 2]?.revenue);
    return trendFromSeries(a, b);
  }, [ts]);

  const expTrend = useMemo(() => {
    if (ts.length < 2) return null;
    const a = parseDecimal(ts[ts.length - 1]?.expenses);
    const b = parseDecimal(ts[ts.length - 2]?.expenses);
    return trendFromSeries(a, b);
  }, [ts]);

  const profitTrend = useMemo(() => {
    if (ts.length < 2) return null;
    const a = parseDecimal(ts[ts.length - 1]?.net_income);
    const b = parseDecimal(ts[ts.length - 2]?.net_income);
    return trendFromSeries(a, b);
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
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">The report link is not a valid UUID.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/reports" underline="hover" color="inherit" variant="body2">
          Reports
        </Link>
        <Typography color="text.primary" variant="body2">
          Detail
        </Typography>
      </Breadcrumbs>

      {loading && (
        <Box>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} animation="wave" />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[1, 2, 3, 4].map((k) => (
              <Grid item xs={12} sm={6} md={3} key={k}>
                <Skeleton variant="rectangular" height={100} animation="wave" sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
          <Skeleton variant="rectangular" height={280} animation="wave" sx={{ borderRadius: 1 }} />
        </Box>
      )}

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
          <Box
            sx={{
              mb: 3,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={600} gutterBottom sx={{ textTransform: "capitalize" }}>
                {snapshot.report_type} report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Period ending {snapshot.period_end}
                {snapshot.period_start ? ` · From ${snapshot.period_start}` : ""}
              </Typography>
              {lastUpdated && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Last updated {lastUpdated.toLocaleString()}
                </Typography>
              )}
            </Box>
            <Chip label={snapshot.status} color={statusChipColor(snapshot.status)} variant="outlined" />
          </Box>

          {detailDemo && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Demo report — values are synthetic until live jobs populate the database.
            </Alert>
          )}

          {detail.data.summary.quick_insights.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick insights
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {detail.data.summary.quick_insights.map((t) => (
                  <li key={t}>
                    <Typography variant="body2">{t}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {isPnL && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Revenue"
                  value={formatCurrencyDetailed(parseDecimal(snapshot.revenue))}
                  {...(revTrend ? { deltaLabel: revTrend.label, deltaTrend: revTrend.trend } : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Total expenses"
                  value={formatCurrencyDetailed(parseDecimal(detail.data.summary.total_expenses))}
                  {...(expTrend
                    ? { deltaLabel: expTrend.label, deltaTrend: invertTrend(expTrend.trend) }
                    : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Net profit"
                  value={formatCurrencyDetailed(parseDecimal(snapshot.net_income))}
                  {...(profitTrend
                    ? { deltaLabel: profitTrend.label, deltaTrend: profitTrend.trend }
                    : {})}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KPICard
                  title="Operating income"
                  value={formatCurrencyDetailed(parseDecimal(snapshot.operating_income))}
                />
              </Grid>
            </Grid>
          )}

          {isPnL && (
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <KPICard
                  title="Gross margin"
                  value={formatPercent(parseDecimal(detail.data.summary.gross_margin_pct))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KPICard
                  title="Net margin"
                  value={formatPercent(parseDecimal(detail.data.summary.net_margin_pct))}
                />
              </Grid>
            </Grid>
          )}

          {isLiquidity && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <KPICard title="Current ratio" value={formatRatio(parseDecimal(snapshot.current_ratio))} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <KPICard title="Quick ratio" value={formatRatio(parseDecimal(snapshot.quick_ratio))} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <KPICard
                  title="Working capital"
                  value={formatCurrencyDetailed(parseDecimal(snapshot.working_capital))}
                />
              </Grid>
            </Grid>
          )}

          <Card sx={{ mb: 3, transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 2 } }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Structured statement
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isPnL ? "Profit & loss" : isLiquidity ? "Liquidity & ratios" : "Report lines"}
              </Typography>
              <Box sx={{ height: 380, width: "100%" }}>
                <DataGrid
                  rows={statementRows}
                  columns={statementColumns}
                  density="compact"
                  disableRowSelectionOnClick
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
          </Card>

          <Suspense
            fallback={
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 1, mb: 3 }} animation="wave" />
            }
          >
            <Box sx={{ mb: 3 }}>
              <ReportDetailCharts {...chartProps} />
            </Box>
          </Suspense>

          <Button variant="outlined" size="small" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </>
      )}
    </Box>
  );
}
