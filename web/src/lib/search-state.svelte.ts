import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import { emptySearchState, type SearchState } from "$lib/components/hive-searchbar";

export interface UrlSearchState {
  readonly value: SearchState;
  set(next: SearchState): void;
}

export interface UrlSearchStateOptions {
  active: () => boolean;
}

function copySearchState(state: SearchState): SearchState {
  return {
    chips: state.chips.map((chip) => ({ ...chip })),
    freeText: state.freeText,
  };
}

function searchStateKey(state: SearchState): string {
  return JSON.stringify(state);
}

export function searchStateFromUrl(url: URL): SearchState {
  const chips: SearchState["chips"] = [];
  for (const filter of url.searchParams.getAll("filter")) {
    const separator = filter.indexOf(":");
    if (separator <= 0) continue;
    chips.push({
      keyword: filter.slice(0, separator),
      value: filter.slice(separator + 1),
    });
  }
  return {
    chips,
    freeText: url.searchParams.get("q") ?? "",
  };
}

export function urlWithSearchState(url: URL, state: SearchState): URL {
  const next = new URL(url);
  next.searchParams.delete("q");
  next.searchParams.delete("filter");
  if (state.freeText !== "") next.searchParams.set("q", state.freeText);
  for (const chip of state.chips) {
    if (chip.keyword === "") continue;
    next.searchParams.append("filter", `${chip.keyword}:${chip.value}`);
  }
  return next;
}

export function createUrlSearchState(options: UrlSearchStateOptions): UrlSearchState {
  const initial = options.active() ? searchStateFromUrl(page.url) : emptySearchState();
  let value = $state<SearchState>(initial);
  let currentKey = searchStateKey(initial);

  function adoptUrlState(force: boolean): void {
    if (!options.active()) return;
    const next = searchStateFromUrl(page.url);
    const nextKey = searchStateKey(next);
    if (!force && nextKey === currentKey) return;
    currentKey = nextKey;
    value = next;
  }

  $effect(() => {
    void page.url.href;
    adoptUrlState(false);
  });

  afterNavigate(() => adoptUrlState(true));

  return {
    get value() {
      return value;
    },
    set(next: SearchState) {
      const owned = copySearchState(next);
      value = owned;
      currentKey = searchStateKey(owned);
      if (!options.active()) return;
      replaceState(urlWithSearchState(page.url, owned), page.state);
    },
  };
}
