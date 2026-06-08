/**
 * AnimatedNumber — spring-animated numeric display from previous/zero to target value.
 */

import { useEffect, useState } from "react";
import { useMotionValue, useSpring, useMotionValueEvent } from "framer-motion";
import { Typography, type TypographyProps } from "@mui/material";

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

  return (
    <Typography variant="h5" fontWeight={600} component="span" {...typographyProps}>
      {display}
    </Typography>
  );
}
