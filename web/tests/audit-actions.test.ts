import { beforeEach, describe, expect, it } from "vitest";
import { auditActionLabel, auditActorSourceLabel, type AuditActionRecord } from "$lib/audit";
import { setLanguage } from "$lib/i18n/locale.svelte";

const event = (action: string, entityType: string, operation = ""): AuditActionRecord => ({
  action,
  entityType,
  operation,
});

describe("audit action descriptions", () => {
  beforeEach(() => setLanguage("en"));

  it("names the object of native changes without needing an entity name", () => {
    expect(auditActionLabel(event("created", "alarms"))).toBe("Created alarm");
    expect(auditActionLabel(event("deleted", "devices"))).toBe("Deleted device");
    expect(auditActionLabel(event("updated", "automation_nodes"))).toBe("Updated automation node");
    expect(auditActionLabel(event("created", "group_members"))).toBe("Added group member");
    expect(auditActionLabel(event("deleted", "room_members"))).toBe("Removed room member");
  });

  it("describes the operation instead of copying its success or failure into Action", () => {
    expect(auditActionLabel(event("succeeded", "operation", "syncDevice"))).toBe("Synced device");
    expect(auditActionLabel(event("failed", "operation", "syncDevice"))).toBe("Synced device");
    expect(auditActionLabel(event("succeeded", "operation", "login"))).toBe("Requested sign-in");
    expect(auditActionLabel(event("succeeded", "operation", "scanZigbee2MqttNetwork"))).toBe(
      "Requested network scan",
    );
  });

  it("uses the edited aggregate and plural objects for batch operations", () => {
    expect(auditActionLabel(event("created", "group_members", "updateGroup"))).toBe(
      "Updated group",
    );
    expect(auditActionLabel(event("deleted", "devices", "batchDeleteDevices"))).toBe(
      "Deleted devices",
    );
    expect(auditActionLabel(event("created", "room_members", "batchAddRoomMembers"))).toBe(
      "Added room members",
    );
    expect(auditActionLabel(event("updated", "users", "updateCurrentUser"))).toBe(
      "Updated profile",
    );
  });

  it("handles irregular verbs and command delivery", () => {
    expect(auditActionLabel(event("succeeded", "operation", "runDeviceCommand"))).toBe(
      "Ran device command",
    );
    expect(auditActionLabel(event("succeeded", "operation", "applyScene"))).toBe("Applied scene");
    expect(auditActionLabel(event("succeeded", "operation", "forceLogoutAllSessions"))).toBe(
      "Ended sessions",
    );
    expect(auditActionLabel(event("command.dispatched", "delivery"))).toBe("Sent device command");
    expect(auditActionLabel(event("confirmed", "device_state"))).toBe("Changed device state");
  });

  it.each([
    ["sv", "Uppdaterade enheten", "Raderade enheten"],
    ["ru", "Обновили устройство", "Удалили устройство"],
  ] as const)("keeps verb and noun grammatical in %s", (language, updated, deleted) => {
    setLanguage(language);
    expect(auditActionLabel(event("updated", "devices", "updateDevice"))).toBe(updated);
    expect(auditActionLabel(event("deleted", "devices"))).toBe(deleted);
  });

  it("uses a complete description for an unidentified operation", () => {
    expect(auditActionLabel(event("succeeded", "operation", "unknownMutation"))).toBe(
      "Completed operation",
    );
    expect(auditActionLabel(event("failed", "operation", "constructor"))).toBe(
      "Attempted operation",
    );
    expect(auditActionLabel(event("constructor", "__proto__", "toString"))).toBe(
      "Attempted operation",
    );
  });

  it("suppresses duplicate actor subtitles while retaining useful source context", () => {
    expect(auditActorSourceLabel({ actorName: "System", source: "system" })).toBe("");
    expect(auditActorSourceLabel({ actorName: "Emil", source: "human" })).toBe("");
    expect(auditActorSourceLabel({ actorName: "zigbee2mqtt", source: "integration" })).toBe(
      "Integration",
    );
    expect(auditActorSourceLabel({ actorName: "Emil", source: "assistant" })).toBe("Assistant");
  });
});
