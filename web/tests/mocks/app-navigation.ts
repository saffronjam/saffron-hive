import { page, setMockPageUrl } from "./app-state.svelte";

export const replaceStateCalls: URL[] = [];

export function replaceState(url: string | URL, state: App.PageState): void {
  const next = new URL(url, page.url);
  replaceStateCalls.push(next);
  page.state = state;
  setMockPageUrl(next);
}

export function resetMockNavigation(): void {
  replaceStateCalls.length = 0;
}
