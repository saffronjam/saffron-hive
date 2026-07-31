import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    runes: ({ filename }) => (filename.split(/[/\\]/).includes("node_modules") ? undefined : true),
  },
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
    }),
    prerender: {
      handleUnseenRoutes: "ignore",
    },
    // The shell is served at every depth by the SPA fallback, so its base has to
    // be absolute. A location-relative base resolves against the current URL, and
    // a two-segment path like /automations/<id> would make the router strip
    // "/automations" and fail to match the remaining segment.
    paths: {
      relative: false,
    },
  },
};

export default config;
