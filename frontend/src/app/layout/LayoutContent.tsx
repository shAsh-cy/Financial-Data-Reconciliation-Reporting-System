/**
 * LayoutContent — centralised main content area with consistent padding.
 */

import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";

export function LayoutContent({ children }: PropsWithChildren) {
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
      {children}
    </Box>
  );
}
