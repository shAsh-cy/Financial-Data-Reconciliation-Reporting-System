import { Alert, Box, Grid, Typography } from "@mui/material";

import { useAuth } from "../../../app/state/useAuth";
import { useReports } from "../../../hooks/useReports";
import { useReconciliations } from "../../../hooks/useReconciliations";
import { useDashboardMetrics } from "../../../hooks/useDashboardMetrics";
import { KPICard } from "../components/KPICard";
import { VarianceChartCard } from "../components/VarianceChartCard";
import { ReconciliationSummary } from "../components/ReconciliationSummary";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRatio(value: number | null): string {
  if (value == null) return "—";
  return value.toFixed(2);
}

export function DashboardPage() {
  const { user } = useAuth();
  const { reports, loading: reportsLoading, error: reportsError } = useReports({
    pollWhenRunning: true,
    pollIntervalMs: 15_000,
  });
  const { runs, loading: runsLoading, error: runsError } = useReconciliations({
    pollWhenRunning: true,
    pollIntervalMs: 10_000,
  });

  const { metrics, varianceData, reconciliationSummary } = useDashboardMetrics(
    reports,
    runs,
  );

  const loading = reportsLoading || runsLoading;
  const hasError = reportsError || runsError;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Financial Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {user?.role === "admin"
          ? "Full access to financial metrics and reconciliation status."
          : user?.role === "accountant"
            ? "Financial dashboards and reconciliation workflows."
            : "Read-only dashboard view."}
      </Typography>

      {hasError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {reportsError || runsError}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={formatCurrency(metrics.totalRevenue)}
            loading={loading}
            error={reportsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Expenses"
            value={formatCurrency(metrics.totalExpenses)}
            loading={loading}
            error={reportsError}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Net Profit"
            value={formatCurrency(metrics.netProfit)}
            loading={loading}
            error={reportsError}
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

        <Grid item xs={12}>
          <VarianceChartCard
            data={varianceData}
            loading={loading}
            error={reportsError}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ReconciliationSummary
            summary={reconciliationSummary}
            loading={runsLoading}
            error={runsError}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
