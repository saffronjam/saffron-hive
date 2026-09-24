import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright-core";

export function browserDiagnostics(suite: string) {
  let page: Page | undefined;
  let tracing = false;
  const errors: string[] = [];

  return {
    async start(next: Page) {
      page = next;
      page.on("pageerror", (error) => errors.push(error.stack ?? error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("requestfailed", (request) => {
        errors.push(
          `${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`,
        );
      });
      await page.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
      tracing = true;
    },
    async capture(testName: string) {
      if (!page || page.isClosed()) return;
      const directory = join("test-results", suite, testName.replace(/[^a-zA-Z0-9_-]+/g, "-"));
      await mkdir(directory, { recursive: true });
      const captures: Promise<unknown>[] = [
        writeFile(
          join(directory, "browser.json"),
          JSON.stringify({ url: page.url(), errors }, null, 2),
        ),
        page.screenshot({ path: join(directory, "page.png"), fullPage: true, timeout: 5_000 }),
        page
          .locator("body")
          .innerText({ timeout: 5_000 })
          .then((body) => writeFile(join(directory, "page.txt"), body)),
      ];
      if (tracing) {
        tracing = false;
        captures.push(page.context().tracing.stop({ path: join(directory, "trace.zip") }));
      }
      for (const result of await Promise.allSettled(captures)) {
        if (result.status === "rejected")
          console.error("Browser diagnostic capture failed", result.reason);
      }
    },
  };
}
