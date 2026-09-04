import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
import { sentenceCase } from "$lib/utils";

/** Presents stable Hive and device-state identifiers without changing their wire values. */
export function identifierLabel(value: string): string {
  const options = locale.messageOptions();
  switch (value.trim().toLowerCase()) {
    case "on":
      return m.state_on({}, options);
    case "off":
      return m.state_off({}, options);
    case "open":
      return m.state_open({}, options);
    case "closed":
      return m.state_closed({}, options);
    case "unknown":
      return m.state_unknown({}, options);
    case "available":
      return m.state_available({}, options);
    case "unavailable":
      return m.state_unavailable({}, options);
    case "occupied":
      return m.state_occupied({}, options);
    case "clear":
      return m.state_clear({}, options);
    case "successful":
      return m.common_successful({}, options);
    case "auto":
      return m.value_auto({}, options);
    case "low":
      return m.value_low({}, options);
    case "mid":
    case "medium":
      return m.value_mid({}, options);
    case "high":
      return m.value_high({}, options);
    case "heat":
      return m.value_heat({}, options);
    case "cool":
      return m.value_cool({}, options);
    case "dry":
      return m.value_dry({}, options);
    case "fan":
      return m.value_fan({}, options);
    case "fan_only":
      return m.value_fan_only({}, options);
    case "both":
      return m.value_both({}, options);
    case "left":
      return m.value_left({}, options);
    case "right":
      return m.value_right({}, options);
    case "up":
      return m.value_up({}, options);
    case "down":
      return m.value_down({}, options);
    case "front":
      return m.value_front({}, options);
    case "back":
      return m.value_back({}, options);
    case "normal":
      return m.value_normal({}, options);
    case "abnormal":
      return m.value_abnormal({}, options);
    case "tilt":
      return m.value_tilt({}, options);
    default:
      return /[_-]/.test(value) ? sentenceCase(value) : value;
  }
}

/** Presents stable state-history and capability fields in the active language. */
export function historyFieldLabel(field: string): string {
  const options = locale.messageOptions();
  switch (field) {
    case "temperature":
      return m.field_temperature({}, options);
    case "humidity":
      return m.field_humidity({}, options);
    case "pressure":
      return m.field_pressure({}, options);
    case "illuminance":
      return m.field_illuminance({}, options);
    case "battery":
      return m.field_battery({}, options);
    case "on":
      return m.field_on({}, options);
    case "brightness":
      return m.field_brightness({}, options);
    case "color":
      return m.field_color({}, options);
    case "occupancy":
      return m.field_occupancy({}, options);
    case "action":
      return m.field_action({}, options);
    case "effect":
      return m.field_effect({}, options);
    case "colorTemp":
    case "color_temp":
      return m.field_color_temperature({}, options);
    case "targetTemperature":
    case "target_temperature":
      return m.field_target_temperature({}, options);
    case "hvacMode":
    case "hvac_mode":
      return m.field_hvac_mode({}, options);
    case "fanMode":
    case "fan_mode":
      return m.field_fan_mode({}, options);
    case "swing":
      return m.field_swing({}, options);
    case "transition":
      return m.field_transition({}, options);
    case "powerOnBehavior":
    case "power_on_behavior":
      return m.field_power_on_behavior({}, options);
    case "power":
      return m.field_power({}, options);
    case "voltage":
      return m.field_voltage({}, options);
    case "current":
      return m.field_current({}, options);
    case "energy":
      return m.field_energy({}, options);
    case "contact":
      return m.field_contact({}, options);
    case "orientation":
      return m.field_orientation({}, options);
    case "devicePosture":
    case "device_posture":
      return m.field_device_posture({}, options);
    case "linkQuality":
    case "link_quality":
      return m.field_link_quality({}, options);
    default:
      return sentenceCase(field);
  }
}

/** Presents Hive-owned chip types while leaving integration-defined values unchanged. */
export function chipLabel(type: string): string {
  const options = locale.messageOptions();
  switch (type) {
    case "light":
      return m.device_type_light({}, options);
    case "sensor":
      return m.device_type_sensor({}, options);
    case "plug":
      return m.device_type_plug({}, options);
    case "speaker":
      return m.device_type_speaker({}, options);
    case "button":
      return m.device_type_button({}, options);
    case "climate":
      return m.device_type_climate({}, options);
    case "switch":
      return m.device_type_switch({}, options);
    case "hub":
      return m.device_type_hub({}, options);
    case "device":
      return m.device_generic({}, options);
    case "room":
      return m.room_generic({}, options);
    case "group":
      return m.group_generic({}, options);
    case "temperature":
    case "humidity":
    case "pressure":
    case "illuminance":
    case "battery":
    case "on":
    case "brightness":
    case "colorTemp":
    case "power":
    case "voltage":
    case "current":
    case "energy":
    case "contact":
    case "orientation":
    case "devicePosture":
    case "linkQuality":
      return historyFieldLabel(type);
    case "new":
      return m.field_new({}, options);
    case "offline":
      return m.devices_offline({}, options);
    case "firmware":
      return m.maintenance_type_firmware({}, options);
    case "posture":
      return m.maintenance_type_posture({}, options);
    case "storage":
      return m.maintenance_type_storage({}, options);
    case "color":
      return m.maintenance_type_color({}, options);
    default:
      return type;
  }
}
