import type { Path } from "./model";

export interface Span {
  from: number;
  to: number;
}

const WHITESPACE = /\s/;

function skipSpace(text: string, i: number): number {
  while (i < text.length && WHITESPACE.test(text[i])) i++;
  return i;
}

/** The end of the string starting at the quote at `i`, past its closing quote. */
function stringEnd(text: string, i: number): number {
  let j = i + 1;
  while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
  return Math.min(j + 1, text.length);
}

/** The end of the JSON value starting at `i`. Assumes valid JSON. */
function valueEnd(text: string, i: number): number {
  const c = text[i];
  if (c === '"') return stringEnd(text, i);
  if (c === "{" || c === "[") {
    let depth = 0;
    let j = i;
    while (j < text.length) {
      const d = text[j];
      if (d === '"') {
        j = stringEnd(text, j);
        continue;
      }
      if (d === "{" || d === "[") depth++;
      if (d === "}" || d === "]") {
        depth--;
        if (depth === 0) return j + 1;
      }
      j++;
    }
    return text.length;
  }
  let j = i;
  while (j < text.length && !/[\s,}\]]/.test(text[j])) j++;
  return j;
}

/**
 * The text range to mark for a path in a valid JSON document: a scalar value,
 * or the key of a member whose value is an object or list. Falls back to the
 * deepest part of the path that exists.
 */
export function locatePath(text: string, path: Path): Span {
  let i = skipSpace(text, 0);
  let span: Span = { from: i, to: i + 1 };
  for (const segment of path) {
    const c = text[i];
    let found = false;
    if (c === "{" && typeof segment === "string") {
      let j = skipSpace(text, i + 1);
      while (j < text.length && text[j] === '"') {
        const keyEnd = stringEnd(text, j);
        const key = JSON.parse(text.slice(j, keyEnd)) as string;
        const valueStart = skipSpace(text, skipSpace(text, keyEnd) + 1);
        if (key === segment) {
          const end = valueEnd(text, valueStart);
          const container = text[valueStart] === "{" || text[valueStart] === "[";
          span = container ? { from: j, to: keyEnd } : { from: valueStart, to: end };
          i = valueStart;
          found = true;
          break;
        }
        j = skipSpace(text, valueEnd(text, valueStart));
        if (text[j] === ",") j = skipSpace(text, j + 1);
      }
    } else if (c === "[" && typeof segment === "number") {
      let j = skipSpace(text, i + 1);
      for (let index = 0; j < text.length && text[j] !== "]"; index++) {
        if (index === segment) {
          const end = valueEnd(text, j);
          const container = text[j] === "{" || text[j] === "[";
          span = container ? { from: j, to: j + 1 } : { from: j, to: end };
          i = j;
          found = true;
          break;
        }
        j = skipSpace(text, valueEnd(text, j));
        if (text[j] === ",") j = skipSpace(text, j + 1);
      }
    }
    if (!found) break;
  }
  return span;
}

/** Where the cursor is in a document that may be incomplete. */
export interface CursorContext {
  /** Path of the object being written (key position) or of the value (value position). */
  path: Path;
  position: "key" | "value";
  /** What has been typed of the current key or value, without quotes. */
  prefix: string;
  /** Start of the token being typed, including its opening quote. */
  from: number;
  /** Keys already present in the object holding the cursor. */
  present: Set<string>;
  /**
   * Completed scalar members of the enclosing objects, the nearest winning, so
   * a state key can see the target written beside it.
   */
  siblings: Record<string, unknown>;
}

interface Frame {
  kind: "object" | "array";
  /** How the parent reached this frame. */
  segment: string | number | null;
  key: string | null;
  expect: "key" | "colon" | "value" | "comma";
  index: number;
  present: Set<string>;
  siblings: Record<string, unknown>;
}

/** Scans `text` up to `pos` and reports the completion context there. */
export function cursorContext(text: string, pos: number): CursorContext | null {
  const stack: Frame[] = [];
  let i = 0;
  const top = () => stack[stack.length - 1];
  const segmentForValue = (): string | number | null => {
    const frame = top();
    if (!frame) return null;
    return frame.kind === "object" ? frame.key : frame.index;
  };
  const finishValue = (value: unknown, scalar: boolean) => {
    const frame = top();
    if (!frame) return;
    if (frame.kind === "object" && frame.key !== null && scalar) frame.siblings[frame.key] = value;
    frame.expect = "comma";
  };

  while (i < pos) {
    const c = text[i];
    if (WHITESPACE.test(c)) {
      i++;
      continue;
    }
    if (c === '"') {
      const end = stringEnd(text, i);
      const closed = end <= pos && text[end - 1] === '"' && end - 1 > i;
      if (!closed) {
        const frame = top();
        const prefix = text.slice(i + 1, pos);
        return context(stack, frame, prefix, i);
      }
      const value = JSON.parse(text.slice(i, end)) as string;
      const frame = top();
      if (frame?.kind === "object" && frame.expect === "key") {
        frame.key = value;
        frame.present.add(value);
        frame.expect = "colon";
      } else {
        finishValue(value, true);
      }
      i = end;
      continue;
    }
    if (c === "{" || c === "[") {
      const segment = segmentForValue();
      const parent = top();
      if (parent) parent.expect = "comma";
      stack.push({
        kind: c === "{" ? "object" : "array",
        segment,
        key: null,
        expect: c === "{" ? "key" : "value",
        index: 0,
        present: new Set(),
        siblings: {},
      });
      i++;
      continue;
    }
    if (c === "}" || c === "]") {
      stack.pop();
      i++;
      continue;
    }
    if (c === ":") {
      const frame = top();
      if (frame) frame.expect = "value";
      i++;
      continue;
    }
    if (c === ",") {
      const frame = top();
      if (frame?.kind === "object") {
        frame.expect = "key";
        frame.key = null;
      } else if (frame) {
        frame.expect = "value";
        frame.index++;
      }
      i++;
      continue;
    }
    let j = i;
    while (j < pos && !/[\s,:{}[\]"]/.test(text[j])) j++;
    if (j === pos) return context(stack, top(), text.slice(i, pos), i);
    const word = text.slice(i, j);
    finishValue(word === "true" ? true : word === "false" ? false : Number(word), true);
    i = j;
  }
  return context(stack, top(), "", pos);
}

function context(
  stack: Frame[],
  frame: Frame | undefined,
  prefix: string,
  from: number,
): CursorContext | null {
  if (!frame) return null;
  const base: Path = stack.slice(1).map((f) => f.segment as string | number);
  const siblings = Object.assign({}, ...stack.map((f) => f.siblings)) as Record<string, unknown>;
  if (frame.kind === "object") {
    if (frame.expect === "key") {
      return { path: base, position: "key", prefix, from, present: frame.present, siblings };
    }
    if (frame.expect === "value" && frame.key !== null) {
      return {
        path: [...base, frame.key],
        position: "value",
        prefix,
        from,
        present: frame.present,
        siblings,
      };
    }
    return null;
  }
  if (frame.expect !== "value") return null;
  return {
    path: [...base, frame.index],
    position: "value",
    prefix,
    from,
    present: new Set(),
    siblings,
  };
}
