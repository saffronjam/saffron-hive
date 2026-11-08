<script lang="ts">
  import type { ChargeState } from "$lib/device-charging";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";
  let { state, radius }: { state: ChargeState; radius?: number } = $props();
  const colorClass = $derived(
    state === "charged" ? "text-green-600 dark:text-green-500" : "text-blue-500",
  );
  const label = $derived(
    state === "charged"
      ? m.device_fully_charged({}, locale.messageOptions())
      : m.device_charging({}, locale.messageOptions()),
  );
</script>

{#if state}
  {#if radius != null}
    <circle
      r={radius}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
      class="pointer-events-none {colorClass}"
      class:breathing={state === "charging"}
      role="img"
      aria-label={label}
      data-charge-state={state}
    />
  {:else}
    <span
      class="pointer-events-none absolute inset-0 rounded-[inherit] border-2 border-current {colorClass}"
      class:breathing={state === "charging"}
      role="img"
      aria-label={label}
      data-charge-state={state}
    ></span>
  {/if}
{/if}

<style>
  .breathing {
    animation: charging-breathe 2.6s ease-in-out infinite;
  }
  @keyframes charging-breathe {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .breathing {
      animation: none;
    }
  }
</style>
