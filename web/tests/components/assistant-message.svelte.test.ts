import { afterEach, beforeEach, expect, it } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import Message from "$lib/components/assistant/message.svelte";

let host: HTMLDivElement;
let component: ReturnType<typeof mount>;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(async () => {
  await unmount(component);
  host.remove();
});

it("renders tables between paragraphs with inline formatting and aligned columns", () => {
  component = mount(Message, {
    target: host,
    props: {
      text: `Your automations:

| Name | Nodes | Status |
| :--- | ---: | :---: |
| **Bedroom switch** | 8 | [Open](/automations/bedroom) |
| Movie time | 6 | Off |

All are disabled.`,
    },
  });
  flushSync();
  expect([...host.querySelectorAll("th")].map((el) => el.textContent)).toEqual([
    "Name",
    "Nodes",
    "Status",
  ]);
  expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
  expect(host.querySelector("td strong")?.textContent).toBe("Bedroom switch");
  expect(host.querySelector("td a")?.getAttribute("href")).toBe("/automations/bedroom");
  expect(host.querySelectorAll("th")[1].style.textAlign).toBe("right");
  expect(host.querySelectorAll("td")[2].style.textAlign).toBe("center");
  expect(host.textContent).toContain("All are disabled.");
});

it("handles optional outer pipes, escaped pipes, code and missing cells safely", () => {
  component = mount(Message, {
    target: host,
    props: {
      text: "Name | Value\n--- | ---\nA\\|B | `on|off`\nShort |\n<img src=x onerror=alert(1)> | [Unsafe](javascript:alert)",
    },
  });
  flushSync();
  expect([...host.querySelectorAll("td")].map((el) => el.textContent)).toEqual([
    "A|B",
    "on|off",
    "Short",
    "",
    "<img src=x onerror=alert(1)>",
    "[Unsafe](javascript:alert)",
  ]);
  expect(host.querySelector("td code")?.textContent).toBe("on|off");
  expect(host.querySelector("img,script,a")).toBeNull();
});

it("leaves fenced examples and incomplete table headers as text", () => {
  component = mount(Message, {
    target: host,
    props: {
      text: "```markdown\n| Name | Value |\n| --- | --- |\n| A | B |\n```\n\n| Name | Value |\n| --- |",
    },
  });
  flushSync();
  expect(host.querySelector("table")).toBeNull();
  expect(host.querySelector("pre code")?.textContent).toContain("| A | B |");
});

it("fills table rows as a response streams without replacing the table", () => {
  const props = $state({ text: "| Name | State |\n| --- |" });
  component = mount(Message, { target: host, props });
  flushSync();
  expect(host.querySelector("table")).toBeNull();
  props.text += " --- |\n| Bedroom |";
  flushSync();
  const table = host.querySelector("table");
  expect(table).not.toBeNull();
  expect([...host.querySelectorAll("td")].map((cell) => cell.textContent)).toEqual(["Bedroom", ""]);
  props.text += " On |\n| Kitchen | Off |\n\nReady.";
  flushSync();
  expect(host.querySelector("table")).toBe(table);
  expect([...host.querySelectorAll("td")].map((cell) => cell.textContent)).toEqual([
    "Bedroom",
    "On",
    "Kitchen",
    "Off",
  ]);
  expect(host.textContent).toContain("Ready.");
});

it("renders headings with inline formatting while keeping code and HTML escaped", () => {
  component = mount(Message, {
    target: host,
    props: {
      text: "## Klart: **Night light**\nText below.\n### Details ###\n#### Small\n##### Smaller\n###### Smallest\nTitle\n===\nSubtitle\n---\n```markdown\n## Not a heading\n```\n## <img src=x onerror=alert(1)>\n#hashtag\n####### Too many",
    },
  });
  flushSync();
  expect(host.querySelector("h2 strong")?.textContent).toBe("Night light");
  expect(host.querySelector("h3")?.textContent?.trim()).toBe("Details");
  expect(host.querySelector("h1")?.textContent?.trim()).toBe("Title");
  expect(host.querySelectorAll("h4,h5,h6")).toHaveLength(3);
  expect(host.querySelector("pre code")?.textContent).toContain("## Not a heading");
  expect(host.querySelector("img,script")).toBeNull();
  expect(host.textContent).toContain("#hashtag");
  expect(host.textContent).toContain("####### Too many");
});

it("keeps a heading mounted as its text streams", () => {
  const props = $state({ text: "## Kla" });
  component = mount(Message, { target: host, props });
  flushSync();
  const heading = host.querySelector("h2");
  props.text += "rt\n\nDone.";
  flushSync();
  expect(host.querySelector("h2")).toBe(heading);
  expect(heading?.textContent?.trim()).toBe("Klart");
  expect(host.textContent).toContain("Done.");
});
