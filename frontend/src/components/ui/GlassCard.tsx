/**
 * GlassCard — MUI Card with glassmorphism styling, optional entrance animation,
 * and a subtle hover lift (suppressed for reduced-motion users).
 */

import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();
  const glass = glassStyle(theme);

  const glowSx = glowColor
    ? { boxShadow: `${SHADOWS.md}, 0 0 24px ${glowColor}40` }
    : {};

  const userSx = Array.isArray(sx) ? sx : sx ? [sx] : [];

  if (!animateEntrance) {
    // Static card: CSS hover lift (the theme's MuiCard override transitions
    // transform + box-shadow already).
    const hoverSx = reduceMotion ? {} : { "&:hover": { transform: "translateY(-2px)" } };
    return (
      <Card ref={ref} sx={[glass, glowSx, hoverSx, ...userSx]} {...props}>
        {children}
      </Card>
    );
  }

  // Animated card: framer-motion owns the inline transform, so the hover lift
  // must go through whileHover — a CSS :hover rule would lose to that style.
  return (
    <Card
      ref={ref}
      component={MotionDiv}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      {...(reduceMotion ? {} : { whileHover: { y: -2 } })}
      sx={[glass, glowSx, ...userSx]}
      {...props}
    >
      {children}
    </Card>
  );
});
