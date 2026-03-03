import { useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { useAuth } from "../state/useAuth";

import styles from "./TopBar.module.css";

export function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.bar}>
      <div className={styles.meta}>Environment-driven API • Auditable workflows</div>
      <div className={styles.meta}>
        {user ? (
          <>
            <span className={styles.email}>{user.email}</span>
            <span>({user.role})</span>
            <Button
              variant="default"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
            >
              Sign out
            </Button>
          </>
        ) : (
          <Button variant="default" onClick={() => navigate("/login")}>
            Sign in
          </Button>
        )}
      </div>
    </header>
  );
}

