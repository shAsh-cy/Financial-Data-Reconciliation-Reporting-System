import { Grid } from "@mui/material";

import type { ExpenseSlice } from "./ExpenseBreakdownChart";
import { CashflowAreaChart } from "./CashflowAreaChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { MatchRatioPieChart } from "./MatchRatioPieChart";
import { ReconciliationStatusBarChart } from "./ReconciliationStatusBarChart";
import type { CashflowPoint, MatchSlice, ReconciliationStatusSummary, VarianceDataPoint } from "../../../types/dashboard";
import { VarianceChartCard } from "./VarianceChartCard";

export type DashboardChartsSectionProps = {
  varianceData: VarianceDataPoint[];
  cashflowPoints: CashflowPoint[];
  expenseSlices: ExpenseSlice[];
  matchSlices: MatchSlice[];
  reconciliationSummary: ReconciliationStatusSummary;
  reportsLoading: boolean;
  runsLoading: boolean;
  reportsError: string | null;
  runsError: string | null;
};

export function DashboardChartsSection({
  varianceData,
  cashflowPoints,
  expenseSlices,
  matchSlices,
  reconciliationSummary,
  reportsLoading,
  runsLoading,
  reportsError,
  runsError,
}: DashboardChartsSectionProps) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <VarianceChartCard
          data={varianceData}
          loading={reportsLoading}
          error={reportsError}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <CashflowAreaChart data={cashflowPoints} loading={reportsLoading} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ExpenseBreakdownChart data={expenseSlices} loading={reportsLoading} />
      </Grid>
      <Grid item xs={12} md={6}>
        <MatchRatioPieChart data={matchSlices} loading={runsLoading} />
      </Grid>
      <Grid item xs={12} md={6}>
        <ReconciliationStatusBarChart
          summary={reconciliationSummary}
          loading={runsLoading}
          error={runsError}
        />
      </Grid>
    </Grid>
  );
}
