export type ApiMeta = Record<string, unknown>;

export function isDemoMeta(meta?: ApiMeta): boolean {
  return meta?.is_demo === true;
}

export type ReconciliationRunRead = {
  id: string;
  left_ledger_id: string;
  right_ledger_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  finished_at: string | null;
  matched_count: number;
  unmatched_left_count: number;
  unmatched_right_count: number;
  unmatched_count: number;
  error_message: string | null;
};

export type ReconciliationItemRead = {
  id: string;
  run_id: string;
  left_transaction_id: string | null;
  right_transaction_id: string | null;
  match_type: string;
  match_status: "matched" | "unmatched";
  amount?: string | null;
};

export type ReconciliationRunListResponse = {
  items: ReconciliationRunRead[];
  total: number;
  meta: ApiMeta;
};

export type ReconciliationItemsAggregation = {
  by_match_type: Record<string, number>;
  matched_lines: number;
  unmatched_lines: number;
  only_left: number;
  only_right: number;
};

export type ReconciliationDetailSummary = {
  run: ReconciliationRunRead;
  matched_lines: number;
  unmatched_lines: number;
  mismatch_rate_pct: string | null;
  by_match_type: Record<string, number>;
  quick_insights: string[];
};

export type ReconciliationDetailTimeseriesPoint = {
  run_id: string;
  period_label: string;
  matched_count: number;
  unmatched_count: number;
  status: string;
};

export type ReconciliationBreakdownSlice = {
  match_type: string;
  count: number;
};

export type ReconciliationDetailPayload = {
  summary: ReconciliationDetailSummary;
  timeseries: ReconciliationDetailTimeseriesPoint[];
  breakdown: ReconciliationBreakdownSlice[];
};

export type ReconciliationRunDetailEnvelope = {
  id: string;
  data: ReconciliationDetailPayload;
  meta: ApiMeta;
};

export type ReconciliationItemListResponse = {
  items: ReconciliationItemRead[];
  total: number;
  meta: ApiMeta;
};

export type FinancialReportListResponse = {
  items: FinancialReportRead[];
  total: number;
  meta: ApiMeta;
};

export type ReportStatementLine = {
  label: string;
  amount: string | null;
  line_kind: "revenue" | "expense" | "subtotal" | "metric" | "ratio";
};

export type ReportDetailSummary = {
  snapshot: FinancialReportRead;
  total_expenses: string | null;
  gross_margin_pct: string | null;
  net_margin_pct: string | null;
  statement_lines: ReportStatementLine[];
  quick_insights: string[];
};

export type ReportDetailTimeseriesPoint = {
  period_end: string;
  revenue: string | null;
  expenses: string | null;
  net_income: string | null;
  cashflow: string | null;
};

export type ReportBreakdownSlice = {
  name: string;
  amount: string | null;
  segment: "revenue" | "expense" | "liquidity";
};

export type ReportDetailPayload = {
  summary: ReportDetailSummary;
  timeseries: ReportDetailTimeseriesPoint[];
  breakdown: ReportBreakdownSlice[];
};

export type FinancialReportDetailEnvelope = {
  id: string;
  data: ReportDetailPayload;
  meta: ApiMeta;
};

export type FinancialReportRead = {
  id: string;
  report_type: string;
  status: string;
  period_start: string | null;
  period_end: string;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  revenue: string | null;
  cost_of_goods_sold: string | null;
  gross_profit: string | null;
  operating_expenses: string | null;
  operating_income: string | null;
  other_income: string | null;
  other_expenses: string | null;
  net_income: string | null;
  net_margin: string | null;
  current_assets: string | null;
  quick_assets: string | null;
  cash_and_equivalents: string | null;
  current_liabilities: string | null;
  short_term_debt: string | null;
  current_ratio: string | null;
  quick_ratio: string | null;
  cash_ratio: string | null;
  working_capital: string | null;
};

export type ReportSummaryMetrics = {
  total_revenue: string | null;
  total_expenses: string | null;
  net_profit: string | null;
  liquidity_ratio: string | null;
};

export type ReportTimeSeriesPoint = {
  period_end: string;
  revenue: string | null;
  expenses: string | null;
  net_income: string | null;
};

export type ReportsOverviewResponse = {
  summary: ReportSummaryMetrics;
  time_series: ReportTimeSeriesPoint[];
  items: FinancialReportRead[];
  total_report_count: number;
  meta: ApiMeta;
};
