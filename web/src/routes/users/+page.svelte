<script lang="ts">
	import { queryStore, getContextClient } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu/index.js";
	import {
		Card,
		CardContent,
	} from "$lib/components/ui/card/index.js";
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow,
	} from "$lib/components/ui/table/index.js";
	import Avatar from "$lib/components/avatar.svelte";
	import HiveSearchbar from "$lib/components/hive-searchbar.svelte";
	import type { ChipConfig, SearchState } from "$lib/components/hive-searchbar";
	import AnimatedGrid from "$lib/components/animated-grid.svelte";
	import ListView from "$lib/components/list-view.svelte";
	import TableSelectionToolbar from "$lib/components/table-selection-toolbar.svelte";
	import TableHeaderCheckbox from "$lib/components/table-header-checkbox.svelte";
	import TableRowCheckbox from "$lib/components/table-row-checkbox.svelte";
	import ConfirmDialog from "$lib/components/confirm-dialog.svelte";
	import { createTableSelection } from "$lib/utils/table-selection.svelte";
	import { profile, type ListView as ListViewMode } from "$lib/stores/profile.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { EllipsisVertical, KeyRound, Plus, Trash2 } from "@lucide/svelte";
	import { onDestroy } from "svelte";
	import { toast } from "svelte-sonner";

	const client = getContextClient();

	const USERS_QUERY = graphql(`
		query UsersList {
			users {
				id
				username
				name
				avatarPath
			}
		}
	`);

	const CREATE_USER = graphql(`
		mutation UsersCreate($input: CreateUserInput!) {
			createUser(input: $input) {
				id
				username
				name
				avatarPath
			}
		}
	`);

	const DELETE_USER = graphql(`
		mutation UsersDelete($id: ID!) {
			deleteUser(id: $id)
		}
	`);

	const BATCH_DELETE_USERS = graphql(`
		mutation UsersBatchDelete($ids: [ID!]!) {
			batchDeleteUsers(ids: $ids)
		}
	`);

	const RESET_PASSWORD = graphql(`
		mutation UsersResetPassword($id: ID!, $newPassword: String!) {
			resetUserPassword(id: $id, newPassword: $newPassword)
		}
	`);

	interface UserRow {
		id: string;
		username: string;
		name: string;
		avatarPath: string | null;
	}

	const users = queryStore({ client, query: USERS_QUERY });
	const loader = delayedLoading(() => $users.fetching && ($users.data?.users.length ?? 0) === 0);

	const userList = $derived.by<UserRow[]>(() => {
		const data = $users.data?.users ?? [];
		return data.map((u) => ({
			id: u.id,
			username: u.username,
			name: u.name,
			avatarPath: u.avatarPath ?? null,
		}));
	});

	const chipConfigs: ChipConfig[] = [];
	let search = $state<SearchState>({ chips: [], freeText: "" });

	const filtered = $derived.by(() => {
		const q = search.freeText.trim().toLowerCase();
		if (!q) return userList;
		return userList.filter(
			(u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q),
		);
	});

	let view = $state<ListViewMode>(profile.get("view.users", "card"));

	function setView(v: ListViewMode) {
		view = v;
		profile.set("view.users", v);
	}

	let createOpen = $state(false);
	let createUsername = $state("");
	let createName = $state("");
	let createPassword = $state("");
	let createConfirm = $state("");
	let createSaving = $state(false);

	let resetTarget = $state<UserRow | null>(null);
	let resetPw = $state("");
	let resetConfirm = $state("");
	let resetSaving = $state(false);

	let deleteTarget = $state<UserRow | null>(null);
	let deleteSaving = $state(false);

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteSaving = $state(false);

	const filteredIds = $derived(filtered.map((u) => u.id));
	$effect(() => {
		selection.pruneTo(filteredIds);
	});
	$effect(() => {
		const meId = me.user?.id ?? auth.user?.id;
		selection.setDisabled(meId ? [meId] : []);
	});

	async function handleBatchDelete() {
		const ids = selection.selectedIds();
		if (ids.length === 0) {
			batchDeleteConfirm = false;
			return;
		}
		batchDeleteSaving = true;
		try {
			const result = await client.mutation(BATCH_DELETE_USERS, { ids }).toPromise();
			if (result.error) throw new Error(result.error.message);
			const n = result.data?.batchDeleteUsers ?? 0;
			toast.success(`${n} user${n === 1 ? "" : "s"} deleted`);
			batchDeleteConfirm = false;
			selection.clear();
			users.reexecute({ requestPolicy: "network-only" });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to delete users");
		} finally {
			batchDeleteSaving = false;
		}
	}

	pageHeader.breadcrumbs = [{ label: "Users" }];
	pageHeader.actions = [
		{ label: "Create user", icon: Plus, onclick: () => (createOpen = true) },
	];
	$effect(() => {
		pageHeader.viewToggle = { value: view, onchange: setView };
	});
	onDestroy(() => pageHeader.reset());

	function resetCreateForm() {
		createUsername = "";
		createName = "";
		createPassword = "";
		createConfirm = "";
	}

	async function submitCreate(e: SubmitEvent) {
		e.preventDefault();
		if (createPassword.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}
		if (createPassword !== createConfirm) {
			toast.error("Passwords do not match");
			return;
		}
		createSaving = true;
		try {
			const result = await client
				.mutation(CREATE_USER, {
					input: {
						username: createUsername.trim(),
						name: createName.trim(),
						password: createPassword,
					},
				})
				.toPromise();
			if (result.error || !result.data?.createUser) {
				throw new Error(result.error?.message ?? "Failed to create user");
			}
			createOpen = false;
			resetCreateForm();
			users.reexecute({ requestPolicy: "network-only" });
			toast.success("User created");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to create user");
		} finally {
			createSaving = false;
		}
	}

	function startReset(user: UserRow) {
		resetTarget = user;
		resetPw = "";
		resetConfirm = "";
	}

	async function submitReset(e: SubmitEvent) {
		e.preventDefault();
		if (!resetTarget) return;
		if (resetPw.length < 6) {
			toast.error("Password must be at least 6 characters");
			return;
		}
		if (resetPw !== resetConfirm) {
			toast.error("Passwords do not match");
			return;
		}
		resetSaving = true;
		try {
			const result = await client
				.mutation(RESET_PASSWORD, { id: resetTarget.id, newPassword: resetPw })
				.toPromise();
			if (result.error || !result.data?.resetUserPassword) {
				throw new Error(result.error?.message ?? "Failed to reset password");
			}
			toast.success(`Password reset for ${resetTarget.name}`);
			resetTarget = null;
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to reset password");
		} finally {
			resetSaving = false;
		}
	}

	function startDelete(user: UserRow) {
		deleteTarget = user;
	}

	async function confirmDelete() {
		if (!deleteTarget) return;
		deleteSaving = true;
		try {
			const result = await client
				.mutation(DELETE_USER, { id: deleteTarget.id })
				.toPromise();
			if (result.error || !result.data?.deleteUser) {
				throw new Error(result.error?.message ?? "Failed to delete user");
			}
			toast.success(`${deleteTarget.name} deleted`);
			deleteTarget = null;
			users.reexecute({ requestPolicy: "network-only" });
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to delete user");
		} finally {
			deleteSaving = false;
		}
	}

	function isSelf(user: UserRow): boolean {
		return user.id === (me.user?.id ?? auth.user?.id ?? "");
	}

	function deleteDisabledReason(user: UserRow): string {
		return isSelf(user) ? "You can't delete yourself" : "";
	}
