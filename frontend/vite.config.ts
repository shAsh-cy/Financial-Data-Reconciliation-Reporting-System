import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      // vendor-mui is legitimately large (MUI core + icons + DataGrid) and is
      // cached independently of app code, so the default 500 kB warning is noise.
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Split the heavy, rarely-changing vendor libraries out of the app
          // chunk so a code change does not invalidate ~1.3 MB of cached JS.
          //
          // Function form rather than the object form: react/react-dom are CJS,
          // so the commonjs plugin rewrites them to proxy module ids that the
          // object form's package-name matching never sees — they would silently
          // end up inside vendor-router instead of their own chunk.
          //
          // @mui/x-date-pickers is deliberately absent: it is only reachable
          // from the lazy /operations route and should stay in that chunk.
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return undefined;
            const path = id.replace(/\\/g, "/");
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(path)) return "vendor-react";
            if (/\/node_modules\/@mui\/(material|icons-material|x-data-grid)\//.test(path)) {
              return "vendor-mui";
            }
            if (/\/node_modules\/@emotion\//.test(path)) return "vendor-mui";
            if (/\/node_modules\/(recharts|d3-|victory-)/.test(path)) return "vendor-recharts";
            if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path)) {
              return "vendor-motion";
            }
            if (/\/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(path)) {
              return "vendor-router";
            }
            return undefined;
          },
        },
      },
    },
  };
});

