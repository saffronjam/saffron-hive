const CACHE_NAME = "hive-device-images-v1";

export async function cachedDeviceImage(url: string): Promise<Response | null> {
  if (typeof caches === "undefined") return null;
  try {
    return (await (await caches.open(CACHE_NAME)).match(url)) ?? null;
  } catch {
    return null;
  }
}

export async function cacheDeviceImage(url: string, response: Response): Promise<void> {
  if (typeof caches === "undefined") return;
  const copy = response.clone();
  try {
    const cache = await caches.open(CACHE_NAME);
    const target = new URL(url, window.location.origin);
    const keys = await cache.keys();
    await Promise.all(
      keys
        .filter((key) => {
          const cached = new URL(key.url);
          return cached.pathname === target.pathname && cached.search !== target.search;
        })
        .map((key) => cache.delete(key)),
    );
    await cache.put(url, copy);
  } catch {
    return;
  }
}

export async function clearDeviceImageCache(): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    return;
  }
}
