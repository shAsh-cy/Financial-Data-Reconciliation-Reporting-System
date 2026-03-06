import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { VarianceDataPoint } from "../../../types/dashboard";

type VarianceChartProps = {
  data: VarianceDataPoint[];
  loading?: boolean;
  error?: string | null;
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function VarianceChart({ data, loading, error }: VarianceChartProps) {
  if (loading) return null;
  if (error) return null;
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    periodLabel: formatDate(d.periodEnd),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.periodEnd
              ? formatDate(payload[0].payload.periodEnd)
              : ""
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#1976d2"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke="#ed6c02"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="netIncome"
          name="Net Income"
          stroke="#2e7d32"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
