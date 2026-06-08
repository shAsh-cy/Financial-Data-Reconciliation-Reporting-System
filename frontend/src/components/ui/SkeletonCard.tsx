/**
 * SkeletonCard — loading placeholder shaped like a GlassCard.
 */

import { Box, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { glassStyle } from "../../theme/glass";
import { BORDER_RADIUS } from "../../theme/tokens";

export type SkeletonCardProps = {
  height?: number | string;
  animate?: boolean;
};

export function SkeletonCard({ height = 140, animate = true }: SkeletonCardProps) {
  const theme = useTheme();

  return (
    <Box sx={{ ...glassStyle(theme), p: 2.5, height }}>
      <Skeleton
        variant="text"
        width="40%"
        height={20}
        animation={animate ? "pulse" : false}
        sx={{ mb: 1.5 }}
      />
      <Skeleton
        variant="text"
        width="60%"
        height={36}
        animation={animate ? "pulse" : false}
        sx={{ mb: 2 }}
      />
      <Skeleton
        variant="rounded"
        width="100%"
        height={48}
        animation={animate ? "pulse" : false}
        sx={{ borderRadius: `${BORDER_RADIUS.sm}px` }}
      />
    </Box>
  );
}
