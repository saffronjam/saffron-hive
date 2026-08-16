export interface IconRef {
  source: "mdi" | "lucide";
  name: string;
}

export function parseIconRef(ref: string): IconRef | null {
  const idx = ref.indexOf(":");
  if (idx === -1) return null;
  const source = ref.slice(0, idx);
  const name = ref.slice(idx + 1);
  if (source !== "mdi" && source !== "lucide") return null;
  if (!name) return null;
  return { source, name };
}

export function kebabToPascal(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

export function kebabToMdiExport(s: string): string {
  return "mdi" + kebabToPascal(s);
}

let mdiModule: Record<string, string> | null = null;
let mdiPromise: Promise<Record<string, string>> | null = null;

export async function loadMdiPath(name: string): Promise<string | null> {
  if (!mdiModule) {
    if (!mdiPromise) {
      mdiPromise = import("@mdi/js").then((m) => {
        mdiModule = m as unknown as Record<string, string>;
        return mdiModule;
      });
    }
    mdiModule = await mdiPromise;
  }
  const key = kebabToMdiExport(name);
  return mdiModule[key] ?? null;
}

type LucideIconData = [string, Record<string, string>][];
let lucideModule: Record<string, LucideIconData> | null = null;
let lucidePromise: Promise<Record<string, LucideIconData>> | null = null;

export async function loadLucideData(name: string): Promise<LucideIconData | null> {
  if (!lucideModule) {
    if (!lucidePromise) {
      lucidePromise = import("lucide").then((m) => {
        lucideModule = m.icons as unknown as Record<string, LucideIconData>;
        return lucideModule;
      });
    }
    lucideModule = await lucidePromise;
  }
  const key = kebabToPascal(name);
  return lucideModule[key] ?? null;
}

/**
 * Warms both icon packs during idle time. The packs are single multi-megabyte
 * modules whose parse otherwise lands inside whichever navigation first renders
 * a custom icon; after this has run, that first render resolves from cache.
 */
export function prefetchIconPacks(): void {
  const warm = () => {
    void loadMdiPath("");
    void loadLucideData("");
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(warm, { timeout: 5000 });
  } else {
    setTimeout(warm, 2000);
  }
}
