import { defineConfig } from "vitest/config";

export default defineConfig({
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
