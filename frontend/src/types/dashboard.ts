/** Centralized dashboard metric types. */

export type DashboardMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  liquidityRatio: number | null;
};

export type VarianceDataPoint = {
  periodEnd: string;
  revenue: number;
  expenses: number;
  netIncome: number;
};

export type ReconciliationStatusSummary = {
  succeeded: number;
  failed: number;
  running: number;
  pending: number;
};

export type CashflowPoint = {
  periodEnd: string;
  periodLabel: string;
  cashflow: number;
};

export type MatchSlice = {
  name: string;
  value: number;
};
