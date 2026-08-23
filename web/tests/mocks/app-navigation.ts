import { page, setMockPageUrl } from "./app-state.svelte";

export const replaceStateCalls: URL[] = [];
const afterNavigateCallbacks = new Set<() => void>();

export function afterNavigate(callback: () => void): void {
  afterNavigateCallbacks.add(callback);
}

export function runAfterNavigate(): void {
  for (const callback of afterNavigateCallbacks) callback();
}

export function replaceState(url: string | URL, state: App.PageState): void {
  const next = new URL(url, page.url);
  replaceStateCalls.push(next);
  page.state = state;
  setMockPageUrl(next);
}

export function resetMockNavigation(): void {
  replaceStateCalls.length = 0;
  afterNavigateCallbacks.clear();
}
