import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/", // GitHub Pages base path (updated for public readiness)
  // Keep generated optimizer state outside node_modules. Local containers have
  // historically mounted that directory under a different uid, which leaves
  // Vite unable to refresh stale lazy-module dependencies.
  cacheDir: ".vite-cache",
  plugins: [
    react(),
    tailwindcss(),
    // A bundle map is useful locally and is also a 1 MB implementation map we
    // have no reason to publish beside the book. Generate it only for the
    // explicit analysis command, never for a normal release.
    ...(process.env.ANALYZE === "1"
      ? [
          visualizer({
            filename: "dist/stats.html",
            open: false,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        },
      },
    },
  },
  // PWA Configuration
  server: {
    headers: {
      "Service-Worker-Allowed": "/",
    },
    // No dev proxy: the frontend calls the orchestrator directly at
    // VITE_ORCHESTRATOR_URL, which is the only backend (ADR-0009).
  },
  // Ensure manifest.json and service worker are copied
  publicDir: "public",
});
