<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Plug } from "@lucide/svelte";
	import type { DeviceState } from "$lib/stores/devices";

	interface Props {
		state: DeviceState;
		sending: boolean;
		oncommand: (state: { on: boolean }) => void;
	}

	let { state, sending, oncommand }: Props = $props();

	function toggle(next: boolean) {
		oncommand({ on: next });
	}
</script>

<Card>
	<CardHeader>
		<CardTitle>Plug Status</CardTitle>
	</CardHeader>
	<CardContent>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
				<Plug class="size-6 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center justify-between gap-4">
					<span class="text-sm text-muted-foreground">Power</span>
					<Switch
						checked={state.on === true}
						onCheckedChange={toggle}
						disabled={sending}
						aria-label="Toggle plug"
					/>
				</div>
				{#if state.power != null || state.voltage != null || state.current != null || state.energy != null}
					<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
						{#if state.power != null}
							<dt>Power</dt>
							<dd class="text-right text-foreground">{state.power.toFixed(1)} W</dd>
						{/if}
						{#if state.voltage != null}
							<dt>Voltage</dt>
							<dd class="text-right text-foreground">{state.voltage.toFixed(1)} V</dd>
						{/if}
						{#if state.current != null}
							<dt>Current</dt>
							<dd class="text-right text-foreground">{state.current.toFixed(2)} A</dd>
						{/if}
						{#if state.energy != null}
							<dt>Energy</dt>
							<dd class="text-right text-foreground">{state.energy.toFixed(2)} kWh</dd>
						{/if}
					</dl>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
