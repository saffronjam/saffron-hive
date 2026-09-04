import { readFile, writeFile } from "node:fs/promises";

const languages = ["en", "sv", "ru"];
for (const language of languages) {
  const messages = JSON.parse(
    await readFile(new URL(`../messages/${language}.json`, import.meta.url), "utf8"),
  );
  const manifest = {
    id: "/",
    name: "Saffron Hive",
    short_name: "Hive",
    description: messages.static_app_description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
  await writeFile(
    new URL(`../static/manifest.${language}.webmanifest`, import.meta.url),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}
