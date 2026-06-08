/**
 * EmptyState — centred placeholder for zero-item lists with optional CTA.
 */

import { Box, Button, Stack, Typography, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  sx?: SxProps<Theme>;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: 8,
          px: 3,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack spacing={2} alignItems="center" maxWidth={420}>
        {icon && (
          <Box sx={{ color: "text.secondary", fontSize: 48, lineHeight: 1 }}>{icon}</Box>
        )}
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {actionLabel && onAction && (
          <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
