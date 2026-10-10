import { defineConfig, devices } from "@playwright/test";

// Its own strict port, so a dev server already running on 5173/5174 can never
// be mistaken for the server under test.
const PORT = 5199;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Allow resource-constrained local verification to run serially while CI
  // retains its normal two-worker limit.
  workers: process.env.DOT_E2E_WORKERS ? Number(process.env.DOT_E2E_WORKERS) : process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    // Bind the address baseURL names. Left to "localhost", Vite can listen on
    // IPv6 ::1 (as on GitHub's runners) while Playwright waits on 127.0.0.1.
    command: `pnpm exec vite --host 127.0.0.1 --port ${PORT} --strictPort`,
    // The preview and test server must never rewrite each other's optimized
    // dependencies when a lockfile update causes Vite to refresh its cache.
    env: { DOT_VITE_CACHE_DIR: ".vite-cache/playwright" },
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
