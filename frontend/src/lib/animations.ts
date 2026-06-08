/**
 * Framer Motion animation primitives and timing constants aligned with theme tokens.
 */

import type { Variants } from "framer-motion";

import { DURATIONS, EASINGS } from "../theme/tokens";

export { DURATIONS, EASINGS };

const easeOut = [0.22, 1, 0.36, 1] as const;

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATIONS.normal / 1000, ease: easeOut },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.entrance / 1000, ease: easeOut },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATIONS.normal / 1000, ease: easeOut },
  },
};
