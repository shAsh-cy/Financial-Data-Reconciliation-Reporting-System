import { useState } from "react";
import type React from "react";
import { isAxiosError, type AxiosError } from "axios";

import { authApi } from "../api/authApi";
import { useAuth } from "../../../app/state/useAuth";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

import styles from "./LoginForm.module.css";

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
    <form className={styles.form} onSubmit={onSubmit}>
      <div className={styles.row}>
        <div className={styles.label}>Email</div>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          placeholder="name@company.com"
        />
      </div>
      <div className={styles.row}>
        <div className={styles.label}>Password</div>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

