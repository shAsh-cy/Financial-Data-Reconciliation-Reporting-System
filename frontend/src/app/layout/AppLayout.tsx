/**
 * AppLayout — shell with glass sidebar, top bar, and padded content outlet.
 */

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, useTheme, useMediaQuery } from "@mui/material";

import { DemoBanner } from "../../components/ui/DemoBanner";
import { LayoutContent } from "./LayoutContent";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useRouteBreadcrumbs } from "./useRouteBreadcrumbs";

const DRAWER_EXPANDED_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 72;

export function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const breadcrumbs = useRouteBreadcrumbs();

  const handleSidebarClose = () => setSidebarOpen(false);
  const handleSidebarToggle = () => setSidebarOpen((o) => !o);

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh", overflowX: "hidden" }}>
      <Sidebar
        expandedWidth={DRAWER_EXPANDED_WIDTH}
        collapsedWidth={DRAWER_COLLAPSED_WIDTH}
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? sidebarOpen : true}
        onClose={handleSidebarClose}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <TopBar
          breadcrumbs={breadcrumbs}
          onMenuClick={handleSidebarToggle}
          showMenuButton={isMobile}
        />
        <LayoutContent>
          <DemoBanner />
          <Outlet />
        </LayoutContent>
      </Box>
    </Box>
  );
}
