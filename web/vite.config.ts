import { sveltekit } from "@sveltejs/kit/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
      strategy: ["globalVariable", "baseLocale"],
      emitTsDeclarations: true,
      emitGitIgnore: false,
      emitReadme: false,
      outputStructure: "locale-modules",
    }),
  ],
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
