/**
 * Shared Recharts animation and status colour constants.
 */

import type { Theme } from "@mui/material/styles";

export const CHART_ANIMATION = {
  duration: 800,
  easing: "ease-out" as const,
};

export type RunStatusKey = "succeeded" | "failed" | "running" | "pending";

export function statusBarColor(theme: Theme, status: RunStatusKey | string): string {
  switch (status) {
    case "succeeded":
    case "matched":
      return theme.palette.success.main;
    case "failed":
    case "unmatched":
      return theme.palette.error.main;
    case "running":
      return theme.palette.info.main;
    case "pending":
    case "partial":
      return theme.palette.mode === "dark" ? "#64748B" : "#9CA3AF";
    default:
      return theme.palette.primary.main;
  }
}
