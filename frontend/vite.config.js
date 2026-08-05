import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/", // GitHub Pages base path (updated for public readiness)
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
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
