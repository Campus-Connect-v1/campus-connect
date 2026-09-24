import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // loadEnv reads app/.env* files. process.env alone would not see them, and
  // relying on an inline env var means a config reload silently falls back to
  // the default -- a restarted dev server keeps the old process environment.
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_PROXY || "http://localhost:8000";

  return {
    plugins: [react()],
    // Express mounts this bundle at /admin, so every asset URL needs the
    // prefix. See the OPERATOR WEB APP block in server/server.js.
    base: "/admin/",
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Vendor libs change far less often than app code; splitting them
          // into their own chunk lets that chunk stay cached across deploys
          // instead of being invalidated by every app change.
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    server: {
      port: 5174,
      // The production bundle shares an origin with the API, so /api is
      // relative. In dev it has to be proxied to preserve that.
      proxy: {
        "/api": {
          target,
          changeOrigin: true, // Render routes by Host header
          secure: true,
          configure: (proxy) => {
            proxy.on("error", (err) => {
              console.error(
                `\n  API proxy could not reach ${target}` +
                  `\n  ${err.code || err.message}` +
                  `\n  Set VITE_API_PROXY in app/.env.development, or start the` +
                  ` API with: cd server && npm run dev\n`
              );
            });
          },
        },
      },
    },
    define: { __API_PROXY__: JSON.stringify(target) },
  };
});
