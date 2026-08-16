import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../api/schema.graphql",
  documents: ["src/**/*.{svelte,ts}", "e2e/**/*.ts"],
  generates: {
    "src/lib/gql/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
      presetConfig: {
        // Fragment spreads resolve to plain inlined types, so a shared
        // selection set reads the same as one written out by hand and needs
        // no unwrapping at the point of use.
        fragmentMasking: false,
      },
    },
  },
};

export default config;
