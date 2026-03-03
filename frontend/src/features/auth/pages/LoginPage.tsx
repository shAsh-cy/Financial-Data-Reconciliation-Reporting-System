import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { LoginForm } from "../ui/LoginForm";
import { useAuth } from "../../../app/state/useAuth";

import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Use your corporate credentials to access reporting and reconciliation tools.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}

