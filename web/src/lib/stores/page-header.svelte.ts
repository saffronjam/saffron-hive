import type { Component } from "svelte";
import type { ListView } from "$lib/stores/profile.svelte";

interface HeaderAction {
  label: string;
  icon?: Component;
  iconClass?: string;
  onclick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
  saving?: boolean;
  hideLabelOnMobile?: boolean;
}

interface Breadcrumb {
  label: string;
  href?: string;
  onclick?: () => void;
}

interface ViewToggle {
  value: ListView;
  onchange: (v: ListView) => void;
}

class PageHeader {
  breadcrumbs = $state<Breadcrumb[]>([]);
  actions = $state<HeaderAction[]>([]);
  viewToggle = $state<ViewToggle | null>(null);

  get title(): string {
    const last = this.breadcrumbs.at(-1);
    return last ? `Hive - ${last.label}` : "Hive";
  }

  reset() {
    this.breadcrumbs = [];
    this.actions = [];
    this.viewToggle = null;
  }
}

export const pageHeader = new PageHeader();