</script>

<div class="space-y-4">
	<div class="flex items-stretch gap-2">
		<div class="min-w-0 flex-1">
			<HiveSearchbar
				chips={chipConfigs}
				value={search}
				onchange={(v) => (search = v)}
				placeholder="Search users..."
			/>
		</div>
		<div
			class="flex shrink-0 items-stretch overflow-hidden transition-[max-width,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
			style:max-width={view === "table" && selection.count > 0 ? "32rem" : "0px"}
			style:opacity={view === "table" && selection.count > 0 ? "1" : "0"}
			aria-hidden={!(view === "table" && selection.count > 0)}
		>
			<TableSelectionToolbar count={selection.count} onclear={() => selection.clear()}>
				{#snippet actions()}
					<Button
						variant="destructive"
						size="sm"
						onclick={() => (batchDeleteConfirm = true)}
					>
						Delete
					</Button>
				{/snippet}
			</TableSelectionToolbar>
		</div>
	</div>

	{#if $users.fetching && userList.length === 0}
		{#if loader.visible}
			<p class="text-sm text-muted-foreground">Loading users…</p>
		{/if}
	{:else if filtered.length === 0}
		<p class="text-sm text-muted-foreground">No users match.</p>
	{:else}
		<ListView mode={view}>
			{#snippet card()}
				<AnimatedGrid>
					{#each filtered as u (u.id)}
						<Card>
							<CardContent class="flex items-center gap-3 p-4">
								<Avatar user={u} size="md" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold">{u.name}</p>
									<p class="truncate font-mono text-xs text-muted-foreground">
										@{u.username}
									</p>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger>
										{#snippet child({ props })}
											<Button variant="ghost" size="icon" {...props}>
												<EllipsisVertical class="size-4" />
											</Button>
										{/snippet}
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onclick={() => startReset(u)}>
											<KeyRound class="size-4" />
											Reset password
										</DropdownMenuItem>
										<DropdownMenuItem
											disabled={isSelf(u)}
											title={deleteDisabledReason(u)}
											onclick={() => !isSelf(u) && startDelete(u)}
										>
											<Trash2 class="size-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</CardContent>
						</Card>
					{/each}
				</AnimatedGrid>
			{/snippet}
			{#snippet table()}
				<Card>
					<CardContent class="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="w-10">
										<TableHeaderCheckbox {selection} orderedIds={filteredIds} />
									</TableHead>
									<TableHead class="w-16"></TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Username</TableHead>
									<TableHead class="w-10"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filtered as u (u.id)}
									<TableRow data-state={selection.isSelected(u.id) ? "selected" : undefined}>
										<TableCell>
											<TableRowCheckbox
												id={u.id}
												{selection}
												orderedIds={filteredIds}
												tooltip={deleteDisabledReason(u)}
												ariaLabel="Select {u.name}"
											/>
										</TableCell>
										<TableCell>
											<Avatar user={u} size="sm" />
										</TableCell>
										<TableCell class="font-medium">{u.name}</TableCell>
										<TableCell class="font-mono text-xs text-muted-foreground">
											@{u.username}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger>
													{#snippet child({ props })}
														<Button variant="ghost" size="icon" {...props}>
															<EllipsisVertical class="size-4" />
														</Button>
													{/snippet}
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onclick={() => startReset(u)}>
														<KeyRound class="size-4" />
														Reset password
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={isSelf(u)}
														title={deleteDisabledReason(u)}
														onclick={() => !isSelf(u) && startDelete(u)}
													>
														<Trash2 class="size-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			{/snippet}
		</ListView>
	{/if}
</div>

<Dialog bind:open={createOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Create user</DialogTitle>
			<DialogDescription>Every user is a full admin today. Roles come later.</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitCreate} class="space-y-4">
			<div class="space-y-2">
				<label for="cu-username" class="text-sm font-medium">Username</label>
				<Input id="cu-username" bind:value={createUsername} required minlength={1} />
			</div>
			<div class="space-y-2">
				<label for="cu-name" class="text-sm font-medium">Display name</label>
				<Input id="cu-name" bind:value={createName} required minlength={1} />
			</div>
			<div class="space-y-2">
				<label for="cu-pw" class="text-sm font-medium">Password</label>
				<Input id="cu-pw" type="password" bind:value={createPassword} required minlength={6} />
			</div>
			<div class="space-y-2">
				<label for="cu-confirm" class="text-sm font-medium">Confirm password</label>
				<Input
					id="cu-confirm"
					type="password"
					bind:value={createConfirm}
					required
					minlength={6}
				/>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (createOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={createSaving}>
					{createSaving ? "Creating..." : "Create"}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={resetTarget !== null} onOpenChange={(o) => { if (!o) resetTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Reset password</DialogTitle>
			<DialogDescription>
				{#if resetTarget}
					Set a new password for {resetTarget.name}.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitReset} class="space-y-4">
			<div class="space-y-2">
				<label for="rp-new" class="text-sm font-medium">New password</label>
				<Input id="rp-new" type="password" bind:value={resetPw} required minlength={6} />
			</div>
			<div class="space-y-2">
				<label for="rp-confirm" class="text-sm font-medium">Confirm password</label>
				<Input
					id="rp-confirm"
					type="password"
					bind:value={resetConfirm}
					required
					minlength={6}
				/>
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (resetTarget = null)}>
					Cancel
				</Button>
				<Button type="submit" disabled={resetSaving}>
					{resetSaving ? "Saving..." : "Reset password"}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) deleteTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete user</DialogTitle>
			<DialogDescription>
				{#if deleteTarget}
					This will permanently remove {deleteTarget.name}. Resources they created (scenes, automations, groups, rooms) stay, with their attribution cleared.
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (deleteTarget = null)}>Cancel</Button>
			<Button variant="destructive" disabled={deleteSaving} onclick={confirmDelete}>
				{deleteSaving ? "Deleting..." : "Delete"}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<ConfirmDialog
	open={batchDeleteConfirm}
	title="Delete {selection.count} user{selection.count === 1 ? '' : 's'}?"
	description="This permanently removes the selected users. Resources they created stay, with their attribution cleared."
	confirmLabel="Delete"
	loading={batchDeleteSaving}
	onconfirm={handleBatchDelete}
	oncancel={() => (batchDeleteConfirm = false)}
/>
