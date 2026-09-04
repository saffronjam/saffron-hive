<script lang="ts">
	import { ContactRole, ControlledLoadRole, type DeviceRoles } from "$lib/gql/graphql";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		value: DeviceRoles;
		onchange: (next: DeviceRoles) => void;
		disabled?: boolean;
		contactMapped?: boolean;
	}

	let { value, onchange, disabled = false, contactMapped = false }: Props = $props();

	function setControlledLoad(role: string | undefined) {
		if (!role) return;
		onchange({ ...value, controlledLoad: role as ControlledLoadRole });
	}

	function setContact(role: string | undefined) {
		if (!role) return;
		onchange({ ...value, contact: role as ContactRole });
	}
</script>

<div class="space-y-2">
	{#if value.controlledLoad != null}
		<div class="flex items-center gap-3">
			<span class="w-16 text-sm text-muted-foreground">
				{m.device_roles_controls({}, locale.messageOptions())}
			</span>
			<Select
				type="single"
				value={value.controlledLoad}
				onValueChange={setControlledLoad}
				{disabled}
			>
				<SelectTrigger class="w-40">
					{value.controlledLoad === ControlledLoadRole.Light
						? m.device_type_light({}, locale.messageOptions())
						: m.device_roles_appliance({}, locale.messageOptions())}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ControlledLoadRole.Appliance}>
						{m.device_roles_appliance({}, locale.messageOptions())}
					</SelectItem>
					<SelectItem value={ControlledLoadRole.Light}>
						{m.device_type_light({}, locale.messageOptions())}
					</SelectItem>
				</SelectContent>
			</Select>
		</div>
	{/if}

	{#if value.contact != null}
		<div class="flex items-center gap-3">
			<span class="w-16 text-sm text-muted-foreground">
				{m.device_roles_contact({}, locale.messageOptions())}
			</span>
			<Select
				type="single"
				value={value.contact}
				onValueChange={setContact}
				disabled={disabled || contactMapped}
			>
				<SelectTrigger class="w-40">
					{value.contact === ContactRole.Door
						? m.sensor_door({}, locale.messageOptions())
						: value.contact === ContactRole.Window
							? m.sensor_window({}, locale.messageOptions())
							: m.device_roles_general_contact({}, locale.messageOptions())}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ContactRole.General}>
						{m.device_roles_general_contact({}, locale.messageOptions())}
					</SelectItem>
					<SelectItem value={ContactRole.Door}>
						{m.sensor_door({}, locale.messageOptions())}
					</SelectItem>
					<SelectItem value={ContactRole.Window}>
						{m.sensor_window({}, locale.messageOptions())}
					</SelectItem>
				</SelectContent>
			</Select>
			{#if contactMapped}
				<span class="text-sm text-muted-foreground">
					{m.device_roles_used_in_map({}, locale.messageOptions())}
				</span>
			{/if}
		</div>
	{/if}
</div>
