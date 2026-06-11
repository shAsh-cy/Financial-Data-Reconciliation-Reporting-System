/**
 * TopBar — glassmorphic header with breadcrumbs, user chip, and sign-out.
 */

import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
  keyframes,
  useTheme,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

import { useAuth } from "../state/useAuth";
import { glassStyle } from "../../theme/glass";
import type { BreadcrumbItem } from "../router/routeMeta";

type TopBarProps = {
  breadcrumbs?: BreadcrumbItem[];
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

const borderPulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`;

function userInitial(user: { full_name: string | null; email: string }): string {
  const name = user.full_name?.trim();
  if (name && name.length > 0) {
    return name.charAt(0).toUpperCase();
  }
  return user.email.charAt(0).toUpperCase();
}

function roleLabel(role: string): string {
  if (role === "admin") return "Admin";
  if (role === "accountant") return "Accountant";
  if (role === "viewer") return "Viewer";
  return role;
}

export function TopBar({ breadcrumbs, onMenuClick, showMenuButton }: TopBarProps) {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const accent = theme.palette.primary.main;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        ...glassStyle(theme),
        color: "text.primary",
        borderRadius: 0,
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
        zIndex: theme.zIndex.appBar,
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          animation: `${borderPulse} 3s ease-in-out infinite`,
        },
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
            >
              <MenuIcon />
            </IconButton>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs
              aria-label="breadcrumb"
              sx={{ "& .MuiBreadcrumbs-li": { fontSize: 14 } }}
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (crumb.href && !isLast) {
                  return (
                    <Link
                      key={`${crumb.label}-${index}`}
                      underline="hover"
                      color="inherit"
                      href={crumb.href}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(crumb.href!);
                      }}
                      sx={{ fontSize: 14 }}
                    >
                      {crumb.label}
                    </Link>
                  );
                }
                return (
                  <Typography key={`${crumb.label}-${index}`} color="text.primary" variant="body2">
                    {crumb.label}
                  </Typography>
                );
              })}
            </Breadcrumbs>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          {user ? (
            <>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14, fontWeight: 700 }}>
                  {userInitial(user)}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}>
                  {user.full_name ?? user.email.split("@")[0]}
                </Typography>
                <Chip
                  label={roleLabel(user.role)}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ height: 24, "& .MuiChip-label": { px: 1, fontSize: 11 } }}
                />
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  logout();
                  navigate("/login", { replace: true });
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <Button variant="contained" size="small" onClick={() => navigate("/login")}>
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
