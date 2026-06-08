/**
 * Button — MUI-based drop-in replacement for the legacy CSS-module button.
 * Preserves the existing `default` | `primary` variant API used by login/ingest forms.
 */

import type React from "react";
import { Button as MuiButton, type ButtonProps as MuiButtonProps } from "@mui/material";

export type ButtonProps = Omit<MuiButtonProps, "variant" | "color"> & {
  variant?: "default" | "primary";
};

export function Button({ variant = "primary", ...props }: ButtonProps) {
  const muiVariant = variant === "primary" ? "contained" : "outlined";
  return <MuiButton variant={muiVariant} color="primary" {...props} />;
}
