<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    children,
    contained = false,
  }: { children: Snippet; contained?: boolean } = $props();
</script>

<div
  class="z-30 flex items-center justify-between gap-3 md:mx-auto md:w-full md:max-w-4xl {contained
    ? 'shrink-0 px-4 py-3 md:mt-6 md:p-0'
    : 'fixed inset-x-4 bottom-[calc(var(--mobile-nav-height,0px)+0.75rem)] md:static'}"
>
  {@render children()}
</div>
