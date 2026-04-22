<script lang="ts">
  import { initials } from "$lib/utils/initials";

  interface Props {
    user: { name: string; username?: string; avatarPath?: string | null };
    size?: "xs" | "sm" | "md" | "lg";
    class?: string;
  }

  let { user, size = "md", class: klass = "" }: Props = $props();

  const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
    xs: "size-4 text-[9px]",
    sm: "size-6 text-xs",
    md: "size-10 text-sm",
    lg: "size-24 text-2xl",
  };

  function hashHue(seed: string): number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 360;
  }

  const seed = $derived(user.username || user.name || "?");
  const hue = $derived(hashHue(seed));
  const bg = $derived(`hsl(${hue} 55% 40%)`);
  const label = $derived(initials(user.name));

  // Two image slots, A and B, alternate as "active". The active slot is
  // opaque, the other is transparent. On change, load the new src into the
  // inactive slot; once it decodes, flip `active`, which triggers CSS opacity
  // transitions on both layers in parallel — a real crossfade.
  let srcA = $state<string | null>(null);
  let srcB = $state<string | null>(null);
  let active = $state<"A" | "B" | null>(null);

  const desired = $derived(user.avatarPath ? `/avatars/${user.avatarPath}` : null);

  $effect(() => {
    const currentSrc = active === "A" ? srcA : active === "B" ? srcB : null;
    if (desired === currentSrc) return;
    if (!desired) {
      // Fade out whatever is active by clearing the active flag; both images
      // become transparent. Don't null out srcA/srcB so the fade can play.
      active = null;
      return;
    }
    // Load the new src into the slot that isn't active so the fade-in happens
    // without disturbing the currently visible image.
    if (active === "A") srcB = desired;
    else srcA = desired;
  });

  function onLoadA() {
    if (srcA && srcA !== (active === "A" ? srcA : null)) active = "A";
  }
  function onLoadB() {
    if (srcB && srcB !== (active === "B" ? srcB : null)) active = "B";
  }

  const aOpacity = $derived(active === "A" ? 1 : 0);
  const bOpacity = $derived(active === "B" ? 1 : 0);
  const initialsOpacity = $derived(active ? 0 : 1);
</script>

<div class="relative {sizeClasses[size]} {klass}">
  <span
    class="absolute inset-0 inline-flex items-center justify-center rounded-full font-semibold text-white transition-opacity duration-300 {sizeClasses[
      size
    ]}"
    style="background-color: {bg}; opacity: {initialsOpacity}"
    aria-label={user.name}
  >
    {label}
  </span>
  {#if srcA}
    <img
      src={srcA}
      alt={user.name}
      class="absolute inset-0 rounded-full object-cover transition-opacity duration-300 {sizeClasses[
        size
      ]}"
      style="opacity: {aOpacity}"
      onload={onLoadA}
    />
  {/if}
  {#if srcB}
    <img
      src={srcB}
      alt={user.name}
      class="absolute inset-0 rounded-full object-cover transition-opacity duration-300 {sizeClasses[
        size
      ]}"
      style="opacity: {bOpacity}"
      onload={onLoadB}
    />
  {/if}
</div>
