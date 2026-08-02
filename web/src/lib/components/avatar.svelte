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

  function pathToSrc(path: string | null | undefined): string | null {
    return path ? `/avatars/${path}` : null;
  }

  const seed = $derived(user.username || user.name || "?");
  const hue = $derived(hashHue(seed));
  const bg = $derived(`hsl(${hue} 55% 40%)`);
  const label = $derived(initials(user.name));

  // Two image slots, A and B, alternate as "active". The active slot is
  // opaque, the other is transparent. On change, load the new src into the
  // inactive slot; once it decodes, flip `active`, which triggers CSS opacity
  // transitions on both layers in parallel — a real crossfade.
  //
  // Slot A and `active` are both seeded from the prop rather than filled by the
  // effect below, so a user who already has an avatar renders an opaque <img> in
  // the very first frame. Leaving either to the effect paints something else
  // first (the initials, or an empty circle) and then fades, which is the avatar
  // flashing on every page load. Nothing is lost by seeding: an <img> that has
  // not decoded yet simply has no pixels, so a cached avatar appears at once and
  // a cold one appears when it arrives.
  // svelte-ignore state_referenced_locally
  let srcA = $state<string | null>(pathToSrc(user.avatarPath));
  let srcB = $state<string | null>(null);
  // svelte-ignore state_referenced_locally
  let active = $state<"A" | "B" | null>(user.avatarPath ? "A" : null);
  let failed = $state(false);

  const desired = $derived(pathToSrc(user.avatarPath));

  $effect(() => {
    const currentSrc = active === "A" ? srcA : active === "B" ? srcB : null;
    if (desired === currentSrc) return;
    if (!desired) {
      // Fade out whatever is active by clearing the active flag; both images
      // become transparent. Don't null out srcA/srcB so the fade can play.
      active = null;
      return;
    }
    failed = false;
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

  // `failed` hides the image rather than unmounting it: clearing the src would
  // let the effect below notice an empty slot and immediately re-request the
  // same broken URL, forever.
  const aOpacity = $derived(active === "A" && !failed ? 1 : 0);
  const bOpacity = $derived(active === "B" && !failed ? 1 : 0);

  // Initials show only when there is genuinely no photo to show, rather than
  // whenever one has yet to load. While a photo is loading the circle stays
  // empty, which is a beat of nothing instead of a beat of the wrong thing.
  const initialsOpacity = $derived(!desired || failed ? 1 : 0);
</script>

<div class="relative {sizeClasses[size]} {klass}">
  <span
    class="absolute inset-0 inline-flex items-center justify-center rounded-full font-semibold leading-none text-white transition-opacity duration-300 {sizeClasses[
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
      onerror={() => (failed = true)}
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
      onerror={() => (failed = true)}
    />
  {/if}
</div>
