/**
 * AppThemeProvider — MUI ThemeProvider wired to the persisted theme store.
 */

import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";

import { useThemeStore } from "../app/state/themeStore";
import { darkTheme, lightTheme } from "./financialTheme";

export type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
