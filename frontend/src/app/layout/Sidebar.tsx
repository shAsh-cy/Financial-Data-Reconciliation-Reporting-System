/**
 * Sidebar — collapsible hover-expand nav with glass styling, brand, and theme toggle.
 */

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  CompareArrows as ReconciliationsIcon,
  Assessment as ReportsIcon,
  Settings as OperationsIcon,
  SwapHoriz as TransactionsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../state/useAuth";
import { useThemeStore } from "../state/themeStore";
import { DARK_COLORS, LIGHT_COLORS } from "../../theme/tokens";

type SidebarProps = {
  expandedWidth: number;
  collapsedWidth: number;
  variant: "permanent" | "temporary";
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  roles?: Array<"admin" | "accountant" | "viewer">;
};

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon fontSize="small" /> },
  { to: "/reconciliations", label: "Reconciliations", icon: <ReconciliationsIcon fontSize="small" /> },
  { to: "/reports", label: "Reports", icon: <ReportsIcon fontSize="small" /> },
  {
    to: "/operations",
    label: "Operations",
    icon: <OperationsIcon fontSize="small" />,
    roles: ["admin", "accountant"],
  },
  {
    to: "/transactions/ingest",
    label: "Transactions",
    icon: <TransactionsIcon fontSize="small" />,
    roles: ["admin", "accountant"],
  },
];

function isNavActive(pathname: string, to: string): boolean {
  return to === "/" ? pathname === "/" : pathname.startsWith(to);
}

export function Sidebar({
  expandedWidth,
  collapsedWidth,
  variant,
  open,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  const isDark = mode === "dark";
  const isCollapsed = variant === "permanent" && !hovered;
  const drawerWidth =
    variant === "permanent" ? (isCollapsed ? collapsedWidth : expandedWidth) : expandedWidth;

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role as "admin" | "accountant" | "viewer");
  });

  const drawerPaperSx = isDark
    ? {
        background: `linear-gradient(180deg, ${DARK_COLORS.background} 0%, ${DARK_COLORS.panel} 100%)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        backgroundColor: DARK_COLORS.glassBg,
        borderRight: `1px solid ${DARK_COLORS.border}`,
        boxShadow: "none",
      }
    : {
        bgcolor: LIGHT_COLORS.background,
        borderRight: "1px solid",
        borderColor: "divider",
        boxShadow: "2px 0 12px rgba(15, 23, 42, 0.06)",
      };

  // Active styling is driven by MUI's `.Mui-selected` class, set via the
  // `selected` prop from useLocation().
  function navItemSx() {
    const base = {
      borderRadius: 1.5,
      mb: 0.5,
      minHeight: 44,
      px: isCollapsed ? 1.25 : 1.5,
      justifyContent: isCollapsed ? "center" : "flex-start",
      transition: "all 220ms ease",
      position: "relative" as const,
      overflow: "hidden",
    };

    if (isDark) {
      return {
        ...base,
        "&:hover .nav-icon": {
          filter: `drop-shadow(0 0 6px ${DARK_COLORS.accent})`,
        },
        "&.Mui-selected": {
          bgcolor: "rgba(0, 212, 255, 0.1)",
          color: DARK_COLORS.accent,
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: "20%",
            bottom: "20%",
            width: 3,
            borderRadius: 2,
            bgcolor: DARK_COLORS.accent,
            boxShadow: `0 0 12px ${DARK_COLORS.accent}`,
          },
        },
      };
    }

    return {
      ...base,
      "&.Mui-selected": {
        bgcolor: "rgba(26, 86, 219, 0.08)",
        color: "primary.main",
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: "15%",
          bottom: "15%",
          width: 3,
          borderRadius: 2,
          bgcolor: "primary.main",
        },
      },
    };
  }

  const drawerContent = (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      sx={{
        height: "100%",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: isCollapsed ? 1.5 : 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          gap: 1.5,
          minHeight: 64,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: 0.5,
            flexShrink: 0,
            border: `2px solid ${isDark ? DARK_COLORS.accent : theme.palette.primary.main}`,
            color: isDark ? DARK_COLORS.accent : "primary.main",
            boxShadow: isDark ? `0 0 12px ${DARK_COLORS.accent}40` : "none",
          }}
        >
          FR
        </Box>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              key="brand-label"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                FinRecon
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <List sx={{ px: 1, flex: 1 }}>
        {visibleItems.map(({ to, label, icon }) => {
          const active = isNavActive(location.pathname, to);
          const navNode = (
            <ListItemButton
              key={to}
              component={NavLink}
              to={to}
              onClick={variant === "temporary" ? onClose : undefined}
              selected={active}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              sx={navItemSx()}
            >
              <ListItemIcon
                className="nav-icon"
                sx={{
                  minWidth: isCollapsed ? 0 : 36,
                  mr: isCollapsed ? 0 : 1,
                  color: "inherit",
                  transition: "filter 220ms ease",
                }}
              >
                {icon}
              </ListItemIcon>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    key={`label-${to}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18 }}
                    style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                  >
                    <ListItemText primary={label} />
                  </motion.div>
                )}
              </AnimatePresence>
            </ListItemButton>
          );

          return (
            <Tooltip key={to} title={isCollapsed ? label : ""} placement="right">
              {navNode}
            </Tooltip>
          );
        })}
      </List>

      <Box sx={{ p: 1.5, display: "flex", justifyContent: isCollapsed ? "center" : "flex-end" }}>
        <Tooltip title={isDark ? "Light mode" : "Dark mode"} placement="right">
          <IconButton
            onClick={toggleMode}
            aria-label="Toggle theme"
            sx={{
              color: isDark ? DARK_COLORS.accent : "primary.main",
              "&:hover": {
                bgcolor: isDark ? "rgba(0, 212, 255, 0.1)" : "rgba(26, 86, 219, 0.08)",
              },
            }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>
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
          overflowX: "hidden",
          transition: "width 220ms ease",
          ...drawerPaperSx,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
