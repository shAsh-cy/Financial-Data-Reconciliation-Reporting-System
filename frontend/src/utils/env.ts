/**
 * API base URL for axios.
 * - Leave `VITE_API_BASE_URL` unset (or empty) in dev: requests stay same-origin and
 *   Vite proxies `/api` → FastAPI (see `vite.config.ts`).
 * - Set `VITE_API_BASE_URL=http://127.0.0.1:8000` (origin only) to call the backend directly.
 *
 * Requests use paths like `/api/v1/...`. If the env value mistakenly includes `/api/v1`,
 * the final URL becomes `/api/v1/api/v1/...` and detail routes return 404.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw !== "string" || raw.trim() === "") {
    return "";
  }
  let base = raw.trim().replace(/\/+$/, "");
  const suffix = "/api/v1";
  if (base.length >= suffix.length && base.toLowerCase().endsWith(suffix)) {
    base = base.slice(0, base.length - suffix.length).replace(/\/+$/, "");
  }
  return base;
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
} as const;

