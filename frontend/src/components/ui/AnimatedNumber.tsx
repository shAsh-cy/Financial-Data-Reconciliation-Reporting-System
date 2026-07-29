/**
 * AnimatedNumber — spring-animated numeric display from previous/zero to target value.
 */

import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import { Box, Typography, type SxProps, type Theme, type TypographyProps } from "@mui/material";

/** Off-screen but still announced — the standard visually-hidden recipe. */
const srOnly: SxProps<Theme> = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  typographyProps?: TypographyProps;
};

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  typographyProps,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(`${prefix}${(0).toFixed(decimals)}${suffix}`);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(`${prefix}${latest.toFixed(decimals)}${suffix}`);
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  const settled = `${prefix}${value.toFixed(decimals)}${suffix}`;

  return (
    <>
      {/* The spring emits ~60 changes per second. Hiding the animated text from
          assistive tech and announcing only the settled target below keeps a
          screen reader from reading every intermediate frame. */}
      <Typography
        variant="h5"
        fontWeight={600}
        component="span"
        aria-hidden="true"
        {...typographyProps}
      >
        {display}
      </Typography>
      <Box component="span" aria-live="polite" sx={srOnly}>
        {settled}
      </Box>
    </>
  );
}
