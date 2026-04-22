import { writable } from "svelte/store";

/** Available theme values. */
export type Theme = "light" | "dark";

const STORAGE_KEY = "saffron-hive-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

const TRANSITION_CLASS = "theme-transitioning";
const TRANSITION_MS = 280;
let transitionTimer: ReturnType<typeof setTimeout> | null = null;

function applyTheme(theme: Theme, animate = false): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const current = root.classList.contains("dark") ? "dark" : "light";
  if (animate && current !== theme) {
    root.classList.add(TRANSITION_CLASS);
    if (transitionTimer !== null) clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => {
      root.classList.remove(TRANSITION_CLASS);
      transitionTimer = null;
    }, TRANSITION_MS);
  }
  root.classList.toggle("dark", theme === "dark");
}

function createThemeStore() {
  const initial = getInitialTheme();
  const { subscribe, set, update } = writable<Theme>(initial);

  applyTheme(initial, false);

  function persist(theme: Theme, animate: boolean) {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, theme);
    }
    applyTheme(theme, animate);
    set(theme);
  }

  return {
    subscribe,

    /** Set the theme to a specific value and persist locally. */
    setTheme(theme: Theme) {
      persist(theme, true);
    },

    /** Toggle between light and dark themes. */
    toggle() {
      update((current) => {
        const next: Theme = current === "dark" ? "light" : "dark";
        persist(next, true);
        return next;
      });
    },

    /**
     * Align the store with the server-side preference. Called when `me` loads
     * and after `updateCurrentUser` so the local cache always reflects the
     * signed-in user's saved theme. The localStorage mirror persists across
     * reloads and is used as the pre-auth fallback on the next visit.
     */
    syncFromProfile(theme: Theme) {
      persist(theme, true);
    },
  };
}

/** Global theme store with localStorage persistence. */
export const theme = createThemeStore();
