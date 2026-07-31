import type { Component } from "svelte";
import { PlugZap } from "@lucide/svelte";
import TuyaIcon from "$lib/components/icons/tuya-icon.svelte";
import Zigbee2MqttIcon from "$lib/components/icons/zigbee2mqtt-icon.svelte";

/** Presentation and behaviour that varies per integration provider. */
export interface IntegrationMeta {
  icon: Component<{ class?: string }>;
  description: string;
  /**
   * Whether deleting the integration leaves its devices in place. Zigbee device
   * ids are IEEE addresses, so reconfiguring recovers every device onto its
   * original row; cloud providers re-derive ids on each sync and are purged.
   */
  keepsDevices: boolean;
}

const META: Record<string, IntegrationMeta> = {
  zigbee2mqtt: {
    icon: Zigbee2MqttIcon,
    description: "Zigbee devices via an MQTT bridge",
    keepsDevices: true,
  },
  tuya: {
    icon: TuyaIcon,
    description: "Cloud API device adapter",
    keepsDevices: false,
  },
};

const FALLBACK: IntegrationMeta = {
  icon: PlugZap,
  description: "Device adapter",
  keepsDevices: false,
};

/** Icon, description and delete semantics for a provider id. */
export function integrationMeta(provider: string): IntegrationMeta {
  return META[provider] ?? FALLBACK;
}
