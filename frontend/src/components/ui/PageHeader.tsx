/**
 * PageHeader — standardised page title, subtitle, breadcrumbs, and action slot.
 */

import {
  Box,
  Breadcrumbs,
  Link,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

export type PageHeaderBreadcrumb = {
  label: string;
  href?: string;
};

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: PageHeaderBreadcrumb[];
  actions?: ReactNode;
  sx?: SxProps<Theme>;
};

export function PageHeader({ title, subtitle, breadcrumbs, actions, sx }: PageHeaderProps) {
  return (
    <Box sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            if (crumb.href && !isLast) {
              return (
                <Link key={crumb.label} underline="hover" color="inherit" href={crumb.href}>
                  {crumb.label}
                </Link>
              );
            }
            return (
              <Typography key={crumb.label} color="text.primary" variant="body2">
                {crumb.label}
              </Typography>
            );
          })}
        </Breadcrumbs>
      )}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom={Boolean(subtitle)}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Stack>
    </Box>
  );
}
