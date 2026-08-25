import { page, setMockPageUrl } from "./app-state.svelte";

export const replaceStateCalls: URL[] = [];
export const gotoCalls: Array<{
  url: URL;
  options: {
    replaceState?: boolean;
    keepFocus?: boolean;
    noScroll?: boolean;
  };
}> = [];
const afterNavigateCallbacks = new Set<() => void>();

export function afterNavigate(callback: () => void): void {
  afterNavigateCallbacks.add(callback);
}

export function runAfterNavigate(): void {
  for (const callback of afterNavigateCallbacks) callback();
}

export function goto(
  url: string | URL,
  options: {
    replaceState?: boolean;
    keepFocus?: boolean;
    noScroll?: boolean;
  } = {},
): Promise<void> {
  const next = new URL(url, page.url);
  gotoCalls.push({ url: next, options });
  setMockPageUrl(next);
  runAfterNavigate();
  return Promise.resolve();
}

export function replaceState(url: string | URL, state: App.PageState): void {
  const next = new URL(url, page.url);
  replaceStateCalls.push(next);
  page.state = state;
}

export function resetMockNavigation(): void {
  replaceStateCalls.length = 0;
  gotoCalls.length = 0;
  afterNavigateCallbacks.clear();
}
