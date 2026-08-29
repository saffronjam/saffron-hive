import type { Component } from "svelte";

export interface DrawerItem<U extends string = string> {
  type: U;
  id: string;
  name: string;
  icon?: Component;
  /**
   * Optional icon ref ("mdi:lamp", "lucide:plug", emoji string, etc.) that
   * `AnimatedIcon` resolves at render time. When set and resolvable, it
   * overrides the `icon` Component fallback. Used to surface user-set custom
   * icons (e.g. on devices) inside picker entries.
   */
  iconRef?: string | null;
  badge?: string;
  badgeType?: string;
  searchValue?: string;
  /**
   * Renders the row muted and inert: it cannot be selected and it does not
   * participate in drag-out.
   */
  disabled?: boolean;
}

export interface DrawerGroup<U extends string = string> {
  heading: string;
  items: DrawerItem<U>[];
}
