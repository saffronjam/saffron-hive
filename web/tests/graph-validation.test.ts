import { expect, it } from "vitest";
import type { Node, Edge } from "@xyflow/svelte";
import { graphConnectionErrors } from "$lib/components/graph/graph-validation";

const nodes: Node[] = [
  { id: "t", type: "trigger", position: { x: 0, y: 0 }, data: {} },
  { id: "c", type: "condition", position: { x: 0, y: 0 }, data: {} },
  { id: "o", type: "operator", position: { x: 0, y: 0 }, data: { config: { operator: "OR" } } },
  { id: "a", type: "action", position: { x: 0, y: 0 }, data: {} },
];
const edge = (source: string, target: string): Edge => ({ id: `${source}-${target}`, source, target });
it("marks a root condition invalid even when its merge receives a trigger", () => {
  const edges = [edge("t", "o"), edge("c", "o"), edge("o", "a")];
  expect([...graphConnectionErrors(nodes, edges).keys()]).toEqual(["c"]);
  expect(graphConnectionErrors(nodes, [...edges, edge("t", "c")]).size).toBe(0);
});
it("marks every execution node on a disconnected path", () => {
  expect([...graphConnectionErrors(nodes, [edge("c", "o"), edge("o", "a")]).keys()]).toEqual(["c", "o", "a"]);
});
it("keeps unsupported operators visible and invalid", () => {
  const unsupported = nodes.map((n) => n.id === "o" ? { ...n, data: { config: { operator: "NOT" } } } : n);
  expect([...graphConnectionErrors(unsupported, [edge("t", "c"), edge("c", "o"), edge("o", "a")]).keys()]).toEqual(["o"]);
});
