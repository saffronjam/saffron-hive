import { page, setMockPageUrl } from "./app-state.svelte";

export const replaceStateCalls: URL[] = [];
export const pushStateCalls: Array<{ url: URL; state: App.PageState }> = [];
export const gotoCalls: Array<{
  url: URL;
  options: {
    replaceState?: boolean;
    keepFocus?: boolean;
    noScroll?: boolean;
  };
}> = [];
const afterNavigateCallbacks = new Set<() => void>();
const beforeNavigateCallbacks = new Set<
  (navigation: { from: { url: URL } | null; to: { url: URL } | null; cancel: () => void }) => void
>();

export function afterNavigate(callback: () => void): void {
  afterNavigateCallbacks.add(callback);
}

export function beforeNavigate(
  callback: (navigation: {
    from: { url: URL } | null;
    to: { url: URL } | null;
    cancel: () => void;
  }) => void,
): void {
  beforeNavigateCallbacks.add(callback);
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

export function pushState(url: string | URL, state: App.PageState): void {
  const next = new URL(url, page.url);
  pushStateCalls.push({ url: next, state });
  page.state = state;
}

export function resetMockNavigation(): void {
  replaceStateCalls.length = 0;
  pushStateCalls.length = 0;
  gotoCalls.length = 0;
  afterNavigateCallbacks.clear();
  beforeNavigateCallbacks.clear();
}
