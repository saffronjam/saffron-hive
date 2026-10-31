import { assistantEntityReference, type AssistantEntityReference } from "$lib/assistant-entities";

type Alignment = "left" | "center" | "right";

type MessageBlock =
  | { kind: "entity"; text: string; reference: AssistantEntityReference }
  | { kind: "text" | "code"; text: string }
  | { kind: "heading"; level: number; text: string }
  | { kind: "table"; headers: string[]; rows: string[][]; alignments: Alignment[] };

function cells(line: string): string[] {
  const result: string[] = [];
  let cell = "";
  let codeFence = "";
  const value = line.trim();
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "\\" && (value[i + 1] === "|" || value[i + 1] === "\\")) {
      cell += value[++i];
    } else if (char === "`") {
      const fence = value.slice(i).match(/^`+/)![0];
      if (!codeFence) codeFence = fence;
      else if (codeFence === fence) codeFence = "";
      cell += fence;
      i += fence.length - 1;
    } else if (char === "|" && !codeFence) {
      result.push(cell.trim());
      cell = "";
    } else cell += char;
  }
  result.push(cell.trim());
  if (value.startsWith("|")) result.shift();
  if (value.endsWith("|") && result.at(-1) === "") result.pop();
  return result;
}

/** Parses message blocks while leaving inline formatting as escaped text. */
export function messageBlocks(text: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  for (const section of text.replace(/\r\n/g, "\n").split(/(```[^\n]*\n[\s\S]*?(?:```|$))/g)) {
    if (section.startsWith("```")) {
      blocks.push({ kind: "code", text: section.replace(/^```[^\n]*\n/, "").replace(/```$/, "") });
      continue;
    }
    const lines = section.split("\n");
    let prose: string[] = [];
    function flush() {
      const text = prose.join("\n").trim();
      if (text) blocks.push({ kind: "text", text });
      prose = [];
    }
    for (let i = 0; i < lines.length; i++) {
      const link = lines[i].trim().match(/^\[([^\]\n]+)\]\((\/[^)\s]+)\)$/);
      const reference = link && assistantEntityReference(link[2]);
      if (reference) {
        flush();
        blocks.push({ kind: "entity", text: link[1], reference });
        continue;
      }
      const heading = lines[i].match(/^ {0,3}(#{1,6})(?:[ \t]+(.*)|$)/);
      if (heading) {
        flush();
        blocks.push({
          kind: "heading",
          level: heading[1].length,
          text: (heading[2] ?? "").replace(/[ \t]+#+[ \t]*$/, "").trim(),
        });
        continue;
      }
      const underline = lines[i + 1]?.match(/^ {0,3}(=+|-+)[ \t]*$/);
      if (lines[i].trim() && underline) {
        flush();
        blocks.push({
          kind: "heading",
          level: underline[1][0] === "=" ? 1 : 2,
          text: lines[i].trim(),
        });
        i++;
        continue;
      }
      const headers = cells(lines[i]);
      const delimiter = cells(lines[i + 1] ?? "");
      if (
        !lines[i].includes("|") ||
        !headers.length ||
        headers.length !== delimiter.length ||
        !delimiter.every((cell) => /^:?-+:?$/.test(cell))
      ) {
        prose.push(lines[i]);
        continue;
      }
      flush();
      const alignments: Alignment[] = delimiter.map((cell) =>
        cell.endsWith(":") ? (cell.startsWith(":") ? "center" : "right") : "left",
      );
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        const row = cells(lines[i]);
        rows.push(headers.map((_, column) => row[column] ?? ""));
        i++;
      }
      i--;
      blocks.push({ kind: "table", headers, rows, alignments });
    }
    flush();
  }
  return blocks;
}
