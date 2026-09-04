import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { formatNumber } from "$lib/i18n/format";

export interface AlarmPresentation {
  message?: string | null;
  messageCode?: string | null;
  messageArguments: string;
}

interface AlarmArguments {
  deviceName?: string;
  value?: number;
  threshold?: number;
}

function argumentsFor(alarm: AlarmPresentation): AlarmArguments {
  try {
    const value: unknown = JSON.parse(alarm.messageArguments);
    return value !== null && typeof value === "object" ? (value as AlarmArguments) : {};
  } catch {
    return {};
  }
}

export function alarmMessage(alarm: AlarmPresentation): string {
  if (alarm.message != null) return alarm.message;
  const options = locale.messageOptions();
  const args = argumentsFor(alarm);
  switch (alarm.messageCode) {
    case "disk_low":
      return m.alarm_disk_low(
        {
          value: formatNumber(args.value ?? 0, { maximumFractionDigits: 1 }),
          threshold: formatNumber(args.threshold ?? 0, { maximumFractionDigits: 0 }),
        },
        options,
      );
    case "memory_high":
      return m.alarm_memory_high(
        { value: formatNumber(args.value ?? 0), threshold: formatNumber(args.threshold ?? 0) },
        options,
      );
    case "broker_disconnected":
      return m.alarm_broker_disconnected({}, options);
    case "device_unavailable":
      return m.alarm_device_unavailable({ name: args.deviceName ?? "" }, options);
    case "battery_low":
      return m.alarm_battery_low(
        {
          name: args.deviceName ?? "",
          value: formatNumber(args.value ?? 0, { maximumFractionDigits: 0 }),
        },
        options,
      );
    default:
      return m.alarm_unknown_system({}, options);
  }
}
