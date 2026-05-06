import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

export const financialTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#455a64",
      light: "#78909c",
      dark: "#37474f",
    },
    background: {
      default: "#f8fafc",
      paper: "#ffffff",
    },
    text: {
      primary: "#1e293b",
      secondary: "#64748b",
    },
    success: {
      main: "#2e7d32",
    },
    error: {
      main: "#c62828",
    },
    warning: {
      main: "#ed6c02",
    },
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
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          borderRadius: 10,
          transition: "box-shadow 180ms ease, transform 180ms ease",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
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
          borderRadius: 8,
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        columnHeaders: {
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: "#ffffff",
        },
        row: {
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.05)",
          },
        },
      },
    },
  },
});
