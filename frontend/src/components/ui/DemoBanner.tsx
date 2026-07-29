/**
 * DemoBanner — app-wide notice shown while the API is serving synthetic data.
 * Driven by the demo store (VITE_DEMO_MODE or any response carrying meta.is_demo).
 */

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, type SxProps, type Theme } from "@mui/material";

import { useDemoStore } from "../../app/state/demoStore";

export type DemoBannerProps = {
  sx?: SxProps<Theme>;
};

export function DemoBanner({ sx }: DemoBannerProps) {
  const isDemoActive = useDemoStore((s) => s.isDemoActive);

  if (!isDemoActive) return null;

  return (
    <Alert
      severity="info"
      icon={<InfoOutlinedIcon />}
      role="status"
      sx={[{ mb: 3 }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      <strong>Demo Mode Active</strong> — displaying synthetic data. Connect a live database to
      see real transactions.
    </Alert>
  );
}
