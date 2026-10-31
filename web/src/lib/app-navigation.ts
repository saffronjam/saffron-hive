import {
  MessageCircle,
  Menu,
  LayoutDashboard,
  Lightbulb,
  Clapperboard,
  Workflow,
  Group,
  DoorOpen,
  ScrollText,
  Settings,
  Activity,
  BellRing,
  Users,
  LineChart,
  Sparkles,
  PlugZap,
  Map as MapIcon,
  CircleCheck,
  Webhook,
} from "@lucide/svelte";
import { assistantAvailability } from "$lib/stores/assistant-availability.svelte";
import { auth } from "$lib/stores/auth.svelte";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";
export interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function navigationGroups(): NavGroup[] {
  const options = locale.messageOptions();
  return [
    {
      items: [
        { href: "/", label: m.nav_dashboard({}, options), icon: LayoutDashboard },
        ...(assistantAvailability.enabled && !auth.isGuest()
          ? [{ href: "/assistant", label: m.assistant_title({}, options), icon: MessageCircle }]
          : []),
        { href: "/map", label: m.nav_map({}, options), icon: MapIcon },
      ],
    },
    {
      label: m.nav_things({}, options),
      items: [
        { href: "/devices", label: m.nav_devices({}, options), icon: Lightbulb },
        { href: "/rooms", label: m.nav_rooms({}, options), icon: DoorOpen },
        { href: "/groups", label: m.nav_groups({}, options), icon: Group },
      ],
    },
    {
      label: m.nav_action({}, options),
      items: [
        { href: "/scenes", label: m.nav_scenes({}, options), icon: Clapperboard },
        { href: "/automations", label: m.nav_automations({}, options), icon: Workflow },
        { href: "/webhooks", label: m.nav_webhooks({}, options), icon: Webhook },
        { href: "/effects", label: m.nav_effects({}, options), icon: Sparkles },
      ],
    },
    {
      label: m.nav_monitoring({}, options),
      items: [
        { href: "/activity", label: m.nav_activity({}, options), icon: Activity },
        { href: "/alarms", label: m.nav_alarms({}, options), icon: BellRing },
        {
          href: "/maintenance",
          label: m.nav_maintenance({}, options),
          icon: CircleCheck,
        },
        { href: "/data-viewer", label: m.nav_data_viewer({}, options), icon: LineChart },
      ],
    },
  ];
}

export function systemItems(): NavItem[] {
  const options = locale.messageOptions();
  return [
    { href: "/integrations", label: m.nav_integrations({}, options), icon: PlugZap },
    { href: "/users", label: m.nav_users({}, options), icon: Users },
    { href: "/logs", label: m.nav_logs({}, options), icon: ScrollText },
    { href: "/settings", label: m.nav_settings({}, options), icon: Settings },
  ];
}

/** Primary destinations shown in the mobile navigation bar. */
export function mobilePrimaryItems(): NavItem[] {
  const groups = navigationGroups();
  const chat = groups[0].items.find((item) => item.href === "/assistant");
  return [
    groups[0].items[0],
    chat ? { ...chat, label: m.nav_chat({}, locale.messageOptions()) } : groups[1].items[0],
    { href: "/menu", label: m.nav_menu({}, locale.messageOptions()), icon: Menu },
  ];
}

export function routeIsActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
