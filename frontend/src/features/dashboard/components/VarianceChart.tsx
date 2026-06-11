/**
 * VarianceChart — revenue, expenses, and net income line chart.
 */

import { useTheme } from "@mui/material";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip, CHART_ANIMATION } from "@/components/charts";
import type { VarianceDataPoint } from "@/types/dashboard";

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

function formatCurrencyDetailed(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function VarianceChart({ data, loading, error }: VarianceChartProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const gridColor = theme.palette.divider;

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
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={(v, name) => formatCurrencyDetailed(v)}
              labelFormatter={(lbl) => lbl}
            />
          }
        />
        <ReferenceLine y={0} stroke={accent} strokeDasharray="4 4" strokeWidth={1.5} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          animationDuration={CHART_ANIMATION.duration}
          animationEasing={CHART_ANIMATION.easing}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          name="Expenses"
          stroke={theme.palette.warning.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          animationDuration={CHART_ANIMATION.duration}
          animationEasing={CHART_ANIMATION.easing}
        />
        <Line
          type="monotone"
          dataKey="netIncome"
          name="Net Income"
          stroke={theme.palette.success.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          animationDuration={CHART_ANIMATION.duration}
          animationEasing={CHART_ANIMATION.easing}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
