/**
 * ChartFrame — accessible wrapper for a Recharts chart.
 *
 * Recharts emits a bare <svg> full of <path> elements, which assistive tech
 * either skips or reads as noise. Wrapping each chart in `role="img"` with a
 * descriptive label collapses it into one meaningful announcement, and the
 * optional `summary` lets a screen-reader user hear the actual numbers without
 * having to reach for the underlying table.
 *
 * Closes the "charts lack textual summaries for screen readers" gap in audit
 * section 11.
 */

import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

export type ChartFrameProps = {
  /** What the chart depicts, e.g. "Line chart of revenue and expenses by period". */
  label: string;
  /** Spoken data summary, e.g. "3 periods. Latest net income $412,000." */
  summary?: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function ChartFrame({ label, summary, children, sx }: ChartFrameProps) {
  return (
    <Box
      role="img"
      aria-label={summary ? `${label}. ${summary}` : label}
      sx={[{ width: "100%" }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {children}
    </Box>
  );
}

/** Render `[{name, value}]` as "COGS 1.2M, OpEx 840K" for a chart summary. */
export function describeSlices(
  slices: ReadonlyArray<{ name: string; value: number }>,
  format: (value: number) => string = (v) => v.toLocaleString(),
): string {
  if (slices.length === 0) return "No data.";
  return slices.map((s) => `${s.name} ${format(s.value)}`).join(", ");
}
