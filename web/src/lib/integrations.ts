import type { Component } from "svelte";
import { PlugZap } from "@lucide/svelte";
import TuyaIcon from "$lib/components/icons/tuya-icon.svelte";
import Zigbee2MqttIcon from "$lib/components/icons/zigbee2mqtt-icon.svelte";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

/** Presentation and behaviour that varies per integration provider. */
export interface IntegrationMeta {
  icon: Component<{ class?: string }>;
  readonly description: string;
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
    get description() {
      return integrationDescription("zigbee2mqtt");
    },
    keepsDevices: true,
  },
  tuya: {
    icon: TuyaIcon,
    get description() {
      return integrationDescription("tuya");
    },
    keepsDevices: false,
  },
};

const FALLBACK: IntegrationMeta = {
  icon: PlugZap,
  get description() {
    return integrationDescription("");
  },
  keepsDevices: false,
};

/** Icon, description and delete semantics for a provider id. */
export function integrationMeta(provider: string): IntegrationMeta {
  return META[provider] ?? FALLBACK;
}

/** Localized one-line description for an integration provider id. */
export function integrationDescription(provider: string): string {
  const options = locale.messageOptions();
  switch (provider) {
    case "zigbee2mqtt":
      return m.integrations_description_zigbee2mqtt({}, options);
    case "tuya":
      return m.integrations_description_tuya({}, options);
    default:
      return m.integrations_description_generic({}, options);
  }
}
