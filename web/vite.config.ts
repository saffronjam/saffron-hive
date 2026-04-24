import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  define: {
    __HIVE_VERSION__: JSON.stringify(process.env.HIVE_VERSION || "localbuild"),
  },
  server: {
    proxy: {
      "/graphql": {
        target: "http://localhost:8080",
        ws: true,
      },
      "/api": {
        target: "http://localhost:8080",
      },
      "/avatars": {
        target: "http://localhost:8080",
      },
    },
  },
});
