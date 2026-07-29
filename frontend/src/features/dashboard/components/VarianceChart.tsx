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

import { ChartFrame, ChartTooltip, CHART_ANIMATION } from "@/components/charts";
import type { VarianceDataPoint } from "@/types/dashboard";
import { formatChartDate } from "@/utils/dateFormat";
import { formatCompact, formatCurrency } from "@/utils/financialFormat";

type VarianceChartProps = {
  data: VarianceDataPoint[];
  loading?: boolean;
  error?: string | null;
};

export function VarianceChart({ data, loading, error }: VarianceChartProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const gridColor = theme.palette.divider;

  if (loading) return null;
  if (error) return null;
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    ...d,
    periodLabel: formatChartDate(d.periodEnd),
  }));

  const latest = data[data.length - 1];
  const summary = latest
    ? `${data.length} period${data.length === 1 ? "" : "s"} through ${formatChartDate(latest.periodEnd)}. ` +
      `Latest revenue ${formatCurrency(latest.revenue)}, ` +
      `expenses ${formatCurrency(latest.expenses)}, ` +
      `net income ${formatCurrency(latest.netIncome)}.`
    : undefined;

  return (
    <ChartFrame
      label="Line chart of revenue, expenses and net income by period"
      {...(summary ? { summary } : {})}
    >
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
        <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
        <Tooltip
          content={
            <ChartTooltip
              valueFormatter={(v, name) => formatCurrency(v)}
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
    </ChartFrame>
  );
}
