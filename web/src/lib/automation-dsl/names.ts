import type { SummaryLookups } from "$lib/components/graph/automation-summary";
import {
  deviceDisplayName,
  deviceSourceName,
  entityDisplayName,
  groupDisplayName,
  groupSourceName,
} from "$lib/utils";

export type EntityKind = "device" | "group" | "room" | "scene" | "webhook" | "effect";

/** One nameable entity with every name it may be referred to by. */
export interface NamedEntity {
  kind: EntityKind;
  id: string;
  /** The name shown in Hive, printed by the language. */
  display: string;
  /** Other names that resolve to it, such as the locale-independent name. */
  aliases: string[];
  /**
   * The display name with the entity's rooms, "Cozy (Bedroom)", set when
   * another entity of the same kind has the same display name.
   */
  qualified?: string;
  /** Native effects are referenced by program name, not id. */
  native?: boolean;
}

export type Resolution = { ok: true; id: string } | { ok: false; reason: "unknown" | "ambiguous" };

/**
 * Resolves names to ids and back. A reference resolves by display name, then
 * the room-qualified name, then alias, then id. Printing uses the first of
 * the display name and the room-qualified name that resolves back to the
 * same entity, otherwise the id.
 */
export class Names {
  private readonly byKind = new Map<EntityKind, NamedEntity[]>();

  constructor(readonly lookups: SummaryLookups) {
    this.add(
      lookups.devices.map((device) => ({
        kind: "device" as const,
        id: device.id,
        display: deviceDisplayName(device),
        aliases: [deviceSourceName(device)],
      })),
    );
    this.add(
      lookups.groups.map((group) => ({
        kind: "group" as const,
        id: group.id,
        display: groupDisplayName(group),
        aliases: [groupSourceName(group)],
      })),
    );
    this.add(
      lookups.rooms.map((room) => ({
        kind: "room" as const,
        id: room.id,
        display: entityDisplayName("room", room),
        aliases: [room.name],
      })),
    );
    this.add(
      lookups.scenes.map((scene) => ({
        kind: "scene" as const,
        id: scene.id,
        display: entityDisplayName("scene", scene),
        aliases: [scene.name],
      })),
    );
    this.add(
      lookups.webhooks.map((webhook) => ({
        kind: "webhook" as const,
        id: webhook.id,
        display: entityDisplayName("webhook", webhook),
        aliases: [webhook.name],
      })),
    );
    this.add(
      lookups.effects.map((effect) =>
        effect.kind === "timeline"
          ? {
              kind: "effect" as const,
              id: effect.id,
              display: entityDisplayName("effect", effect),
              aliases: [effect.name],
            }
          : {
              kind: "effect" as const,
              id: effect.nativeName,
              display: effect.name,
              aliases: [effect.nativeName],
              native: true,
            },
      ),
    );
    this.qualifyClashes();
  }

  /** Room names of an entity, for telling apart entities that share a name. */
  private roomsOf(kind: EntityKind, id: string): string[] {
    if (kind === "scene") {
      const scene = this.lookups.scenes.find((candidate) => candidate.id === id);
      return (scene?.rooms ?? []).map((room) => entityDisplayName("room", room));
    }
    if (kind !== "device" && kind !== "group") return [];
    return this.lookups.rooms
      .filter(
        (room) =>
          room.members?.some((member) => member.memberType === kind && member.memberId === id) ||
          (kind === "device" && room.resolvedDevices?.some((device) => device.id === id)),
      )
      .map((room) => entityDisplayName("room", room));
  }

  private qualifyClashes(): void {
    for (const [kind, entities] of this.byKind) {
      const counts = new Map<string, number>();
      for (const entity of entities)
        counts.set(entity.display, (counts.get(entity.display) ?? 0) + 1);
      for (const entity of entities) {
        if ((counts.get(entity.display) ?? 0) < 2) continue;
        const rooms = this.roomsOf(kind, entity.id);
        if (rooms.length > 0) entity.qualified = `${entity.display} (${rooms.join(", ")})`;
      }
    }
  }

  private add(entities: NamedEntity[]): void {
    for (const entity of entities) {
      const list = this.byKind.get(entity.kind) ?? [];
      list.push(entity);
      this.byKind.set(entity.kind, list);
    }
  }

  all(kind: EntityKind): readonly NamedEntity[] {
    return this.byKind.get(kind) ?? [];
  }

  find(kind: EntityKind, id: string): NamedEntity | undefined {
    return this.all(kind).find((entity) => entity.id === id);
  }

  resolve(kind: EntityKind, ref: string): Resolution {
    const entities = this.all(kind);
    let ambiguous = false;
    for (const matches of [
      entities.filter((entity) => entity.display === ref),
      entities.filter((entity) => entity.qualified === ref),
      entities.filter((entity) => entity.aliases.includes(ref)),
      entities.filter((entity) => entity.id === ref),
    ]) {
      const ids = new Set(matches.map((entity) => entity.id));
      if (ids.size === 1) return { ok: true, id: matches[0].id };
      if (ids.size > 1) ambiguous = true;
    }
    return { ok: false, reason: ambiguous ? "ambiguous" : "unknown" };
  }

  /** The name to print for an id: the first readable name that resolves back to it. */
  name(kind: EntityKind, id: string): string {
    const entity = this.find(kind, id);
    if (!entity) return id;
    for (const candidate of [entity.display, entity.qualified]) {
      if (candidate === undefined) continue;
      const back = this.resolve(kind, candidate);
      if (back.ok && back.id === id) return candidate;
    }
    return id;
  }
}
