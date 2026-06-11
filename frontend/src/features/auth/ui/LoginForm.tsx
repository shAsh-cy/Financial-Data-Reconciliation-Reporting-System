/**
 * LoginForm — MUI sign-in form with auth API integration (logic unchanged from legacy).
 */

import { useState } from "react";
import type React from "react";
import { isAxiosError, type AxiosError } from "axios";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

import { authApi } from "../api/authApi";
import { useAuth } from "../../../app/state/useAuth";

function messageFromAxiosError(err: AxiosError): string | null {
  const data = err.response?.data;
  if (typeof data === "string" && data.trim().length > 0) {
    return data.trim();
  }
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === "object" && item !== null && "msg" in item
            ? String((item as { msg: string }).msg)
            : String(item),
        )
        .join(" ");
    }
  }
  return null;
}

export function LoginForm() {
  const { setAccessToken, setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const token = await authApi.login(email, password);
      setAccessToken(token.access_token);
      const me = await authApi.me();
      setUser(me);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const status = err.response?.status;
        const fromApi = messageFromAxiosError(err);
        if (status === 404) {
          setError(
            "Could not reach the API (404). Ensure the backend is running on port 8000 and restart `npm run dev` so the /api proxy applies.",
          );
        } else if (fromApi) {
          setError(fromApi);
        } else if (status === 503) {
          setError(
            "Cannot reach the database. Check PostgreSQL, DATABASE_URL, and run: alembic upgrade head",
          );
        } else if (status === 500) {
          setError(
            "Server error during login. Check the API terminal logs; often this is a missing migration or DB connection issue.",
          );
        } else {
          setError("Login failed. Please verify your email and password.");
        }
      } else {
        setError("Login failed. Please verify your email and password.");
      }
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <TextField
        label="Email"
        type="email"
        variant="outlined"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        placeholder="name@company.com"
        disabled={isSubmitting}
      />
      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        variant="outlined"
        fullWidth
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={isSubmitting}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                  disabled={isSubmitting}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting}>
        {isSubmitting ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} color="inherit" />
            Signing in…
          </Box>
        ) : (
          "Sign in"
        )}
      </Button>
    </Box>
  );
}
