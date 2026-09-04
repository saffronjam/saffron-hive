import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { formatNumber } from "$lib/i18n/format";
import { deviceDisplayName } from "$lib/utils";
import type { MaintenanceTask } from "$lib/stores/maintenance.svelte";

export interface MaintenancePresentation {
  title: string;
  detail: string;
  action: string;
}

export function maintenancePresentation(task: MaintenanceTask): MaintenancePresentation {
  const options = locale.messageOptions();
  const name = task.device ? deviceDisplayName(task.device) : "Saffron Hive";
  switch (task.kind) {
    case "BATTERY":
      return {
        title: m.maintenance_replace_battery({}, options),
        detail: m.maintenance_battery_detail(
          { name, value: formatNumber(task.value ?? 0, { maximumFractionDigits: 0 }) },
          options,
        ),
        action: m.maintenance_battery_action({}, options),
      };
    case "FIRMWARE":
      return {
        title: m.maintenance_upgrade_firmware({}, options),
        detail: m.maintenance_firmware_detail({ name, version: task.targetValue ?? "" }, options),
        action: m.maintenance_firmware_action({}, options),
      };
    case "POSTURE":
      return {
        title: m.maintenance_correct_posture({}, options),
        detail: m.maintenance_posture_detail({ name }, options),
        action: m.maintenance_posture_action({}, options),
      };
    case "STORAGE":
    default:
      return {
        title: m.maintenance_free_storage({}, options),
        detail: m.maintenance_storage_detail(
          {
            path: task.context ?? "",
            value: formatNumber(task.value ?? 0, { maximumFractionDigits: 1 }),
          },
          options,
        ),
        action: m.maintenance_free_storage({}, options),
      };
  }
}
