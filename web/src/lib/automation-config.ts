import type { AutomationConfigInput } from "$lib/gql/graphql";

export interface AutomationNodeLike {
  type: string;
  config: AutomationConfigInput;
}

export function triggerKind(node: AutomationNodeLike): "event" | "schedule" | null {
  return node.type === "trigger"
    ? node.config.trigger?.mode === "schedule"
      ? "schedule"
      : "event"
    : null;
}
export function actionKind(node: AutomationNodeLike): string | null {
  return node.type === "action" ? (node.config.action?.actionType ?? null) : null;
}
export function referencedDeviceIds(node: AutomationNodeLike): string[] {
  const a = node.config.action;
  return node.type === "action" && a?.targetType === "device" && a.targetId ? [a.targetId] : [];
}
export function referencedSceneIds(node: AutomationNodeLike): string[] {
  const a = node.config.action;
  if (a?.actionType === "activate_scene" && a.payload?.sceneId) return [a.payload.sceneId];
  return a?.actionType === "cycle_scenes" ? (a.payload?.scenes ?? []) : [];
}
export function referencedWebhookEndpointIds(node: AutomationNodeLike): string[] {
  const t = node.config.trigger;
  return t?.mode === "webhook" && t.endpointId ? [t.endpointId] : [];
}
export function automationsByWebhookEndpoint<A extends { id: string; nodes: AutomationNodeLike[] }>(
  automations: A[],
): Map<string, A[]> {
  const result = new Map<string, A[]>();
  for (const automation of automations)
    for (const id of new Set(automation.nodes.flatMap(referencedWebhookEndpointIds)))
      result.set(id, [...(result.get(id) ?? []), automation]);
  return result;
}
export function referencedEffectIds(node: AutomationNodeLike): string[] {
  const a = node.config.action;
  return a?.actionType === "run_effect" && a.payload?.effectId ? [a.payload.effectId] : [];
}
export function referencedNativeEffectNames(node: AutomationNodeLike): string[] {
  const a = node.config.action;
  return a?.actionType === "run_effect" && a.payload?.nativeName ? [a.payload.nativeName] : [];
}
