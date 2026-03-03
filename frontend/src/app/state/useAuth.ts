import { useStore } from "zustand";

import { authStore } from "./authStore";

export function useAuth() {
  const accessToken = useStore(authStore, (s) => s.accessToken);
  const user = useStore(authStore, (s) => s.user);
  const setAccessToken = useStore(authStore, (s) => s.setAccessToken);
  const setUser = useStore(authStore, (s) => s.setUser);
  const logout = useStore(authStore, (s) => s.logout);

  return {
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    setAccessToken,
    setUser,
    logout,
  };
}

