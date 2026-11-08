<script lang="ts">
  import { mdiDeleteRestore } from "@mdi/js";
  let { class: className = "size-4" }: { class?: string } = $props();
</script>

<svg viewBox="0 0 24 24" class={className} fill="currentColor" aria-hidden="true">
  <path d={mdiDeleteRestore} />
</svg>
