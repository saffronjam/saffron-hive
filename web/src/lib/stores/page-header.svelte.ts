import type { Component } from "svelte";

interface HeaderAction {
  label: string;
  icon?: Component;
  onclick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  disabled?: boolean;
}

interface Breadcrumb {
  label: string;
  href?: string;
  onclick?: () => void;
}

class PageHeader {
  breadcrumbs = $state<Breadcrumb[]>([]);
  actions = $state<HeaderAction[]>([]);

  get title(): string {
    const last = this.breadcrumbs.at(-1);
    return last ? `Hive - ${last.label}` : "Hive";
  }

  reset() {
    this.breadcrumbs = [];
    this.actions = [];
  }
}

export const pageHeader = new PageHeader();
