import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The Express server mounts this bundle at /admin, so every asset URL has to
  // be prefixed to match. See the OPERATOR WEB APP block in server/server.js.
  base: "/admin/",
  build: { outDir: "dist", emptyOutDir: true },
  server: {
    port: 5174,
    // The production bundle is served by Express on the same origin as the API,
    // so /api is relative. In dev it has to be proxied to keep that assumption.
    //
    // Defaults to a local server on :8000. To develop the UI against the
    // deployed API instead, without running a server locally:
    //
    //   VITE_API_PROXY=https://campus-connect-api-o0xt.onrender.com npm run dev
    //
    // changeOrigin is required for the remote case: Render routes by Host
    // header and would otherwise not match the service.
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:8000",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
