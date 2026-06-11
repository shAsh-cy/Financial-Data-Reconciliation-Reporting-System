/**
 * KPI helpers — map trend series output to library KPICard delta types.
 */

import type { DeltaType } from "@/components/ui/KPICard";

export function trendToDeltaType(
  trend: "up" | "down" | "flat",
  invert = false,
): DeltaType {
  if (trend === "flat") return "neutral";
  const effective = invert ? (trend === "up" ? "down" : "up") : trend;
  return effective === "up" ? "positive" : "negative";
}
