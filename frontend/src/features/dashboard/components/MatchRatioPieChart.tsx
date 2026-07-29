/**
 * MatchRatioPieChart — donut chart with centred match percentage and hover animation.
 */

import { CardContent, Typography, useTheme } from "@mui/material";
import { useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";

import { ChartFrame, ChartTooltip, CHART_ANIMATION, describeSlices } from "@/components/charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import type { MatchSlice } from "@/types/dashboard";

type MatchRatioPieChartProps = {
  data: MatchSlice[];
  loading?: boolean;
};

function matchPct(data: MatchSlice[]): number {
  const matched =
    data.find((d) => d.name.toLowerCase() === "matched")?.value ?? 0;
  const total = data.reduce((s, d) => s + d.value, 0);
  return total > 0 ? (matched / total) * 100 : 0;
}

function renderActiveShape(props: PieSectorDataItem) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#000",
  } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

export function MatchRatioPieChart({ data, loading }: MatchRatioPieChartProps) {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const pct = matchPct(data);

  const colors: Record<string, string> = {
    Matched: theme.palette.success.main,
    Unmatched: theme.palette.error.main,
    matched: theme.palette.success.main,
    unmatched: theme.palette.error.main,
  };

  if (loading) {
    return <SkeletonCard height={340} />;
  }

  return (
    <GlassCard animateEntrance={false} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Reconciliation match ratio
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Matched vs unmatched lines (succeeded runs)
        </Typography>
        {data.length === 0 ? (
          <Typography color="text.secondary">No reconciliation data yet.</Typography>
        ) : (
          <ChartFrame
            label="Donut chart of matched versus unmatched reconciliation lines"
            summary={`${pct.toFixed(0)} percent matched. ${describeSlices(data)}.`}
          >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={88}
                paddingAngle={2}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, index) => setActiveIndex(index)}
                animationDuration={CHART_ANIMATION.duration}
                animationEasing={CHART_ANIMATION.easing}
                isAnimationActive={data.length < 20}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={colors[entry.name] ?? theme.palette.primary.main}
                    stroke="none"
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={theme.palette.text.primary}
              >
                <tspan x="50%" dy="-0.2em" fontSize={22} fontWeight={700}>
                  {pct.toFixed(0)}%
                </tspan>
                <tspan x="50%" dy="1.4em" fontSize={12} fill={theme.palette.text.secondary}>
                  matched
                </tspan>
              </text>
              <Tooltip
                content={<ChartTooltip valueFormatter={(v) => v.toLocaleString()} />}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          </ChartFrame>
        )}
      </CardContent>
    </GlassCard>
  );
}
