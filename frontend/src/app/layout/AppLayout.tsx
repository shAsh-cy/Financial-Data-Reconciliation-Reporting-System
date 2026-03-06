import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, useTheme, useMediaQuery } from "@mui/material";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

const DRAWER_WIDTH = 260;

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarToggle = () => setSidebarOpen((o) => !o);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        width={DRAWER_WIDTH}
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? sidebarOpen : true}
        onClose={handleSidebarClose}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          ...(isMobile ? {} : { ml: `${DRAWER_WIDTH}px` }),
        }}
      >
        <TopBar onMenuClick={handleSidebarToggle} showMenuButton={isMobile} />
        <Box sx={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
