import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Component } from "svelte";
import {
  AirVent,
  DoorOpen,
  Lightbulb,
  Magnet,
  Thermometer,
  MousePointerClick,
  PanelTopOpen,
  Plug,
  Package,
  Router,
} from "@lucide/svelte";
import { ContactRole } from "$lib/gql/graphql";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The name to show for a device: the user's override, then the name its
 * integration reports, then the id. Mirrors `device.Device.DisplayName` on the
 * server, and never returns an empty string because the id is always present.
 *
 * `name` is nullable in the schema, so read this rather than `d.name` anywhere
 * a device name is rendered, sorted or searched.
 */
export function deviceDisplayName(d: {
  id: string;
  name?: string | null;
  friendlyName?: string | null;
}): string {
  return d.name || d.friendlyName || d.id;
}

/** Resolve a group's user override, integration name, and id in order. */
export function groupDisplayName(group: {
  id: string;
  name?: string | null;
  friendlyName?: string | null;
}): string {
  return group.name || group.friendlyName || group.id;
}

export function contactIcon(role?: ContactRole | null): Component {
  switch (role) {
    case ContactRole.Door:
      return DoorOpen;
    case ContactRole.Window:
      return PanelTopOpen;
    default:
      return Magnet;
  }
}

export function deviceIcon(type: string, contactRole?: ContactRole | null): Component {
  if (contactRole != null) return contactIcon(contactRole);
  switch (type) {
    case "light":
      return Lightbulb;
    case "sensor":
      return Thermometer;
    case "button":
      return MousePointerClick;
    case "plug":
      return Plug;
    case "climate":
      return AirVent;
    case "hub":
      return Router;
    default:
      return Package;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function sentenceCase(s: string): string {
  const spaced = s.replace(/[_-]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
