export interface AssistantEntityReference {
  kind: "device" | "room" | "group" | "scene" | "automation" | "effect";
  id: string;
  href: string;
}

/** Resolves Hive entity destinations used in assistant messages. */
export function assistantEntityReference(href: string): AssistantEntityReference | null {
  const detail = href.match(/^\/(devices|scenes|automations|effects)\/([^/?#]+)$/);
  const collection = href.match(/^\/(rooms|groups)\?edit=([^&#]+)$/);
  if (!detail && !collection) return null;
  const match = (detail ?? collection)!;
  try {
    const id = decodeURIComponent(collection ? match[2].replace(/\+/g, " ") : match[2]);
    if (
      !id ||
      /[/\\]/.test(id) ||
      Array.from(id).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
    )
      return null;
    const kinds = {
      devices: "device",
      rooms: "room",
      groups: "group",
      scenes: "scene",
      automations: "automation",
      effects: "effect",
    } as const;
    return { kind: kinds[match[1] as keyof typeof kinds], id, href };
  } catch {
    return null;
  }
}
