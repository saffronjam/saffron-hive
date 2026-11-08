<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils";

  let { href, children, class: className }: {
    href: string;
    children: Snippet;
    class?: string;
  } = $props();
</script>

<a
  {href}
  class={cn("inline-block min-w-0 max-w-full truncate align-middle border-b border-transparent font-medium outline-none hover:border-current focus-visible:border-current focus-visible:ring-2 focus-visible:ring-ring", className)}
  data-card-click-ignore
  onpointerdown={(event) => event.stopPropagation()}
  onkeydown={(event) => {
    if (event.key === "Enter" || event.key === " ") event.stopPropagation();
  }}
>{@render children()}</a>
