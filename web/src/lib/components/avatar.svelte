<script lang="ts">
  import { initials } from "$lib/utils/initials";

  interface Props {
    user: { name: string; username?: string; avatarPath?: string | null };
    size?: "sm" | "md" | "lg";
    class?: string;
  }

  let { user, size = "md", class: klass = "" }: Props = $props();

  const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
    sm: "size-6 text-xs",
    md: "size-10 text-sm",
    lg: "size-24 text-2xl",
  };

  // Stable hue derived from the username (falls back to the display name) so
  // the same user always gets the same background across views.
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
  const src = $derived(user.avatarPath ? `/avatars/${user.avatarPath}` : null);
</script>

{#if src}
  <img
    {src}
    alt={user.name}
    class="rounded-full object-cover {sizeClasses[size]} {klass}"
  />
{:else}
  <span
    class="inline-flex items-center justify-center rounded-full font-semibold text-white {sizeClasses[
      size
    ]} {klass}"
    style="background-color: {bg}"
    aria-label={user.name}
  >
    {label}
  </span>
{/if}
