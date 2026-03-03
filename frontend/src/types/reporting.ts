export type ReconciliationRunRead = {
  id: string;
  left_ledger_id: string;
  right_ledger_id: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  matched_count: number;
  unmatched_left_count: number;
  unmatched_right_count: number;
  error_message: string | null;
};

export type ReconciliationItemRead = {
  id: string;
  run_id: string;
  left_transaction_id: string | null;
  right_transaction_id: string | null;
  match_type: string;
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

