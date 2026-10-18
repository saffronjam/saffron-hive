import type { Client } from "@urql/svelte";

export async function revision(client: Client, field: "me" | "device" | "group" | "room" | "scene" | "automation" | "effect", id?: string): Promise<number> {
  const result = await client.query<Record<string, { revision: number } | null>>(
    id === undefined ? `query { ${field} { revision } }` : `query($id:ID!) { ${field}(id:$id) { revision } }`,
    id === undefined ? {} : { id },
    { requestPolicy: "network-only" },
  ).toPromise();
  if (result.error || !result.data?.[field]) throw result.error ?? new Error(`${field} unavailable`);
  return result.data[field]!.revision;
}

export async function settingRevision(client: Client, key: string): Promise<number> {
  const result = await client.query<{ settings: { key: string; revision: number }[] }>(
    `query { settings { key revision } }`, {}, { requestPolicy: "network-only" },
  ).toPromise();
  if (result.error || !result.data) throw result.error ?? new Error("settings unavailable");
  return result.data.settings.find(setting => setting.key === key)?.revision ?? 0;
}
