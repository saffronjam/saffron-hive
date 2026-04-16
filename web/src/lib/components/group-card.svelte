<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import InlineEditName from "$lib/components/inline-edit-name.svelte";
	import {
		Lightbulb,
		Thermometer,
		ToggleLeft,
		Group,
		Package,
		Pencil,
		Trash2,
	} from "@lucide/svelte";
	import type { Device } from "$lib/stores/devices";

	interface GroupMember {
		id: string;
		memberType: string;
		memberId: string;
		device: Device | null;
		group: GroupData | null;
	}

	interface GroupData {
		id: string;
		name: string;
		members: GroupMember[];
	}

	interface Props {
		group: GroupData;
		onedit: (group: GroupData) => void;
		ondelete: (group: GroupData) => void;
		onrename: (group: GroupData, newName: string) => void;
	}

	let { group, onedit, ondelete, onrename }: Props = $props();

	let expanded = $state(false);

	const deviceCount = $derived(group.members.filter((m) => m.memberType === "device").length);
	const groupCount = $derived(group.members.filter((m) => m.memberType === "group").length);

	function memberBreakdown(dc: number, gc: number): string {
		const parts: string[] = [];
		if (dc > 0) parts.push(`${dc} device${dc === 1 ? "" : "s"}`);
		if (gc > 0) parts.push(`${gc} group${gc === 1 ? "" : "s"}`);
		return parts.join(", ");
	}

	function deviceIcon(type: string): typeof Lightbulb {
		switch (type) {
			case "light":
				return Lightbulb;
			case "sensor":
				return Thermometer;
			case "switch":
				return ToggleLeft;
			default:
				return Package;
		}
	}
</script>

<div class="rounded-lg shadow-card bg-card p-4">
	<div class="flex items-center justify-between">
		<button
			type="button"
			class="flex flex-1 items-center gap-3 text-left"
			onclick={() => (expanded = !expanded)}
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
				<Group class="size-5 text-muted-foreground" />
			</div>
			<div class="min-w-0 flex-1">
				<InlineEditName name={group.name} onsave={(newName) => onrename(group, newName)} />
				<p class="text-xs text-muted-foreground">
					{group.members.length} member{group.members.length === 1 ? "" : "s"}
					{#if group.members.length > 0}
						&middot; {memberBreakdown(deviceCount, groupCount)}
					{/if}
				</p>
			</div>
		</button>

		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onedit(group)}
				aria-label="Edit group"
			>
				<Pencil class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				class="text-destructive hover:text-destructive"
				onclick={() => ondelete(group)}
				aria-label="Delete group"
			>
				<Trash2 class="size-4" />
			</Button>
		</div>
	</div>

	{#if expanded && group.members.length > 0}
		<div class="mt-3 space-y-1.5 border-t border-border pt-3">
			{#each group.members as member (member.id)}
				{#if member.memberType === "device" && member.device}
					{@const Icon = deviceIcon(member.device.type)}
					<div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
						<Icon class="size-4 text-muted-foreground" />
						<span class="flex-1 truncate text-foreground">{member.device.name}</span>
						<Badge variant="secondary" class="text-xs">{member.device.type}</Badge>
					</div>
				{:else if member.memberType === "group" && member.group}
					<div class="rounded-md px-2 py-1.5 text-sm">
						<div class="flex items-center gap-2">
							<Group class="size-4 text-muted-foreground" />
							<span class="flex-1 truncate text-foreground">{member.group.name}</span>
							<Badge variant="outline" class="text-xs">group</Badge>
						</div>
						{#if member.group.members.length > 0}
							<div class="ml-6 mt-1 space-y-1 border-l border-border pl-2">
								{#each member.group.members as nested (nested.id)}
									{#if nested.memberType === "device" && nested.device}
										{@const NestedIcon = deviceIcon(nested.device.type)}
										<div class="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
											<NestedIcon class="size-3" />
											<span class="truncate">{nested.device.name}</span>
										</div>
									{:else if nested.memberType === "group" && nested.group}
										<div class="flex items-center gap-2 py-0.5 text-xs text-muted-foreground">
											<Group class="size-3" />
											<span class="truncate">{nested.group.name}</span>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	{:else if expanded}
		<div class="mt-3 border-t border-border pt-3">
			<p class="text-center text-xs text-muted-foreground">No members yet</p>
		</div>
	{/if}
</div>
