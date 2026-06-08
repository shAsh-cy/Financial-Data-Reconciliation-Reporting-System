/**
 * Glassmorphism utility — returns an MUI sx object with backdrop blur,
 * semi-transparent background, and a subtle theme-aware border.
 */

import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/material";

import { BORDER_RADIUS, getColorTokens } from "./tokens";

export function glassStyle(theme: Theme): SxProps<Theme> {
  const mode = theme.palette.mode;
  const tokens = getColorTokens(mode);

  return {
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    backgroundColor: tokens.glassBg,
    border: `1px solid ${tokens.border}`,
    borderRadius: `${BORDER_RADIUS.md}px`,
  };
}
