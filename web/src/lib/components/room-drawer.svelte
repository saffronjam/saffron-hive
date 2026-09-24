<script lang="ts">
	import type { ComponentProps } from "svelte";
	import { Sheet, SheetContent, SheetTitle, SheetDescription } from "$lib/components/ui/sheet/index.js";
	import DashboardTargetPanel, { type DashboardRoom } from "$lib/components/dashboard-target-panel.svelte";
	import { entityDisplayName } from "$lib/utils";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	type Props = Omit<ComponentProps<typeof DashboardTargetPanel>, "target" | "presentation"> & {
		room: DashboardRoom | null;
		open: boolean;
		onclose: () => void;
	};
	let { room, open, onclose, ...panelProps }: Props = $props();
</script>

<Sheet {open} onOpenChange={(next) => { if (!next) onclose(); }}>
	<SheetContent
		side="bottom"
		showCloseButton={false}
		class="max-h-[85vh] gap-2 overflow-y-auto rounded-t-2xl bg-[color-mix(in_oklch,var(--background)_50%,var(--card))] p-4 pb-24 sm:max-w-none lg:left-1/2! lg:right-auto! lg:w-[calc(100%-3rem)] lg:max-w-3xl lg:-translate-x-1/2"
	>
		<SheetTitle class="sr-only">{room ? entityDisplayName("room", room) : m.room_generic({}, locale.messageOptions())}</SheetTitle>
		<SheetDescription class="sr-only">{m.room_drawer_description({}, locale.messageOptions())}</SheetDescription>
		{#if open && room}
			{#key room.id}
				<DashboardTargetPanel {...panelProps} target={{ kind: "room", room }} presentation="compact" />
			{/key}
		{/if}
	</SheetContent>
</Sheet>
