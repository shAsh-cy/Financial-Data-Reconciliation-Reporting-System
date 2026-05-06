import { Card, CardContent, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ExpenseSlice = {
  name: string;
  value: number;
};

type ExpenseBreakdownChartProps = {
  data: ExpenseSlice[];
  loading?: boolean;
};

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function ExpenseBreakdownChart({ data, loading }: ExpenseBreakdownChartProps) {
  return (
    <Card sx={{ height: "100%", transition: "box-shadow 0.2s ease", "&:hover": { boxShadow: 3 } }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Expense mix (latest PnL)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cost of goods sold, operating spend, and other expenses
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : data.length === 0 ? (
          <Typography color="text.secondary">No PnL data yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrencyDetailed(v), name]} />
              <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
