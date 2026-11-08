<script lang="ts">
  import type { Snippet } from "svelte";
  import { Button } from "$lib/components/ui/button";
  import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "$lib/components/ui/dropdown-menu";
  import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
  import { EllipsisVertical, Pencil, Trash2 } from "@lucide/svelte";
  import { m } from "$lib/i18n/messages";
  import { locale } from "$lib/i18n/locale.svelte";

  let {
    editHref,
    ondelete,
    editLabel,
    deleteLabel,
    deleteDisabledReason,
    leading,
  }: {
    editHref?: string;
    ondelete?: () => void;
    editLabel?: string;
    deleteLabel?: string;
    deleteDisabledReason?: string;
    leading?: Snippet;
  } = $props();
</script>

<div class="flex items-center justify-end gap-1">
  {@render leading?.()}
  {#if editHref || ondelete}
    <DropdownMenu>
      <DropdownMenuTrigger>
        {#snippet child({ props })}
          <Button {...props} variant="ghost" size="icon-sm" aria-label={m.shared_actions({}, locale.messageOptions())}><EllipsisVertical class="size-4" /></Button>
        {/snippet}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {#if editHref}
          <DropdownMenuItem>
            {#snippet child({ props })}<a {...props} href={editHref}><Pencil class="size-4" />{editLabel ?? m.common_edit({}, locale.messageOptions())}</a>{/snippet}
          </DropdownMenuItem>
        {/if}
        {#if ondelete}
          {#if deleteDisabledReason}
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}<div {...props}>
                  <DropdownMenuItem variant="destructive" disabled><Trash2 class="size-4" />{deleteLabel ?? m.common_delete({}, locale.messageOptions())}</DropdownMenuItem>
                </div>{/snippet}
              </TooltipTrigger>
              <TooltipContent>{deleteDisabledReason}</TooltipContent>
            </Tooltip>
          {:else}
            <DropdownMenuItem variant="destructive" onclick={ondelete}>
              <Trash2 class="size-4" />{deleteLabel ?? m.common_delete({}, locale.messageOptions())}
            </DropdownMenuItem>
          {/if}
        {/if}
      </DropdownMenuContent>
    </DropdownMenu>
  {/if}
</div>
