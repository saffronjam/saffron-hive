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

function applyTheme(theme: Theme): void {
	if (typeof document === "undefined") return;
	document.documentElement.classList.toggle("dark", theme === "dark");
}

function createThemeStore() {
	const initial = getInitialTheme();
	const { subscribe, set, update } = writable<Theme>(initial);

	applyTheme(initial);

	return {
		subscribe,

		/** Set the theme to a specific value. */
		setTheme(theme: Theme) {
			localStorage.setItem(STORAGE_KEY, theme);
			applyTheme(theme);
			set(theme);
		},

		/** Toggle between light and dark themes. */
		toggle() {
			update((current) => {
				const next: Theme = current === "dark" ? "light" : "dark";
				localStorage.setItem(STORAGE_KEY, next);
				applyTheme(next);
				return next;
			});
		},
	};
}

/** Global theme store with localStorage persistence. */
export const theme = createThemeStore();
