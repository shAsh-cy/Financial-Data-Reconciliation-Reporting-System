import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CompareArrows as ReconciliationsIcon,
  Assessment as ReportsIcon,
  Upload as IngestIcon,
} from "@mui/icons-material";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../state/useAuth";

type SidebarProps = {
  width: number;
  variant: "permanent" | "temporary";
  open: boolean;
  onClose: () => void;
};

const navItems = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/reconciliations", label: "Reconciliations", icon: <ReconciliationsIcon /> },
  { to: "/reports", label: "Reports", icon: <ReportsIcon /> },
];

export function Sidebar({ width, variant, open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const canIngest = user?.role === "admin" || user?.role === "accountant";

  const drawerContent = (
    <>
      <Typography
        variant="h6"
        sx={{
          px: 2,
          py: 2,
          fontWeight: 700,
          letterSpacing: 0.2,
        }}
      >
        Financial Dashboard
      </Typography>
      <List sx={{ px: 1 }}>
        {navItems.map(({ to, label, icon }) => {
          const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              onClick={variant === "temporary" ? onClose : undefined}
              selected={isActive}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: "inherit",
                }}
              >
                {icon}
              </ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          );
        })}
        {canIngest && (
          <ListItemButton
            component={NavLink}
            to="/transactions/ingest"
            onClick={variant === "temporary" ? onClose : undefined}
            selected={location.pathname === "/transactions/ingest"}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
              <IngestIcon />
            </ListItemIcon>
            <ListItemText primary="Ingest Transactions" />
          </ListItemButton>
        )}
      </List>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: variant === "permanent" ? width : undefined,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
          mt: variant === "permanent" ? 0 : 0,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
