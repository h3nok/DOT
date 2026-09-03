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
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // Keep the entry's actual runtime together. The old entry-based
          // vendor chunk captured only React's wrapper modules (and therefore
          // emitted empty) while react-dom/client stayed in the application
          // chunk.
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/scheduler/")
          ) {
            return "framework";
          }

          if (
            id.includes("/node_modules/react-router/") ||
            id.includes("/node_modules/react-router-dom/")
          ) {
            return "router";
          }

          // Motion is shared by several lazy public surfaces. Keeping it out
          // of the entry prevents a visitor who opens a quiet route from
          // paying for every animation feature before that route is known.
          if (
            id.includes("/node_modules/framer-motion/") ||
            id.includes("/node_modules/motion-dom/") ||
            id.includes("/node_modules/motion-utils/")
          ) {
            return "motion";
          }

          // These substantial capabilities belong to the routes that use
          // them. In particular, Radix used to capture React's JSX runtime and
          // become an unconditional modulepreload on the public homepage.
          if (
            id.includes("/node_modules/@radix-ui/") ||
            id.includes("/node_modules/@floating-ui/") ||
            id.includes("/node_modules/react-remove-scroll/") ||
            id.includes("/node_modules/react-remove-scroll-bar/") ||
            id.includes("/node_modules/react-style-singleton/") ||
            id.includes("/node_modules/use-callback-ref/") ||
            id.includes("/node_modules/use-sidecar/")
          ) {
            return "radix";
          }

          return undefined;
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
