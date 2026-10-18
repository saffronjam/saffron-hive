import type {
  AutomationConfigInput,
  AutomationLiteralInput,
  AutomationActionPayloadInput,
} from "$lib/gql/graphql";

export type LiteralType = "string" | "number" | "boolean" | "null";

export function readValueType(
  value: AutomationLiteralInput | null | undefined,
): LiteralType | undefined {
  if (!value) return undefined;
  if (value.stringValue != null) return "string";
  if (value.numberValue != null) return "number";
  if (value.booleanValue != null) return "boolean";
  if (value.nullValue) return "null";
  return undefined;
}

export function fromLiteral(value: AutomationLiteralInput | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.nullValue) return "null";
  return String(value.stringValue ?? value.numberValue ?? value.booleanValue ?? "");
}

export function toLiteral(
  value: string | undefined,
  type?: LiteralType,
): AutomationLiteralInput | undefined {
  if (type === "null") return { nullValue: true };
  if (value === undefined || (value === "" && type !== "string")) return undefined;
  if (type === "string") return { stringValue: value };
  if (type === "boolean" || (!type && (value === "true" || value === "false")))
    return { booleanValue: value === "true" };
  if (type === "number" || (!type && value.trim() !== "" && Number.isFinite(Number(value))))
    return { numberValue: Number(value) };
  return { stringValue: value };
}

const payloadKeys = {
  scene_id: "sceneId",
  effect_id: "effectId",
  native_name: "nativeName",
  alarm_id: "alarmId",
} as const;

export function actionPayloadToAPI(payload: string): AutomationActionPayloadInput | undefined {
  if (!payload) return undefined;
  const value = JSON.parse(payload) as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [payloadKeys[k as keyof typeof payloadKeys] ?? k, v]),
  ) as AutomationActionPayloadInput;
}

export function actionPayloadFromAPI(
  payload: AutomationActionPayloadInput | null | undefined,
): Record<string, unknown> {
  const names = Object.fromEntries(Object.entries(payloadKeys).map(([k, v]) => [v, k]));
  return Object.fromEntries(
    Object.entries(payload ?? {})
      .filter(([k, v]) => k !== "__typename" && v != null)
      .map(([k, v]) => [names[k] ?? k, v]),
  );
}

/** Strip GraphQL metadata before supplying a complete typed configuration as input. */
export function authoringInput(config: unknown): AutomationConfigInput {
  return JSON.parse(
    JSON.stringify(config, (key, value: unknown) => (key === "__typename" ? undefined : value)),
  ) as AutomationConfigInput;
}
