import type { Component } from "svelte";

export interface DrawerItem<U extends string = string> {
  type: U;
  id: string;
  name: string;
  icon?: Component;
  badge?: string;
  searchValue?: string;
}

export interface DrawerGroup<U extends string = string> {
  heading: string;
  items: DrawerItem<U>[];
}
