import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Component } from "svelte";
import { AirVent, Lightbulb, Thermometer, MousePointerClick, Plug, Package } from "@lucide/svelte";

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

export function deviceIcon(type: string): Component {
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
