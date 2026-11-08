<script lang="ts">
  import { watchErrorToast } from "$lib/error-toast.svelte";
  let { onretry }: { onretry?: () => void } = $props();
  let error = $state<string | null>(null);
  let visible = $state(true);
  export function report(message: string | null) { error = message; }
  export function setVisible(value: boolean) { visible = value; }
  watchErrorToast(() => visible ? error : null, () => onretry?.());
</script>
<article><button type="button">Action</button></article>
