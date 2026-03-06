import { useMemo } from "react";

import type {
  DashboardMetrics,
  ReconciliationStatusSummary,
  VarianceDataPoint,
} from "../types/dashboard";
import type { FinancialReportRead, ReconciliationRunRead } from "../types/reporting";

function parseDecimal(s: string | null): number {
  if (s == null || s === "") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function deriveMetricsFromReports(reports: FinancialReportRead[]): DashboardMetrics {
  const pnlReports = reports
    .filter((r) => r.report_type === "pnl" && r.status === "succeeded")
    .sort((a, b) => (b.period_end > a.period_end ? 1 : -1));

  const latestPnl = pnlReports[0];
  const liquidityReports = reports
    .filter((r) => r.report_type === "liquidity" && r.status === "succeeded")
    .sort((a, b) => (b.period_end > a.period_end ? 1 : -1));
  const latestLiquidity = liquidityReports[0];

  const totalRevenue = latestPnl ? parseDecimal(latestPnl.revenue) : 0;
  const cogs = latestPnl ? parseDecimal(latestPnl.cost_of_goods_sold) : 0;
  const opex = latestPnl ? parseDecimal(latestPnl.operating_expenses) : 0;
  const otherExp = latestPnl ? parseDecimal(latestPnl.other_expenses) : 0;
  const totalExpenses = cogs + opex + otherExp;
  const netProfit = latestPnl ? parseDecimal(latestPnl.net_income) : 0;
  const liquidityRatio = latestLiquidity
    ? parseDecimal(latestLiquidity.current_ratio)
    : null;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    liquidityRatio: liquidityRatio === 0 ? null : liquidityRatio,
  };
}

export function deriveVarianceData(reports: FinancialReportRead[]): VarianceDataPoint[] {
  const pnlReports = reports
    .filter((r) => r.report_type === "pnl" && r.status === "succeeded")
    .sort((a, b) => (a.period_end > b.period_end ? 1 : -1));

  return pnlReports.map((r) => {
    const revenue = parseDecimal(r.revenue);
    const cogs = parseDecimal(r.cost_of_goods_sold);
    const opex = parseDecimal(r.operating_expenses);
    const otherExp = parseDecimal(r.other_expenses);
    const expenses = cogs + opex + otherExp;
    const netIncome = parseDecimal(r.net_income);

    return {
      periodEnd: r.period_end,
      revenue,
      expenses,
      netIncome,
    };
  });
}

export function deriveReconciliationSummary(
  runs: ReconciliationRunRead[],
): ReconciliationStatusSummary {
  return runs.reduce(
    (acc, r) => {
      if (r.status === "succeeded") acc.succeeded += 1;
      else if (r.status === "failed") acc.failed += 1;
      else if (r.status === "running") acc.running += 1;
      else acc.pending += 1;
      return acc;
    },
    { succeeded: 0, failed: 0, running: 0, pending: 0 },
  );
}

export function useDashboardMetrics(
  reports: FinancialReportRead[],
  runs: ReconciliationRunRead[],
) {
  const metrics = useMemo(
    () => deriveMetricsFromReports(reports),
    [reports],
  );
  const varianceData = useMemo(
    () => deriveVarianceData(reports),
    [reports],
  );
  const reconciliationSummary = useMemo(
    () => deriveReconciliationSummary(runs),
    [runs],
  );

  return { metrics, varianceData, reconciliationSummary };
}
