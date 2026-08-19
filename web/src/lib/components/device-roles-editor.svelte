<script lang="ts">
	import { ContactRole, ControlledLoadRole, type DeviceRoles } from "$lib/gql/graphql";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";

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
			<span class="w-16 text-sm text-muted-foreground">Controls</span>
			<Select
				type="single"
				value={value.controlledLoad}
				onValueChange={setControlledLoad}
				{disabled}
			>
				<SelectTrigger class="w-40">
					{value.controlledLoad === ControlledLoadRole.Light ? "Light" : "Appliance"}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ControlledLoadRole.Appliance}>Appliance</SelectItem>
					<SelectItem value={ControlledLoadRole.Light}>Light</SelectItem>
				</SelectContent>
			</Select>
		</div>
	{/if}

	{#if value.contact != null}
		<div class="flex items-center gap-3">
			<span class="w-16 text-sm text-muted-foreground">Contact</span>
			<Select
				type="single"
				value={value.contact}
				onValueChange={setContact}
				disabled={disabled || contactMapped}
			>
				<SelectTrigger class="w-40">
					{value.contact === ContactRole.Door
						? "Door"
						: value.contact === ContactRole.Window
							? "Window"
							: "General contact"}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ContactRole.General}>General contact</SelectItem>
					<SelectItem value={ContactRole.Door}>Door</SelectItem>
					<SelectItem value={ContactRole.Window}>Window</SelectItem>
				</SelectContent>
			</Select>
			{#if contactMapped}
				<span class="text-sm text-muted-foreground">Used in map</span>
			{/if}
		</div>
	{/if}
</div>
