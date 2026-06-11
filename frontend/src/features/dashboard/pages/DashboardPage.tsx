/**
 * DashboardPage — financial overview with glass KPIs, animated charts, and demo banner.
 */

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Alert,
  Box,
  Button,
  CardContent,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

import { GlassCard } from "@/components/ui/GlassCard";
import { KPICard } from "@/components/ui/KPICard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useAuth } from "@/app/state/useAuth";
import { useReports } from "@/hooks/useReports";
import { useReconciliations } from "@/hooks/useReconciliations";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import type { FinancialReportRead } from "@/types/reporting";
import { trendFromSeries } from "@/utils/financialFormat";
import { trendToDeltaType } from "@/utils/kpiHelpers";

import type { ExpenseSlice } from "../components/ExpenseBreakdownChart";

const DashboardChartsSection = lazy(() =>
  import("../components/DashboardChartsSection").then((m) => ({ default: m.DashboardChartsSection })),
);

const DEMO_BANNER_KEY = "demo-banner-dismissed";

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
  const [demoDismissed, setDemoDismissed] = useState(
    () => sessionStorage.getItem(DEMO_BANNER_KEY) === "1",
  );

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
  const hasError = Boolean(reportsError || runsError);
  const showDemo = (reportsDemo || runsDemo) && !hasError && !demoDismissed;

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

  const revenueSparkline = useMemo(() => varianceData.map((d) => d.revenue), [varianceData]);

  useEffect(() => {
    if (!loading && lastSync == null) setLastSync(new Date());
  }, [loading, lastSync]);

  const handleRefresh = () => {
    void Promise.all([Promise.resolve(refetchReports()), Promise.resolve(refetchRuns())]).then(() =>
      setLastSync(new Date()),
    );
  };

  const dismissDemo = () => {
    sessionStorage.setItem(DEMO_BANNER_KEY, "1");
    setDemoDismissed(true);
  };

  const subtitle =
    user?.role === "admin"
      ? "Full access to financial metrics and reconciliation status."
      : user?.role === "accountant"
        ? "Financial dashboards and reconciliation workflows."
        : "Read-only dashboard view.";

  const periodControls = (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
      <TextField
        label="Period from"
        type="date"
        size="small"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="Period to"
        type="date"
        size="small"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
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
  );

  return (
    <Box>
      <PageHeader title="Financial Overview" subtitle={subtitle} actions={periodControls} />

      {showDemo && (
        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{ mb: 2 }}
          onClose={dismissDemo}
        >
          <strong>Demo Mode</strong> — Showing sample metrics where live data is not available yet.
        </Alert>
      )}

      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {reportsError || runsError}
        </Alert>
      )}

      {insights.length > 0 && !hasError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick insights
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
            {insights.map((t) => (
              <li key={t}>
                <Typography variant="body2">{t}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <SkeletonCard height={140} />
          ) : reportsError ? (
            <GlassCard animateEntrance={false}>
              <CardContent>
                <Typography color="error" variant="body2">{reportsError}</Typography>
              </CardContent>
            </GlassCard>
          ) : (
            <KPICard
              label="Total Revenue"
              value={metrics.totalRevenue}
              prefix="$"
              decimals={0}
              sparklineData={revenueSparkline}
              {...(revTrend
                ? {
                    delta: Math.abs(revTrend.deltaPct),
                    deltaType: trendToDeltaType(revTrend.trend),
                  }
                : {})}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <SkeletonCard height={140} />
          ) : reportsError ? (
            <GlassCard animateEntrance={false}>
              <CardContent>
                <Typography color="error" variant="body2">{reportsError}</Typography>
              </CardContent>
            </GlassCard>
          ) : (
            <KPICard
              label="Total Expenses"
              value={metrics.totalExpenses}
              prefix="$"
              decimals={0}
              {...(expTrend
                ? {
                    delta: Math.abs(expTrend.deltaPct),
                    deltaType: trendToDeltaType(expTrend.trend, true),
                  }
                : {})}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <SkeletonCard height={140} />
          ) : reportsError ? (
            <GlassCard animateEntrance={false}>
              <CardContent>
                <Typography color="error" variant="body2">{reportsError}</Typography>
              </CardContent>
            </GlassCard>
          ) : (
            <KPICard
              label="Net Profit"
              value={metrics.netProfit}
              prefix="$"
              decimals={0}
              {...(profitTrend
                ? {
                    delta: Math.abs(profitTrend.deltaPct),
                    deltaType: trendToDeltaType(profitTrend.trend),
                  }
                : {})}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {loading ? (
            <SkeletonCard height={140} />
          ) : reportsError ? (
            <GlassCard animateEntrance={false}>
              <CardContent>
                <Typography color="error" variant="body2">{reportsError}</Typography>
              </CardContent>
            </GlassCard>
          ) : metrics.liquidityRatio != null ? (
            <KPICard
              label="Liquidity Ratio"
              value={metrics.liquidityRatio}
              decimals={2}
            />
          ) : (
            <GlassCard animateEntrance={false}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Liquidity Ratio
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  —
                </Typography>
              </CardContent>
            </GlassCard>
          )}
        </Grid>
      </Grid>

      <Suspense
        fallback={
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5].map((k) => (
              <Grid item xs={12} md={k === 1 ? 12 : 6} key={k}>
                <SkeletonCard height={k === 1 ? 360 : 340} />
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
