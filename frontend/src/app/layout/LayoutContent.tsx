/**
 * LayoutContent — centralised main content area with consistent padding and a
 * subtle fade-up transition on route change.
 */

import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

import { fadeIn } from "../../lib/animations";

export function LayoutContent({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <Box
      component="section"
      sx={{
        flex: 1,
        minWidth: 0,
        overflow: "auto",
        p: 3,
      }}
    >
      {/* Re-keying on pathname replays the fade for each navigation. */}
      <motion.div
        key={location.pathname}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.div>
    </Box>
  );
}
