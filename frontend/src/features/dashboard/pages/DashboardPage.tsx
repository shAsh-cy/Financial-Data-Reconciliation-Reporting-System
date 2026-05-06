import {
  Alert,
  Box,
  Button,
  Grid,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../app/state/useAuth";
import { useReports } from "../../../hooks/useReports";
import { useReconciliations } from "../../../hooks/useReconciliations";
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics";
import type { FinancialReportRead } from "../../../types/reporting";
import { formatCurrency, formatRatio, trendFromSeries } from "../../../utils/financialFormat";
import { KPICard } from "../components/KPICard";
import type { ExpenseSlice } from "../components/ExpenseBreakdownChart";

const DashboardChartsSection = lazy(() =>
  import("../components/DashboardChartsSection").then((m) => ({ default: m.DashboardChartsSection })),
);

function deriveExpenseSlices(reports: FinancialReportRead[]): ExpenseSlice[] {
  const pnl = reports
    .filter((r) => r.report_type === "pnl" && r.status === "succeeded")
    .sort((a, b) => (b.period_end > a.period_end ? 1 : -1))[0];
  if (!pnl) return [];
  const parse = (s: string | null) => {
    if (s == null || s === "") return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };
  return [
    { name: "COGS", value: parse(pnl.cost_of_goods_sold) },
    { name: "OpEx", value: parse(pnl.operating_expenses) },
    { name: "Other", value: parse(pnl.other_expenses) },
  ];
}

function rowInPeriod(iso: string | null | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = (iso ?? "").slice(0, 10);
  if (!d) return true;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export function DashboardPage() {
  const { user } = useAuth();
  const {
    reports,
    isDemo: reportsDemo,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useReports({
    pollWhenRunning: true,
    pollIntervalMs: 15_000,
  });
  const {
    runs,
    isDemo: runsDemo,
    loading: runsLoading,
    error: runsError,
    refetch: refetchRuns,
  } = useReconciliations({
    pollWhenRunning: true,
    pollIntervalMs: 10_000,
  });

  const [from, setFrom] = useState(() => sessionStorage.getItem("dash-period-from") ?? "");
  const [to, setTo] = useState(() => sessionStorage.getItem("dash-period-to") ?? "");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (from) sessionStorage.setItem("dash-period-from", from);
    else sessionStorage.removeItem("dash-period-from");
  }, [from]);

  useEffect(() => {
    if (to) sessionStorage.setItem("dash-period-to", to);
    else sessionStorage.removeItem("dash-period-to");
  }, [to]);

  const filteredReports = useMemo(
    () => reports.filter((r) => rowInPeriod(r.period_end, from, to)),
    [reports, from, to],
  );
  const filteredRuns = useMemo(
    () =>
      runs.filter((r) =>
        rowInPeriod(r.finished_at ?? r.started_at ?? r.created_at, from, to),
      ),
    [runs, from, to],
  );

  const { metrics, varianceData, cashflowPoints, matchSlices, reconciliationSummary, insights } =
    useDashboardMetrics(filteredReports, filteredRuns);

  const expenseSlices = useMemo(() => deriveExpenseSlices(filteredReports), [filteredReports]);

  const loading = reportsLoading || runsLoading;
  const hasError = reportsError || runsError;

  const revTrend = useMemo(() => {
    if (varianceData.length < 2) return null;
    const a = varianceData[varianceData.length - 1]!;
    const b = varianceData[varianceData.length - 2]!;
    return trendFromSeries(a.revenue, b.revenue);
  }, [varianceData]);

  const expTrend = useMemo(() => {
    if (varianceData.length < 2) return null;
    const a = varianceData[varianceData.length - 1]!;
    const b = varianceData[varianceData.length - 2]!;
    return trendFromSeries(a.expenses, b.expenses);
  }, [varianceData]);

  const profitTrend = useMemo(() => {
    if (varianceData.length < 2) return null;
    const a = varianceData[varianceData.length - 1]!;
    const b = varianceData[varianceData.length - 2]!;
    return trendFromSeries(a.netIncome, b.netIncome);
  }, [varianceData]);

  function invertTrend(t: "up" | "down" | "flat"): "up" | "down" | "flat" {
    if (t === "flat") return "flat";
    return t === "up" ? "down" : "up";
  }

  useEffect(() => {
    if (!loading && lastSync == null) setLastSync(new Date());
  }, [loading, lastSync]);

  const handleRefresh = () => {
    void Promise.all([Promise.resolve(refetchReports()), Promise.resolve(refetchRuns())]).then(() =>
      setLastSync(new Date()),
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Financial Overview
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {user?.role === "admin"
          ? "Full access to financial metrics and reconciliation status."
          : user?.role === "accountant"
            ? "Financial dashboards and reconciliation workflows."
            : "Read-only dashboard view."}
      </Typography>

      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          label="Period from"
          type="date"
          size="small"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Period to"
          type="date"
          size="small"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="outlined" size="small" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
        {lastSync && (
          <Typography variant="caption" color="text.secondary">
            Last updated {lastSync.toLocaleString()}
          </Typography>
        )}
      </Box>

      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {reportsError || runsError}
        </Alert>
      )}

      {(reportsDemo || runsDemo) && !hasError && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Showing sample metrics where live data is not available yet.
        </Alert>
      )}

      {insights.length > 0 && !hasError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick insights
          </Typography>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {insights.map((t) => (
              <li key={t}>
                <Typography variant="body2">{t}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            loading={loading}
            error={reportsError}
            {...(revTrend
              ? { deltaLabel: revTrend.label, deltaTrend: revTrend.trend }
              : {})}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Expenses"
            value={formatCurrency(metrics.totalExpenses)}
            loading={loading}
            error={reportsError}
            {...(expTrend
              ? { deltaLabel: expTrend.label, deltaTrend: invertTrend(expTrend.trend) }
              : {})}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Net Profit"
            value={formatCurrency(metrics.netProfit)}
            loading={loading}
            error={reportsError}
            {...(profitTrend
              ? { deltaLabel: profitTrend.label, deltaTrend: profitTrend.trend }
              : {})}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Liquidity Ratio"
            value={formatRatio(metrics.liquidityRatio)}
            loading={loading}
            error={reportsError}
          />
        </Grid>
      </Grid>

      <Suspense
        fallback={
          <Grid container spacing={3}>
            {[1, 2, 3].map((k) => (
              <Grid item xs={12} key={k}>
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} animation="wave" />
              </Grid>
            ))}
          </Grid>
        }
      >
        <DashboardChartsSection
          varianceData={varianceData}
          cashflowPoints={cashflowPoints}
          expenseSlices={expenseSlices}
          matchSlices={matchSlices}
          reconciliationSummary={reconciliationSummary}
          reportsLoading={reportsLoading}
          runsLoading={runsLoading}
          reportsError={reportsError}
          runsError={runsError}
        />
      </Suspense>
    </Box>
  );
}
