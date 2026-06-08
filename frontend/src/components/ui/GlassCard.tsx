/**
 * GlassCard — MUI Card with glassmorphism styling and optional entrance animation.
 */

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Card, type CardProps, useTheme } from "@mui/material";

import { fadeInUp } from "../../lib/animations";
import { glassStyle } from "../../theme/glass";
import { SHADOWS } from "../../theme/tokens";

const MotionDiv = motion.div;

export type GlassCardProps = CardProps & {
  glowColor?: string;
  animateEntrance?: boolean;
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { glowColor, animateEntrance = true, sx, children, ...props },
  ref,
) {
  const theme = useTheme();
  const glass = glassStyle(theme);

  const glowSx = glowColor
    ? { boxShadow: `${SHADOWS.md}, 0 0 24px ${glowColor}40` }
    : {};

  const combinedSx = [
    glass,
    glowSx,
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  if (!animateEntrance) {
    return (
      <Card ref={ref} sx={combinedSx} {...props}>
        {children}
      </Card>
    );
  }

  return (
    <Card
      ref={ref}
      component={MotionDiv}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={combinedSx}
      {...props}
    >
      {children}
    </Card>
  );
});
