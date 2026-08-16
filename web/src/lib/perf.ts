import { dev } from "$app/environment";

/**
 * Mount timing for a page, logged to the console.
 *
 * Two lines, because they fail for different reasons:
 *
 * - `mounted` / `painted` — component init through DOM insertion, and through
 *   to the first frame the browser drew. This is rendering cost, and it is
 *   what a heavy list page pays on every navigation.
 * - `data ready` — how long until the page had something worth showing. A
 *   large number here means waiting on a fetch, not on rendering.
 *
 * The lines are emitted separately so a page still reports its render cost
 * even when its data never arrives.
 *
 * On in development. To turn it on against a production build, set
 * `localStorage["hive:perf"] = "1"` and reload.
 */
export interface MountTimerOpts {
  /**
   * Called on every reactive update; the first time it returns true stops the
   * data clock. Omit for a page with no data gate.
   */
  ready?: () => boolean;
  /**
   * How many rows or cards the page is about to render. Reported alongside the
   * render cost, because on a list page that is what the cost scales with.
   */
  items?: () => number;
}

export interface MountTimer {
  /** Call from an `$effect` so the data clock can settle. */
  tick(): void;
}

const STYLE = "color:#f0a500;font-weight:bold";

function enabled(): boolean {
  if (typeof performance === "undefined") return false;
  if (dev) return true;
  try {
    return localStorage.getItem("hive:perf") === "1";
  } catch {
    return false;
  }
}

/**
 * Starts a page's mount timer. Call during component initialization:
 *
 * ```ts
 * const timer = measureMount("devices", { ready: () => $devicesHydrated });
 * $effect(() => timer.tick());
 * ```
 */
export function measureMount(label: string, opts: MountTimerOpts = {}): MountTimer {
  if (!enabled()) return { tick() {} };

  const started = performance.now();
  const mark = `hive:${label}`;
  performance.mark(`${mark}:init`);

  // Sampled synchronously, before anything has rendered. This is the only
  // point at which "the store already had it" can be told apart from "we
  // waited for it" — an $effect cannot run until after mount, so a tick-based
  // reading is floored by render cost and would report every cache hit as a
  // fetch.
  const hadDataAtInit = opts.ready ? opts.ready() : true;
  let dataAt: number | null = hadDataAtInit ? 0 : null;

  queueMicrotask(() => {
    const mounted = performance.now() - started;
    performance.mark(`${mark}:mounted`);
    requestAnimationFrame(() => {
      const painted = performance.now() - started;
      performance.mark(`${mark}:painted`);
      performance.measure(`${mark} mount`, `${mark}:init`, `${mark}:painted`);
      const data = hadDataAtInit ? "cached" : "waiting on fetch";
      const count = opts.items?.();
      const per =
        count && count > 0 ? ` · ${count} items (${(mounted / count).toFixed(1)}ms each)` : "";
      // Windowed tables render fewer rows than they have items; this is the
      // denominator that makes per-row cost honest.
      const domRows = document.querySelectorAll("tr[data-virtual-row]").length;
      const dom = domRows > 0 ? ` · ${domRows} rows in DOM` : "";
      console.log(
        `%c[perf] ${label}%c render ${mounted.toFixed(1)}ms · painted ${painted.toFixed(1)}ms · data ${data}${per}${dom}`,
        STYLE,
        "",
      );
    });
  });

  return {
    tick() {
      if (dataAt !== null || !opts.ready || !opts.ready()) return;
      dataAt = performance.now() - started;
      performance.mark(`${mark}:data`);
      performance.measure(`${mark} data`, `${mark}:init`, `${mark}:data`);
      console.log(
        `%c[perf] ${label}%c data arrived ${dataAt.toFixed(1)}ms after mount (network)`,
        STYLE,
        "",
      );
    },
  };
}
