/**
 * CashflowAreaChart — net income cashflow proxy with gradient area fill.
 */

import { CardContent, Typography, useTheme } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartFrame, ChartTooltip, CHART_ANIMATION } from "@/components/charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { CashflowPoint } from "@/types/dashboard";

type CashflowAreaChartProps = {
  data: CashflowPoint[];
  loading?: boolean;
};

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

export function CashflowAreaChart({ data, loading }: CashflowAreaChartProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const gridColor = theme.palette.divider;

  if (loading) {
    return <SkeletonCard height={340} />;
  }

  return (
    <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Cashflow trend
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Net income as cashflow proxy by period
        </Typography>
        {data.length === 0 ? (
          <Typography color="text.secondary">No series yet.</Typography>
        ) : (
          <ChartFrame
            label="Area chart of net income used as a cashflow proxy, by period"
            summary={`${data.length} period${data.length === 1 ? "" : "s"}. Latest ${formatCompact(
              data[data.length - 1]?.cashflow ?? 0,
            )}.`}
          >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
              <Tooltip
                content={
                  <ChartTooltip
                    valueFormatter={(v) => formatCompact(v)}
                    labelFormatter={(lbl) => lbl}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="cashflow"
                name="Cashflow"
                stroke={accent}
                fill="url(#cfFill)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
                isAnimationActive={data.length < 40}
              />
            </AreaChart>
          </ResponsiveContainer>
          </ChartFrame>
        )}
      </CardContent>
    </GlassCard>
  );
}
