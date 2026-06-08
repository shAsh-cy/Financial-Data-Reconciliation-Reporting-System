/**
 * StatusChip — semantic MUI Chip with status-to-color mapping and running pulse.
 */

import { Chip, type ChipProps, keyframes } from "@mui/material";

export type StatusValue =
  | "matched"
  | "unmatched"
  | "partial"
  | "running"
  | "failed"
  | "pending"
  | string;

export type StatusChipProps = Omit<ChipProps, "color" | "label"> & {
  status: StatusValue;
};

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
`;

type StatusConfig = {
  label: string;
  color: NonNullable<ChipProps["color"]>;
  pulse?: boolean;
};

const STATUS_MAP: Record<string, StatusConfig> = {
  matched: { label: "Matched", color: "success" },
  unmatched: { label: "Unmatched", color: "error" },
  partial: { label: "Partial", color: "warning" },
  running: { label: "Running", color: "info", pulse: true },
  failed: { label: "Failed", color: "error" },
  pending: { label: "Pending", color: "default" },
};

function resolveStatus(status: StatusValue): StatusConfig {
  const key = status.toLowerCase().trim();
  return (
    STATUS_MAP[key] ?? {
      label: status,
      color: "default",
    }
  );
}

export function StatusChip({ status, sx, ...props }: StatusChipProps) {
  const config = resolveStatus(status);

  const pulseSx = config.pulse
    ? { animation: `${pulse} 1.6s ease-in-out infinite` }
    : {};

  const mergedSx = [pulseSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      sx={mergedSx}
      {...props}
    />
  );
}
