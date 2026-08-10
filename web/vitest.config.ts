import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: resolve("src/lib"),
    },
    // Svelte ships a server build and a client one; tests mount components into
    // jsdom, so they need the client half.
    conditions: ["browser"],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "jsdom",
  },
});
