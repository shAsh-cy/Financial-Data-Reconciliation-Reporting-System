import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CompareArrows as ReconciliationsIcon,
  Assessment as ReportsIcon,
  Upload as IngestIcon,
} from "@mui/icons-material";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../state/useAuth";

type SidebarProps = {
  expandedWidth: number;
  collapsedWidth: number;
  variant: "permanent" | "temporary";
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/reconciliations", label: "Reconciliations", icon: <ReconciliationsIcon /> },
  { to: "/reports", label: "Reports", icon: <ReportsIcon /> },
];

export function Sidebar({
  expandedWidth,
  collapsedWidth,
  variant,
  open,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  const canIngest = user?.role === "admin" || user?.role === "accountant";
  const isCollapsed = variant === "permanent" && !hovered;
  const drawerWidth = variant === "permanent" ? (isCollapsed ? collapsedWidth : expandedWidth) : expandedWidth;

  const drawerContent = (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{ height: "100%", overflowX: "hidden" }}
    >
      <Typography
        variant="h6"
        sx={{
          px: 2.5,
          py: 2,
          fontWeight: 700,
          letterSpacing: 0.2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          opacity: isCollapsed ? 0 : 1,
          transition: "opacity 200ms ease",
        }}
      >
        Financial Dashboard
      </Typography>
      <List sx={{ px: 1 }}>
        {navItems.map(({ to, label, icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          const navNode = (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              onClick={variant === "temporary" ? onClose : undefined}
              selected={isActive}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                px: isCollapsed ? 1.25 : 1.5,
                justifyContent: isCollapsed ? "center" : "flex-start",
                transition: "all 200ms ease",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 0 : 36,
                  mr: isCollapsed ? 0 : 1,
                  color: "inherit",
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                sx={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: "opacity 200ms ease",
                  "& .MuiTypography-root": { whiteSpace: "nowrap" },
                }}
              />
            </ListItemButton>
          );

          return (
            <Tooltip key={to} title={isCollapsed ? label : ""} placement="right">
              {navNode}
            </Tooltip>
          );
        })}
        {canIngest && (
          <Tooltip title={isCollapsed ? "Ingest Transactions" : ""} placement="right">
            <ListItemButton
              component={NavLink}
              to="/transactions/ingest"
              onClick={variant === "temporary" ? onClose : undefined}
              selected={location.pathname === "/transactions/ingest"}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                minHeight: 44,
                px: isCollapsed ? 1.25 : 1.5,
                justifyContent: isCollapsed ? "center" : "flex-start",
                transition: "all 200ms ease",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isCollapsed ? 0 : 36,
                  mr: isCollapsed ? 0 : 1,
                  color: "inherit",
                }}
              >
                <IngestIcon />
              </ListItemIcon>
              <ListItemText
                primary="Ingest Transactions"
                sx={{
                  opacity: isCollapsed ? 0 : 1,
                  transition: "opacity 200ms ease",
                  "& .MuiTypography-root": { whiteSpace: "nowrap" },
                }}
              />
            </ListItemButton>
          </Tooltip>
        )}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: variant === "permanent" ? drawerWidth : undefined,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          overflowX: "hidden",
          transition: "width 220ms ease",
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
