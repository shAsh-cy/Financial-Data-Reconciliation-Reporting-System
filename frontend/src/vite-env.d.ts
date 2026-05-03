/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Full API origin, e.g. http://127.0.0.1:8000. Omit to use Vite /api proxy in dev. */
  readonly VITE_API_BASE_URL?: string;
  /** Proxy target for /api in dev (default http://127.0.0.1:8000). */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

