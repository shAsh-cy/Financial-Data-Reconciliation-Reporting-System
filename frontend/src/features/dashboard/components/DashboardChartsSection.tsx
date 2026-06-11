/**
 * DashboardChartsSection — stagger-animated chart grid for the dashboard.
 */

import { Grid } from "@mui/material";
import { motion } from "framer-motion";

import { staggerContainer, staggerItem } from "@/lib/animations";
import type { CashflowPoint, MatchSlice, ReconciliationStatusSummary, VarianceDataPoint } from "@/types/dashboard";

import { CashflowAreaChart } from "./CashflowAreaChart";
import type { ExpenseSlice } from "./ExpenseBreakdownChart";
import { ExpenseBreakdownChart } from "./ExpenseBreakdownChart";
import { MatchRatioPieChart } from "./MatchRatioPieChart";
import { ReconciliationStatusBarChart } from "./ReconciliationStatusBarChart";
import { VarianceChartCard } from "./VarianceChartCard";

const MotionGrid = motion.create(Grid);

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
    <MotionGrid
      container
      spacing={3}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <MotionGrid item xs={12} variants={staggerItem}>
        <VarianceChartCard
          data={varianceData}
          loading={reportsLoading}
          error={reportsError}
        />
      </MotionGrid>
      <MotionGrid item xs={12} md={6} variants={staggerItem}>
        <CashflowAreaChart data={cashflowPoints} loading={reportsLoading} />
      </MotionGrid>
      <MotionGrid item xs={12} md={6} variants={staggerItem}>
        <ExpenseBreakdownChart data={expenseSlices} loading={reportsLoading} />
      </MotionGrid>
      <MotionGrid item xs={12} md={6} variants={staggerItem}>
        <MatchRatioPieChart data={matchSlices} loading={runsLoading} />
      </MotionGrid>
      <MotionGrid item xs={12} md={6} variants={staggerItem}>
        <ReconciliationStatusBarChart
          summary={reconciliationSummary}
          loading={runsLoading}
          error={runsError}
        />
      </MotionGrid>
    </MotionGrid>
  );
}
