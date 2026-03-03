import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";

import type { UserRead } from "../../types/auth";

export type AuthState = {
  accessToken: string | null;
  user: UserRead | null;
  setAccessToken: (token: string | null) => void;
  setUser: (user: UserRead | null) => void;
  logout: () => void;
};

export const authStore = createStore<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: "auth",
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    },
  ),
);

