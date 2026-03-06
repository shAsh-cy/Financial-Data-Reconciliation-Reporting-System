import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";

import { useAuth } from "../state/useAuth";

type TopBarProps = {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
};

export function TopBar({ onMenuClick, showMenuButton }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const roleLabel =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "accountant"
        ? "Accountant"
        : user?.role === "viewer"
          ? "Viewer"
          : user?.role ?? "—";

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        color: "text.primary",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {showMenuButton && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={onMenuClick}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="body2" color="text.secondary">
            Environment-driven API • Auditable workflows
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {user ? (
            <>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                  {user.email}
                </Box>
                {" · "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  {roleLabel}
                </Box>
              </Typography>
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
