/**
 * ChartTooltip — reusable Recharts custom tooltip with glassmorphism styling.
 */

import { Box, Typography, useTheme } from "@mui/material";
import type { TooltipProps } from "recharts";

import { glassStyle } from "@/theme/glass";

export type ChartTooltipProps = TooltipProps<number, string> & {
  valueFormatter?: (value: number, name: string) => string;
  labelFormatter?: (label: string) => string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
}: ChartTooltipProps) {
  const theme = useTheme();

  if (!active || !payload?.length) {
    return null;
  }

  const displayLabel = labelFormatter
    ? labelFormatter(String(label ?? ""))
    : String(label ?? "");

  return (
    <Box
      sx={{
        ...glassStyle(theme),
        px: 1.5,
        py: 1,
        minWidth: 120,
        boxShadow: theme.shadows[4],
      }}
    >
      {displayLabel && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {displayLabel}
        </Typography>
      )}
      {payload.map((entry) => {
        const raw = entry.value;
        const num = typeof raw === "number" ? raw : Number(raw);
        const name = String(entry.name ?? entry.dataKey ?? "");
        const formatted = valueFormatter
          ? valueFormatter(num, name)
          : Number.isFinite(num)
            ? num.toLocaleString()
            : String(raw ?? "—");

        return (
          <Typography
            key={`${name}-${entry.color}`}
            variant="body2"
            sx={{ fontWeight: 600, color: entry.color ?? "text.primary" }}
          >
            {name}: {formatted}
          </Typography>
        );
      })}
    </Box>
  );
}
