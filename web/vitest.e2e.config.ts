import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      $lib: resolve("src/lib"),
    },
  },
  test: {
    include: ["e2e/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    maxWorkers: 1,
    minWorkers: 1,
    setupFiles: ["e2e/vitest-setup.ts"],
    sequence: {
      sequential: true,
    },
  },
});
