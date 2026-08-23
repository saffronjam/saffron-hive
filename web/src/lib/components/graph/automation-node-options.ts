export interface AutomationNodeOption<T extends string = string> {
  value: T;
  label: string;
  description: string;
}

export const TRIGGER_OPTIONS = [
  {
    value: "device_state",
    label: "Device state changed",
    description: "Runs when a reported device value changes",
  },
  {
    value: "device_event",
    label: "Device event",
    description: "Runs for presses, holds, taps, and other momentary events",
  },
  {
    value: "availability",
    label: "Availability",
    description: "Runs when a device goes online or offline",
  },
  {
    value: "webhook",
    label: "Incoming webhook",
    description: "Runs when an external system calls a webhook",
  },
  {
    value: "schedule",
    label: "Schedule",
    description: "Runs at a time or repeating interval",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Runs when a custom event expression matches",
  },
] as const satisfies readonly AutomationNodeOption[];

export const CONDITION_OPTIONS = [
  {
    value: "time_window",
    label: "Time window",
    description: "Passes during a configured time range",
  },
  { value: "weekday", label: "Weekday", description: "Passes on selected days" },
  {
    value: "device_state",
    label: "Device state",
    description: "Checks the current state of a device, group, or room",
  },
  { value: "custom", label: "Custom", description: "Checks a custom boolean expression" },
] as const satisfies readonly AutomationNodeOption[];

export const ACTION_OPTIONS = [
  {
    value: "set_device_state",
    label: "Set state",
    description: "Sets one or more device state values",
  },
  {
    value: "configure_device",
    label: "Configure device",
    description: "Changes persistent device settings",
  },
  {
    value: "toggle_device_state",
    label: "Toggle state",
    description: "Toggles power for a device, group, or room",
  },
  {
    value: "change_value",
    label: "Change value",
    description: "Adjusts a numeric value by an amount",
  },
  { value: "activate_scene", label: "Activate scene", description: "Activates a scene" },
  {
    value: "cycle_scenes",
    label: "Scene cycle",
    description: "Advances through an ordered scene list",
  },
  {
    value: "run_effect",
    label: "Run effect",
    description: "Starts an effect on matching devices",
  },
  {
    value: "raise_alarm",
    label: "Raise alarm",
    description: "Creates or updates an alarm",
  },
  {
    value: "clear_alarm",
    label: "Clear alarm",
    description: "Clears a matching alarm",
  },
] as const satisfies readonly AutomationNodeOption[];
