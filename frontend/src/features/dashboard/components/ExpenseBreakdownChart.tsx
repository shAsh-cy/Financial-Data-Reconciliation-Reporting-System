/**
 * ExpenseBreakdownChart — PnL expense mix bar chart with gradient cells.
 */

import { CardContent, Typography, useTheme } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip, CHART_ANIMATION } from "@/components/charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export type ExpenseSlice = {
  name: string;
  value: number;
};

type ExpenseBreakdownChartProps = {
  data: ExpenseSlice[];
  loading?: boolean;
};

const BAR_GRADIENTS = [
  ["#1A56DB", "#3B71F5"],
  ["#D97706", "#F59E0B"],
  ["#059669", "#10B981"],
];

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
  const theme = useTheme();
  const gridColor = theme.palette.divider;

  if (loading) {
    return <SkeletonCard height={340} />;
  }

  return (
    <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Expense mix (latest PnL)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cost of goods sold, operating spend, and other expenses
        </Typography>
        {data.length === 0 ? (
          <Typography color="text.secondary">No PnL data yet.</Typography>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
              <defs>
                {data.map((_, i) => {
                  const [top, bottom] = BAR_GRADIENTS[i % BAR_GRADIENTS.length]!;
                  return (
                    <linearGradient key={i} id={`expGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={top} stopOpacity={1} />
                      <stop offset="100%" stopColor={bottom} stopOpacity={0.75} />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(v, name) => formatCurrencyDetailed(v)}
                  />
                }
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={`url(#expGrad${i})`} />
                ))}
                <LabelList dataKey="value" position="top" formatter={(v: number) => formatCompact(v)} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </GlassCard>
  );
}
