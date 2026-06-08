/**
 * Financial dashboard MUI themes — dark and light variants built from
 * shared design tokens and component overrides.
 */

import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

import {
  BORDER_RADIUS,
  DARK_COLORS,
  DURATIONS,
  EASINGS,
  LIGHT_COLORS,
  SHADOWS,
  type ThemeMode,
} from "./tokens";

function buildComponentOverrides(
  mode: ThemeMode,
): NonNullable<ThemeOptions["components"]> {
  const tokens = mode === "dark" ? DARK_COLORS : LIGHT_COLORS;
  const headerBg = tokens.panel;
  const rowHover =
    mode === "dark" ? "rgba(0, 212, 255, 0.06)" : "rgba(26, 86, 219, 0.05)";

  return {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: SHADOWS.sm,
          borderRadius: BORDER_RADIUS.md,
          transition: `box-shadow ${DURATIONS.normal}ms ${EASINGS.easeOut}, transform ${DURATIONS.normal}ms ${EASINGS.easeOut}`,
          "&:hover": {
            boxShadow: SHADOWS.lg,
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px",
          "&:last-child": { paddingBottom: "20px" },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: BORDER_RADIUS.sm,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: BORDER_RADIUS.sm,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: BORDER_RADIUS.md,
          border: `1px solid ${tokens.border}`,
        },
        columnHeaders: {
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: headerBg,
        },
        row: {
          "&:hover": {
            backgroundColor: rowHover,
          },
        },
      },
    },
  };
}

function createFinancialTheme(mode: ThemeMode) {
  const tokens = mode === "dark" ? DARK_COLORS : LIGHT_COLORS;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.accent,
        light: mode === "dark" ? "#33DDFF" : "#3B71F5",
        dark: mode === "dark" ? "#00A8CC" : "#1241A8",
      },
      secondary: {
        main: tokens.accentSecondary,
        light: mode === "dark" ? "#33FFAA" : "#10B981",
        dark: mode === "dark" ? "#00CC77" : "#047857",
      },
      background: {
        default: tokens.background,
        paper: tokens.panel,
      },
      text: {
        primary: tokens.textPrimary,
        secondary: tokens.textSecondary,
      },
      success: {
        main: tokens.success,
      },
      error: {
        main: tokens.error,
      },
      warning: {
        main: tokens.warning,
      },
      info: {
        main: tokens.info,
      },
      divider: tokens.border,
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      body1: { lineHeight: 1.5 },
      body2: { lineHeight: 1.45 },
    },
    shape: { borderRadius: BORDER_RADIUS.md },
    components: buildComponentOverrides(mode),
  });
}

export const darkTheme = createFinancialTheme("dark");
export const lightTheme = createFinancialTheme("light");

/** @deprecated Use `lightTheme` or theme store — kept for existing imports. */
export const financialTheme = lightTheme;
