<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import { MousePointerClick } from "@lucide/svelte";
	import { sentenceCase } from "$lib/utils";
	import { haptics } from "$lib/stores/haptics.svelte";

	interface Props {
		deviceId: string;
		name: string;
		actions: string[];
		disabled?: boolean;
	}

	let { deviceId, name, actions, disabled = false }: Props = $props();
	const client = getContextClient();
	let armed = $state(false);
	let open = $state(false);

	const SIMULATE_DEVICE_ACTION = graphql(`
		mutation DeviceActionMenuSimulate($deviceId: ID!, $action: String!) {
			simulateDeviceAction(deviceId: $deviceId, action: $action)
		}
	`);

	function trigger(action: string, event: MouseEvent) {
		haptics.play("execute", event);
		void client.mutation(SIMULATE_DEVICE_ACTION, { deviceId, action }).toPromise();
	}

	function openMenu() {
		armed = true;
		open = true;
	}
</script>

{#if actions.length > 0 && !disabled}
	{#if !armed}
		<Button variant="ghost" size="icon-sm" onclick={openMenu} aria-label={`Trigger ${name} event`}>
			<MousePointerClick class="size-4" />
		</Button>
	{:else}
		<DropdownMenu bind:open>
			<DropdownMenuTrigger class="inline-flex h-8 items-center">
				<Button variant="ghost" size="icon-sm" aria-label={`Trigger ${name} event`}>
					<MousePointerClick class="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" class="max-h-80 overflow-y-auto">
				{#each actions as action (action)}
					<DropdownMenuItem onclick={(event) => trigger(action, event)}>{sentenceCase(action)}</DropdownMenuItem>
				{/each}
			</DropdownMenuContent>
		</DropdownMenu>
	{/if}
{/if}
