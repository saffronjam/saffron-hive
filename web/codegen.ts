import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: ["../api/schema.graphql", "../api/assistant.graphql", "../api/authoring.graphql"],
  documents: ["src/**/*.{svelte,ts}", "e2e/**/*.ts"],
  generates: {
    "src/lib/gql/": {
      preset: "client",
      config: {
        useTypeImports: true,
 scalars: { JSON: "unknown", AuthoringConnector: "string", AuthoringClauseSubject: "string", AuthoringClauseOp: "string", EffectColorMode: "string" },
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
