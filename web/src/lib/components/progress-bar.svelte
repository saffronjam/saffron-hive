<script lang="ts">
  import { cn } from "$lib/utils";
  let { value, max = 100, label, warnLow = false, class: className }: { value: number; max?: number; label: string; warnLow?: boolean; class?: string } = $props();
  const tone = $derived(warnLow && value < max * 0.1 ? "text-destructive" : warnLow && value < max * 0.3 ? "text-yellow-500" : "text-primary");
</script>

<progress class={cn("block h-1.5 w-full overflow-hidden rounded-full border-0 bg-muted transition-colors duration-200 motion-reduce:transition-none", tone, className)} {value} {max} aria-label={label}></progress>

<style>
  progress { appearance: none; }
  progress::-webkit-progress-bar { background: var(--muted); border-radius: 9999px; }
  progress::-webkit-progress-value { background: currentColor; border-radius: 9999px; }
  progress::-moz-progress-bar { background: currentColor; border-radius: 9999px; }
</style>
