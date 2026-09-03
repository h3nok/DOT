import os from 'os';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const maxForks = Math.max(1, Math.floor(os.cpus().length * 0.75));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ belongs to Playwright; vitest's default glob would otherwise claim it.
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    maxWorkers: maxForks,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
        'src/assets/**',
      ],
      // A ratchet, not a target: autoUpdate raises these as coverage grows, so
      // coverage can rise silently but can never fall silently.
      thresholds: {
        autoUpdate: true,
        statements: 4.13,
        branches: 51.66,
        functions: 37.5,
        lines: 4.13,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});