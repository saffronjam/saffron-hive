/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { files, version } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE = `hive-${version}`;

/**
 * The SPA shell. `adapter-static` emits `index.html` as the fallback for every
 * route, so it is absent from `build`, `files` and `prerendered` and has to be
 * named explicitly.
 */
const SHELL = "/";

/**
 * Installed up front: the shell plus `static/` (icons, manifest). Small enough
 * that a new version is ready within a second of the first navigation.
 * Everything under `IMMUTABLE_PREFIX` is cached lazily on first use instead —
 * precaching all of `build` would pull the editor-only chunks down on every
 * deploy for a payload no launch actually reads.
 */
const PRECACHE = [SHELL, ...files];

/** Content-hashed by Vite, so a URL match is an exact content match. */
const IMMUTABLE_PREFIX = "/_app/immutable/";

/** Live data and user uploads: always the network, never a cache entry. */
const BYPASS = ["/graphql", "/api/", "/avatars/"];

sw.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return;
  if (BYPASS.some((prefix) => url.pathname.startsWith(prefix))) return;

  if (request.mode === "navigate") {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }

  if (url.pathname.startsWith(IMMUTABLE_PREFIX) || PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, url.pathname));
  }
});

async function cacheFirst(request: Request, key: string): Promise<Response> {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(key);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(key, response.clone());
  }
  return response;
}
