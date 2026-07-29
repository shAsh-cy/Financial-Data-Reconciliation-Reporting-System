/**
 * Demo mode store — tracks synthetic data banner visibility app-wide.
 */

import { create } from "zustand";

import { env } from "../../utils/env";

export type DemoState = {
  isDemoActive: boolean;
  setDemoActive: (active: boolean) => void;
};

export const useDemoStore = create<DemoState>((set) => ({
  isDemoActive: env.demoMode,
  setDemoActive: (active) => set({ isDemoActive: active }),
}));

/** Call when an API response includes meta.is_demo: true. */
export function activateDemoFromMeta(meta: Record<string, unknown> | undefined): void {
  if (meta?.is_demo === true) {
    useDemoStore.getState().setDemoActive(true);
  }
}
