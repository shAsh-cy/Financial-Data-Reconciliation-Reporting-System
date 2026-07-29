/**
 * ReportDetailCharts — lazy-loaded detail charts wrapped in GlassCard containers.
 */

import { CardContent, Grid, Typography } from "@mui/material";
import { memo, useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_ANIMATION, ChartFrame, ChartTooltip, describeSlices } from "@/components/charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { CashflowAreaChart } from "@/features/dashboard/components/CashflowAreaChart";
import { VarianceChart } from "@/features/dashboard/components/VarianceChart";
import type { CashflowPoint, VarianceDataPoint } from "@/types/dashboard";
import { formatCompact } from "@/utils/financialFormat";

export type ReportDetailChartsProps = {
  reportType: string;
  lineSeries: VarianceDataPoint[];
  cashflowSeries: CashflowPoint[];
  revenueSlices: { name: string; value: number }[];
  expenseSlices: { name: string; value: number }[];
  liquiditySlices: { name: string; value: number }[];
};

const REV_COLORS = ["#1976d2", "#2e7d32", "#ed6c02"];
const EXP_COLORS = ["#c62828", "#6a1b9a", "#455a64"];
const LIQ_COLORS = ["#1976d2", "#00897b", "#5c6bc0"];

function ReportDetailChartsInner({
  reportType,
  lineSeries,
  cashflowSeries,
  revenueSlices,
  expenseSlices,
  liquiditySlices,
}: ReportDetailChartsProps) {
  const categoryBar = useMemo(() => {
    if (reportType === "liquidity") return liquiditySlices;
    return expenseSlices;
  }, [reportType, expenseSlices, liquiditySlices]);

  if (reportType === "liquidity") {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <GlassCard animateEntrance={false}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Liquidity composition
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Asset buckets (current)
              </Typography>
              {liquiditySlices.length === 0 ? (
                <Typography color="text.secondary">No breakdown rows.</Typography>
              ) : (
                <ChartFrame
                  label="Donut chart of liquidity asset composition"
                  summary={describeSlices(liquiditySlices, formatCompact)}
                >
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={liquiditySlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                      animationDuration={CHART_ANIMATION.duration}
                      animationEasing={CHART_ANIMATION.easing}
                    >
                      {liquiditySlices.map((_, i) => (
                        <Cell key={i} fill={LIQ_COLORS[i % LIQ_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCompact(v)} />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                </ChartFrame>
              )}
            </CardContent>
          </GlassCard>
        </Grid>
        <Grid item xs={12} md={6}>
          <GlassCard animateEntrance={false}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Category weights
              </Typography>
              <ChartFrame
                label="Bar chart of liquidity category weights"
                summary={describeSlices(categoryBar, formatCompact)}
              >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCompact(v)} />} />
                  <Bar
                    dataKey="value"
                    fill="#1976d2"
                    radius={[4, 4, 0, 0]}
                    animationDuration={CHART_ANIMATION.duration}
                    animationEasing={CHART_ANIMATION.easing}
                  />
                </BarChart>
              </ResponsiveContainer>
              </ChartFrame>
            </CardContent>
          </GlassCard>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <GlassCard animateEntrance={false}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Revenue, expenses, and net income
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Monthly performance (succeeded PnL periods)
            </Typography>
            {lineSeries.length === 0 ? (
              <Typography color="text.secondary">No time series in scope.</Typography>
            ) : (
              <VarianceChart data={lineSeries} />
            )}
          </CardContent>
        </GlassCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <CashflowAreaChart data={cashflowSeries} loading={false} />
      </Grid>

      <Grid item xs={12} md={6}>
        <GlassCard animateEntrance={false}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Expense & category breakdown
            </Typography>
            {categoryBar.length === 0 ? (
              <Typography color="text.secondary">No expense categories.</Typography>
            ) : (
              <ChartFrame
                label="Bar chart of expense categories"
                summary={describeSlices(categoryBar, formatCompact)}
              >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryBar} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCompact(v)} />} />
                  <Bar
                    dataKey="value"
                    fill="#ed6c02"
                    radius={[4, 4, 0, 0]}
                    animationDuration={CHART_ANIMATION.duration}
                    animationEasing={CHART_ANIMATION.easing}
                  />
                </BarChart>
              </ResponsiveContainer>
              </ChartFrame>
            )}
          </CardContent>
        </GlassCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <GlassCard animateEntrance={false}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Revenue composition
            </Typography>
            {revenueSlices.length === 0 ? (
              <Typography color="text.secondary">No revenue split.</Typography>
            ) : (
              <ChartFrame
                label="Donut chart of revenue composition"
                summary={describeSlices(revenueSlices, formatCompact)}
              >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={revenueSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={2}
                    animationDuration={CHART_ANIMATION.duration}
                    animationEasing={CHART_ANIMATION.easing}
                  >
                    {revenueSlices.map((_, i) => (
                      <Cell key={i} fill={REV_COLORS[i % REV_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCompact(v)} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </ChartFrame>
            )}
          </CardContent>
        </GlassCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <GlassCard animateEntrance={false}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Expense composition
            </Typography>
            {expenseSlices.length === 0 ? (
              <Typography color="text.secondary">No expense split.</Typography>
            ) : (
              <ChartFrame
                label="Donut chart of expense composition"
                summary={describeSlices(expenseSlices, formatCompact)}
              >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={expenseSlices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={2}
                    animationDuration={CHART_ANIMATION.duration}
                    animationEasing={CHART_ANIMATION.easing}
                  >
                    {expenseSlices.map((_, i) => (
                      <Cell key={i} fill={EXP_COLORS[i % EXP_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip valueFormatter={(v) => formatCompact(v)} />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              </ChartFrame>
            )}
          </CardContent>
        </GlassCard>
      </Grid>
    </Grid>
  );
}

export default memo(ReportDetailChartsInner);
