/**
 * LoginPage — centred glass card sign-in with gradient background and entrance animation.
 */

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, CardContent, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";

import { LoginForm } from "../ui/LoginForm";
import { useAuth } from "../../../app/state/useAuth";
import { GlassCard } from "../../../components/ui/GlassCard";
import { fadeInUp } from "../../../lib/animations";
import { DARK_COLORS, LIGHT_COLORS } from "../../../theme/tokens";

const MotionBox = motion.div;

export function LoginPage() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const isDark = theme.palette.mode === "dark";

  const backgroundSx = isDark
    ? {
        background: `radial-gradient(ellipse at 30% 20%, ${DARK_COLORS.panel} 0%, ${DARK_COLORS.background} 55%, #050810 100%)`,
      }
    : {
        background: `radial-gradient(ellipse at 30% 20%, #E8F0FE 0%, #F8FAFF 45%, ${LIGHT_COLORS.background} 100%)`,
      };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <Box
      component={MotionBox}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        ...backgroundSx,
      }}
    >
      <GlassCard
        animateEntrance={false}
        sx={{ width: "100%", maxWidth: 420, boxShadow: theme.shadows[8] }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use your corporate credentials to access reporting and reconciliation tools.
          </Typography>
          <LoginForm />
        </CardContent>
      </GlassCard>
    </Box>
  );
}
