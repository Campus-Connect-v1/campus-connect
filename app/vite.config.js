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
    // In dev the API still runs on 8000; proxying keeps the same-origin
    // assumption the production build relies on.
    proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } },
  },
});
