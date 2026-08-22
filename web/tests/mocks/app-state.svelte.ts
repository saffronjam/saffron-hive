export const page = $state({
  url: new URL("https://hive.test/"),
  state: {} as App.PageState,
});

export function setMockPageUrl(url: string | URL): void {
  page.url = new URL(url);
}

export function resetMockPage(): void {
  page.url = new URL("https://hive.test/");
  page.state = {};
}
