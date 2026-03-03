import { useState } from "react";
import type React from "react";

import { authApi } from "../api/authApi";
import { useAuth } from "../../../app/state/useAuth";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

import styles from "./LoginForm.module.css";

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
    } catch {
      setError("Login failed. Please verify your email and password.");
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

