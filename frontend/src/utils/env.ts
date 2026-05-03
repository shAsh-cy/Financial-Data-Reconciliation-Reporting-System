/**
 * API base URL for axios.
 * - Leave `VITE_API_BASE_URL` unset (or empty) in dev: requests stay same-origin and
 *   Vite proxies `/api` → FastAPI (see `vite.config.ts`).
 * - Set `VITE_API_BASE_URL=http://127.0.0.1:8000` to call the backend directly.
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().replace(/\/$/, "");
  }
  return "";
}

export const env = {
  apiBaseUrl: resolveApiBaseUrl(),
} as const;

