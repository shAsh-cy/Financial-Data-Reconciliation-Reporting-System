/**
 * ReconciliationStatusBarChart — horizontal status distribution bar chart.
 */

import { CardContent, Typography, useTheme } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartFrame,
  ChartTooltip,
  CHART_ANIMATION,
  describeSlices,
  statusBarColor,
} from "@/components/charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { ReconciliationStatusSummary } from "@/types/dashboard";

type ReconciliationStatusBarChartProps = {
  summary: ReconciliationStatusSummary;
  loading?: boolean;
  error?: string | null;
};

export function ReconciliationStatusBarChart({
  summary,
  loading,
  error,
}: ReconciliationStatusBarChartProps) {
  const theme = useTheme();
  const gridColor = theme.palette.divider;

  const chartData = [
    { name: "Succeeded", value: summary.succeeded, status: "succeeded" },
    { name: "Failed", value: summary.failed, status: "failed" },
    { name: "Running", value: summary.running, status: "running" },
    { name: "Pending", value: summary.pending, status: "pending" },
  ].filter((d) => d.value > 0);

  if (loading) {
    return <SkeletonCard height={340} />;
  }

  return (
    <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Reconciliation distribution
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Runs by outcome across the loaded window
        </Typography>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary">No runs in scope.</Typography>
        ) : (
          <ChartFrame
            label="Horizontal bar chart of reconciliation runs by outcome"
            summary={describeSlices(chartData)}
          >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
              <YAxis
                type="category"
                dataKey="name"
                width={88}
                tick={{ fontSize: 12 }}
                stroke={theme.palette.text.secondary}
              />
              <Tooltip
                content={
                  <ChartTooltip valueFormatter={(v, name) => v.toLocaleString()} />
                }
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={statusBarColor(theme, entry.status)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </ChartFrame>
        )}
      </CardContent>
    </GlassCard>
  );
}
