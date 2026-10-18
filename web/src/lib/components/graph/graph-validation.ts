import type { Node, Edge } from "@xyflow/svelte";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

/** Connection errors for runnable graphs, keyed by the node to repair. */
export function graphConnectionErrors(nodes: Node[], edges: Edge[]): Map<string, string> {
  const reachable = new Set(nodes.filter((n) => n.type === "trigger").map((n) => n.id));
  const outgoing = new Map<string, string[]>();
  for (const edge of edges)
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  const queue = [...reachable];
  for (let i = 0; i < queue.length; i++) {
    for (const next of outgoing.get(queue[i]) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }
  const errors = new Map<string, string>();
  for (const node of nodes) {
    if (node.type !== "trigger" && !reachable.has(node.id)) {
      errors.set(node.id, m.automation_graph_input_required({}, locale.messageOptions()));
    }
    if (node.type === "operator") {
      const config = node.data.config as { operator: string };
      if (!["AND", "OR"].includes(config.operator)) {
        errors.set(node.id, m.automation_graph_invalid_operator({}, locale.messageOptions()));
      }
    }
  }
  return errors;
}
