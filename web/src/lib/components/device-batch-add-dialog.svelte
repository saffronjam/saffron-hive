<script lang="ts">
	import { getContextClient, queryStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs/index.js";
	import DynamicIcon from "$lib/components/icons/dynamic-icon.svelte";
	import { DoorOpen, Group as GroupIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	interface Props {
		open: boolean;
		deviceIds: string[];
		onadded?: () => void;
	}

	let { open = $bindable(false), deviceIds, onadded }: Props = $props();

	const client = getContextClient();

	const TARGETS_QUERY = graphql(`
		query DeviceBatchAddTargets {
			rooms { id name icon }
			groups { id name icon }
		}
	`);

	const BATCH_ADD_ROOM_DEVICES = graphql(`
		mutation BatchAddRoomDevices($roomId: ID!, $deviceIds: [ID!]!) {
			batchAddRoomDevices(roomId: $roomId, deviceIds: $deviceIds) { id name }
		}
	`);

	const BATCH_ADD_GROUP_DEVICES = graphql(`
		mutation BatchAddGroupDevices($groupId: ID!, $deviceIds: [ID!]!) {
			batchAddGroupDevices(groupId: $groupId, deviceIds: $deviceIds) { id name }
		}
	`);

	const targets = queryStore({ client, query: TARGETS_QUERY, pause: true });

	let mode = $state<"room" | "group">("room");
	let selectedTargetId = $state<string | null>(null);
	let saving = $state(false);

	$effect(() => {
		if (open) {
			targets.reexecute({ requestPolicy: "network-only" });
			mode = "room";
			selectedTargetId = null;
		}
	});

	const rooms = $derived($targets.data?.rooms ?? []);
	const groups = $derived($targets.data?.groups ?? []);

	const selectedTarget = $derived.by(() => {
		if (!selectedTargetId) return null;
		return mode === "room"
			? rooms.find((r) => r.id === selectedTargetId) ?? null
			: groups.find((g) => g.id === selectedTargetId) ?? null;
	});

	async function handleAdd() {
		if (!selectedTargetId || deviceIds.length === 0) return;
		saving = true;
		try {
			const result =
				mode === "room"
					? await client
							.mutation(BATCH_ADD_ROOM_DEVICES, {
								roomId: selectedTargetId,
								deviceIds,
							})
							.toPromise()
					: await client
							.mutation(BATCH_ADD_GROUP_DEVICES, {
								groupId: selectedTargetId,
								deviceIds,
							})
							.toPromise();
			if (result.error) throw new Error(result.error.message);
			const name = selectedTarget?.name ?? "target";
			toast.success(
				`Added ${deviceIds.length} device${deviceIds.length === 1 ? "" : "s"} to ${mode} ${name}`,
			);
			open = false;
			onadded?.();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to add devices");
		} finally {
			saving = false;
		}
	}

	function onOpenChange(v: boolean) {
		if (!v) {
			open = false;
			selectedTargetId = null;
		}
	}
</script>

<Dialog {open} {onOpenChange}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>
				Add {deviceIds.length} device{deviceIds.length === 1 ? "" : "s"} to…
			</DialogTitle>
			<DialogDescription>
				Pick a room or group to add the selected devices to. Devices already associated are skipped.
			</DialogDescription>
		</DialogHeader>

		<Tabs
			value={mode}
			onValueChange={(v) => {
				mode = (v as "room" | "group");
				selectedTargetId = null;
			}}
		>
			<TabsList>
				<TabsTrigger value="room">Room</TabsTrigger>
				<TabsTrigger value="group">Group</TabsTrigger>
			</TabsList>
			<TabsContent value="room">
				<div class="max-h-72 overflow-y-auto rounded-md">
					{#if rooms.length === 0}
						<p class="p-4 text-sm text-muted-foreground">No rooms yet.</p>
					{:else}
						<ul class="divide-y">
							{#each rooms as room (room.id)}
								<li>
									<button
										type="button"
										class="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted {selectedTargetId === room.id ? 'bg-muted' : ''}"
										onclick={() => (selectedTargetId = room.id)}
									>
										<DynamicIcon icon={room.icon} class="size-4 text-muted-foreground">
											{#snippet fallback()}<DoorOpen class="size-4 text-muted-foreground" />{/snippet}
										</DynamicIcon>
										<span class="flex-1 text-left text-sm">{room.name}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</TabsContent>
			<TabsContent value="group">
				<div class="max-h-72 overflow-y-auto rounded-md">
					{#if groups.length === 0}
						<p class="p-4 text-sm text-muted-foreground">No groups yet.</p>
					{:else}
						<ul class="divide-y">
							{#each groups as group (group.id)}
								<li>
									<button
										type="button"
										class="flex w-full items-center gap-3 px-3 py-2 hover:bg-muted {selectedTargetId === group.id ? 'bg-muted' : ''}"
										onclick={() => (selectedTargetId = group.id)}
									>
										<DynamicIcon icon={group.icon} class="size-4 text-muted-foreground">
											{#snippet fallback()}<GroupIcon class="size-4 text-muted-foreground" />{/snippet}
										</DynamicIcon>
										<span class="flex-1 text-left text-sm">{group.name}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</TabsContent>
		</Tabs>

		<DialogFooter>
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button disabled={!selectedTargetId || saving} onclick={handleAdd}>
				{#if saving}
					Adding...
				{:else if selectedTarget}
					Add to {mode === "room" ? "room" : "group"} {selectedTarget.name}
				{:else}
					Add
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
