import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    // Honour PORT when a tool assigns one (preview harnesses, CI). Vite
    // ignores PORT by default and silently hops to the next free port,
    // which leaves the caller pointing at a port nothing is listening on.
    // strictPort only applies when PORT was set, so plain `npm run dev`
    // keeps its usual 5173-or-next-free behaviour.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    strictPort: Boolean(process.env.PORT),
    // Only /api needs proxying — uploaded files land directly in
    // frontend/public/uploads, which Vite already serves natively.
    // Matches the backend's default PORT in backend/src/server.js.
    proxy: {
      "/api": "http://localhost:5001",
    },
  },
});