/**
 * KPICard — metric card with animated value, trend delta, and optional sparkline.
 */

import { Box, CardContent, Typography, useTheme } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

import { AnimatedNumber } from "./AnimatedNumber";
import { GlassCard } from "./GlassCard";

export type DeltaType = "positive" | "negative" | "neutral";

export type KPICardProps = {
  label: string;
  value: number;
  delta?: number;
  deltaType?: DeltaType;
  sparklineData?: number[];
  glowColor?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Disable the card's own entrance so a parent stagger container can orchestrate it. */
  animateEntrance?: boolean;
};

function deltaColor(type: DeltaType): string {
  switch (type) {
    case "positive":
      return "success.main";
    case "negative":
      return "error.main";
    default:
      return "text.secondary";
  }
}

function DeltaIcon({ type }: { type: DeltaType }) {
  const sx = { fontSize: 14, verticalAlign: "middle", mr: 0.25 };
  if (type === "positive") return <ArrowUpwardIcon sx={sx} />;
  if (type === "negative") return <ArrowDownwardIcon sx={sx} />;
  return <RemoveIcon sx={sx} />;
}

export function KPICard({
  label,
  value,
  delta,
  deltaType = "neutral",
  sparklineData,
  glowColor,
  prefix,
  suffix,
  decimals = 0,
  animateEntrance = true,
}: KPICardProps) {
  const theme = useTheme();
  const accent = theme.palette.primary.main;
  const chartData = sparklineData?.map((v, i) => ({ i, v })) ?? [];

  return (
    <GlassCard animateEntrance={animateEntrance} {...(glowColor !== undefined ? { glowColor } : {})}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        <AnimatedNumber
          value={value}
          decimals={decimals}
          {...(prefix !== undefined ? { prefix } : {})}
          {...(suffix !== undefined ? { suffix } : {})}
        />
        {delta !== undefined && (
          <Typography
            variant="caption"
            aria-label={`${
              deltaType === "positive" ? "Up" : deltaType === "negative" ? "Down" : "Unchanged,"
            } ${Math.abs(delta).toFixed(1)} percent`}
            sx={{ display: "flex", alignItems: "center", mt: 0.5, color: deltaColor(deltaType) }}
          >
            <DeltaIcon type={deltaType} />
            {Math.abs(delta).toFixed(1)}%
          </Typography>
        )}
        {chartData.length > 0 && (
          // Decorative: the sparkline restates the trend already announced by
          // the value and delta above, so it is hidden from assistive tech.
          <Box sx={{ mt: 2, height: 48 }} aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={accent}
                  fill={accent}
                  fillOpacity={0.15}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </GlassCard>
  );
}
