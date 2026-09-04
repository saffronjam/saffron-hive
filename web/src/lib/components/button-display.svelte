<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { MousePointerClick } from "@lucide/svelte";
	import DeviceActionMenu from "$lib/components/device-action-menu.svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { formatTooltip } from "$lib/time-format";
	import { me } from "$lib/stores/me.svelte";

	interface Props {
		lastAction?: string | null;
		lastActionAt?: string | null;
		lastSeen: string;
		deviceId: string;
		name: string;
		actions: string[];
		disabled?: boolean;
	}

	let { lastAction = null, lastActionAt = null, lastSeen, deviceId, name, actions, disabled = false }: Props = $props();

	function formatTime(s: string | null): string {
		if (!s) return m.state_unknown({}, locale.messageOptions());
		const date = new Date(s);
		if (isNaN(date.getTime())) return m.state_unknown({}, locale.messageOptions());
		return formatTooltip(date, me.user?.timeFormat ?? "24h");
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center justify-between gap-3">
			<CardTitle>{m.button_status({}, locale.messageOptions())}</CardTitle>
			<DeviceActionMenu {deviceId} {name} {actions} {disabled} />
		</div>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<MousePointerClick class="size-6 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				{#if lastAction}
					<p class="text-sm text-muted-foreground">
						{m.button_last_action({}, locale.messageOptions())}
					</p>
					<div class="mt-1 flex items-center gap-2">
						<Badge variant="default">{lastAction}</Badge>
					</div>
					{#if lastActionAt}
						<p class="mt-1 text-xs text-muted-foreground">
							{m.button_action_at(
								{ time: formatTime(lastActionAt) },
								locale.messageOptions(),
							)}
						</p>
					{/if}
				{:else}
					<p class="text-sm text-muted-foreground">
						{m.button_no_action({}, locale.messageOptions())}
					</p>
				{/if}
				<p class="mt-2 text-xs text-muted-foreground">
					{m.button_last_seen(
						{ time: formatTime(lastSeen) },
						locale.messageOptions(),
					)}
				</p>
			</div>
		</div>
	</CardContent>
</Card>
