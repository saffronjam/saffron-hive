import type { CleaningRobot } from "$lib/stores/cleaning.svelte";
import type { CleaningOptionsInput, Device } from "$lib/gql/graphql";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export function cleaningDefaultOptions(
  robot?: Pick<CleaningRobot, "suction" | "water">,
): CleaningOptionsInput {
  const suction = robot?.suction;
  const water = robot?.water;
  return {
    suction:
      suction != null && Number.isInteger(suction) && suction >= 0 && suction <= 3 ? suction : 1,
    water: water != null && Number.isInteger(water) && water >= 1 && water <= 3 ? water : 2,
    repeats: 1,
  };
}

export function cleaningStatus(status: string): string {
  const options = locale.messageOptions();
  switch (status) {
    case "idle":
      return m.cleaning_status_idle({}, options);
    case "cleaning":
    case "running":
      return m.cleaning_status_cleaning({}, options);
    case "paused":
      return m.cleaning_status_paused({}, options);
    case "returning":
      return m.cleaning_status_returning({}, options);
    case "docked":
      return m.cleaning_status_docked({}, options);
    case "attention":
      return m.cleaning_status_attention({}, options);
    case "offline":
      return m.cleaning_status_offline({}, options);
    case "starting":
      return m.cleaning_status_starting({}, options);
    case "stopping":
      return m.cleaning_status_stopping({}, options);
    case "completed":
      return m.cleaning_status_completed({}, options);
    case "cancelled":
      return m.cleaning_status_cancelled({}, options);
    case "failed":
      return m.cleaning_status_failed({}, options);
    case "ended":
      return m.cleaning_status_ended({}, options);
    default:
      return m.cleaning_status_unknown({}, options);
  }
}

export function cleaningActivity(
  robot: Pick<CleaningRobot, "status" | "activeTask" | "progress" | "estimatedProgress">,
) {
  const taskState = robot.activeTask?.state;
  const status =
    taskState && ["starting", "stopping", "returning", "unknown"].includes(taskState)
      ? taskState
      : robot.status;
  const estimating = status === "cleaning" || status === "paused";
  const estimated = estimating && robot.progress == null && robot.estimatedProgress != null;
  return {
    status,
    progress: robot.progress ?? (estimating ? robot.estimatedProgress : null),
    estimated,
  };
}
type MappedRobot = Pick<CleaningRobot, "activeMapId" | "maps" | "roomLinks">;

export function cleaningMapId(robot: MappedRobot): string {
  return robot.activeMapId ?? (robot.maps.length === 1 ? String(robot.maps[0].id) : "");
}
export function cleaningLinks(robot: MappedRobot) {
  const id = cleaningMapId(robot);
  if (!robot.maps.some((map) => String(map.id) === id)) return [];
  return robot.roomLinks.find((set) => set.mapId === id)?.links ?? [];
}

export function cleaningCandidates<T extends MappedRobot & { id: string; supported: boolean }>(
  robots: T[],
  devices: Readonly<Record<string, Pick<Device, "available" | "disabled" | "deleted">>>,
): T[] {
  return robots.filter((robot) => {
    const device = devices[robot.id];
    return (
      robot.supported &&
      !!robot.activeMapId &&
      device?.available &&
      !device.disabled &&
      !device.deleted &&
      cleaningLinks(robot).length > 0
    );
  });
}
export function expandCleaningRooms(
  links: { roomId: string; areaId: string }[],
  selected: string[],
): string[] {
  const result = new Set(selected),
    areas = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const link of links) if (result.has(link.roomId)) areas.add(link.areaId);
    for (const link of links)
      if (areas.has(link.areaId) && !result.has(link.roomId)) {
        result.add(link.roomId);
        changed = true;
      }
  }
  return [...result].sort();
}
