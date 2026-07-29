import { useMemo } from "react";

import { formatChartDate } from "../utils/dateFormat";
import { parseDecimal } from "../utils/financialFormat";
import type {
  CashflowPoint,
  DashboardMetrics,
  MatchSlice,
  ReconciliationStatusSummary,
  VarianceDataPoint,
} from "../types/dashboard";
import type { FinancialReportRead, ReconciliationRunRead } from "../types/reporting";

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

export function deriveCashflowPoints(reports: FinancialReportRead[]): CashflowPoint[] {
  const pnl = reports
    .filter((r) => r.report_type === "pnl" && r.status === "succeeded")
    .sort((a, b) => (a.period_end > b.period_end ? 1 : -1));
  return pnl.map((r) => {
    const periodEnd = r.period_end;
    return {
      periodEnd,
      periodLabel: formatChartDate(periodEnd),
      cashflow: parseDecimal(r.net_income),
    };
  });
}

export function deriveReconciliationMatchSlices(runs: ReconciliationRunRead[]): MatchSlice[] {
  let matched = 0;
  let unmatched = 0;
  for (const r of runs) {
    if (r.status !== "succeeded") continue;
    matched += r.matched_count;
    unmatched += r.unmatched_count;
  }
  if (matched + unmatched === 0) return [];
  return [
    { name: "Matched", value: matched },
    { name: "Unmatched", value: unmatched },
  ];
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

export function deriveDashboardInsights(
  runs: ReconciliationRunRead[],
  reports: FinancialReportRead[],
): string[] {
  const out: string[] = [];
  for (const r of runs) {
    if (r.status !== "succeeded") continue;
    const denom = r.matched_count + r.unmatched_count;
    if (denom <= 0) continue;
    const pct = (100 * r.unmatched_count) / denom;
    if (pct >= 15) {
      out.push(
        `High mismatch share (~${pct.toFixed(0)}%) on a succeeded run — review exceptions.`,
      );
    }
  }
  const pnl = reports
    .filter((x) => x.report_type === "pnl" && x.status === "succeeded")
    .sort((a, b) => (a.period_end > b.period_end ? 1 : -1));
  const last = pnl[pnl.length - 1];
  if (last) {
    const rev = parseDecimal(last.revenue);
    const ni = parseDecimal(last.net_income);
    if (rev > 0 && ni / rev < 0.05) {
      out.push("Latest PnL net margin is under 5% — pressure on profitability.");
    }
  }
  return out;
}

export function useDashboardMetrics(
  reports: FinancialReportRead[],
  runs: ReconciliationRunRead[],
) {
  const metrics = useMemo(() => deriveMetricsFromReports(reports), [reports]);
  const varianceData = useMemo(() => deriveVarianceData(reports), [reports]);
  const cashflowPoints = useMemo(() => deriveCashflowPoints(reports), [reports]);
  const matchSlices = useMemo(() => deriveReconciliationMatchSlices(runs), [runs]);
  const reconciliationSummary = useMemo(
    () => deriveReconciliationSummary(runs),
    [runs],
  );
  const insights = useMemo(
    () => deriveDashboardInsights(runs, reports),
    [runs, reports],
  );

  return {
    metrics,
    varianceData,
    cashflowPoints,
    matchSlices,
    reconciliationSummary,
    insights,
  };
}
