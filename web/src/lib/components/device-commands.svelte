<script lang="ts">
	import type { Capability } from "$lib/stores/devices";
	import { Button } from "$lib/components/ui/button/index.js";
	import { toast } from "svelte-sonner";
	import { getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { historyFieldLabel } from "$lib/i18n/vocabulary";
	import { sentenceCase } from "$lib/utils";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		deviceId: string;
		commands: Capability[];
		disabled?: boolean;
	}

	let { deviceId, commands, disabled = false }: Props = $props();

	const RUN_DEVICE_COMMAND = graphql(`
		mutation DeviceRunCommand($deviceId: ID!, $capability: String!, $value: String!) {
			runDeviceCommand(deviceId: $deviceId, capability: $capability, value: $value)
		}
	`);

	const client = getContextClient();
	let running = $state<string | null>(null);

	interface CommandButton {
		key: string;
		capability: Capability;
		value: string;
		label: string;
	}

	/**
	 * One button per command value. A single-valued command ("identify",
	 * "Restart Device") is named after the capability; a command with several
	 * values names each button after its value.
	 */
	const buttons = $derived(
		commands.flatMap((capability): CommandButton[] => {
			const name = historyFieldLabel(capability.name, capability.label);
			const values = capability.type === "binary" ? ["true"] : (capability.values ?? []);
			if (values.length === 1) {
				return [{ key: capability.name, capability, value: values[0], label: name }];
			}
			return values.map((value) => ({
				key: `${capability.name}:${value}`,
				capability,
				value,
				label: `${name}: ${sentenceCase(value)}`,
			}));
		}),
	);

	async function run(button: CommandButton) {
		running = button.key;
		const result = await client
			.mutation(RUN_DEVICE_COMMAND, {
				deviceId,
				capability: button.capability.name,
				value: button.value,
			})
			.toPromise();
		running = null;
		if (result.error) {
			console.error(result.error);
			toast.error(m.device_command_failed({ name: button.label }, locale.messageOptions()));
			return;
		}
		toast.success(m.device_command_sent({ name: button.label }, locale.messageOptions()));
	}
</script>

<div class="space-y-2">
	<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
		{m.device_actions({}, locale.messageOptions())}
	</p>
	<div class="flex flex-wrap gap-2">
		{#each buttons as button (button.key)}
			<Button
				variant="outline"
				size="sm"
				disabled={disabled || running !== null}
				title={button.capability.description ?? undefined}
				onclick={() => run(button)}
			>
				{button.label}
			</Button>
		{/each}
	</div>
</div>
