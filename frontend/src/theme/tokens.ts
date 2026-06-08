/**
 * Design tokens — single source of truth for colors, spacing, shadows,
 * border radii, and animation durations used by both MUI themes.
 */

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: "0 1px 3px rgba(0, 0, 0, 0.08)",
  md: "0 4px 12px rgba(15, 23, 42, 0.1)",
  lg: "0 8px 24px rgba(15, 23, 42, 0.14)",
  glow: (color: string, opacity = 0.35) =>
    `0 0 20px ${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`,
} as const;

export const DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 400,
  entrance: 500,
} as const;

export const EASINGS = {
  easeOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

export const DARK_COLORS = {
  background: "#0A0F1E",
  panel: "#0D1B2A",
  accent: "#00D4FF",
  accentSecondary: "#00FF94",
  textPrimary: "#E8EDF5",
  textSecondary: "#94A3B8",
  border: "rgba(0, 212, 255, 0.12)",
  glassBg: "rgba(13, 27, 42, 0.65)",
  success: "#00FF94",
  error: "#FF4D6A",
  warning: "#FFB020",
  info: "#00D4FF",
} as const;

export const LIGHT_COLORS = {
  background: "#FFFFFF",
  panel: "#F4F6FA",
  accent: "#1A56DB",
  accentSecondary: "#059669",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "rgba(26, 86, 219, 0.12)",
  glassBg: "rgba(255, 255, 255, 0.72)",
  success: "#059669",
  error: "#DC2626",
  warning: "#D97706",
  info: "#1A56DB",
} as const;

export type ThemeMode = "light" | "dark";

export type ColorTokens = typeof DARK_COLORS | typeof LIGHT_COLORS;

export function getColorTokens(mode: ThemeMode) {
  return mode === "dark" ? DARK_COLORS : LIGHT_COLORS;
}
