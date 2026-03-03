import { useEffect, useState } from "react";
import type React from "react";

import { useAuth } from "../state/useAuth";
import { authApi } from "../../features/auth/api/authApi";

type AuthBootstrapProps = {
  children: React.ReactNode;
};

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const { accessToken, user, setUser, logout } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!accessToken) {
        setReady(true);
        return;
      }
      if (user) {
        setReady(true);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, setUser, logout]);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}

