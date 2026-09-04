<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import { page } from "$app/state";
	import FieldError from "$lib/components/field-error.svelte";
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
	import type { ChipConfig } from "$lib/components/hive-searchbar";
	import { createUrlSearchState } from "$lib/search-state.svelte";
	import { loadSessionSnapshot, saveSessionSnapshot } from "$lib/session-cache";
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
	import { validateNewPassword } from "$lib/password";
	import { EllipsisVertical, KeyRound, Plus, Trash2 } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { graphqlErrorMessage } from "$lib/graphql-error";

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());

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

	const USERS_CACHE_VERSION = 1;
	const restoredUsers = loadSessionSnapshot<UserRow[]>(
		typeof window === "undefined" ? null : window.sessionStorage,
		"users",
		USERS_CACHE_VERSION,
	);
	let userList = $state<UserRow[]>(restoredUsers ?? []);
	let loading = $state(restoredUsers === null);
	const loader = delayedLoading(() => loading && userList.length === 0);

	function persistUsers() {
		saveSessionSnapshot(window.sessionStorage, "users", USERS_CACHE_VERSION, userList);
	}

	async function loadUsers() {
		loading = true;
		try {
			const result = await client.query(USERS_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
			if (result.data?.users) {
				userList = result.data.users.map((user) => ({
					id: user.id,
					username: user.username,
					name: user.name,
					avatarPath: user.avatarPath ?? null,
				}));
				persistUsers();
			}
		} finally {
			loading = false;
		}
	}

	const chipConfigs: ChipConfig[] = [];
	const searchController = createUrlSearchState({
		active: () => page.url.pathname === "/users",
	});

	const filtered = $derived.by(() => {
		const q = searchController.value.freeText.trim().toLowerCase();
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
	let createPwError = $state<string | null>(null);
	let createConfirmError = $state<string | null>(null);
	let resetPwError = $state<string | null>(null);
	let resetConfirmError = $state<string | null>(null);

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
			toast.success(m.users_deleted_count({ count: n }, messageOptions));
			batchDeleteConfirm = false;
			selection.clear();
			userList = userList.filter((user) => !ids.includes(user.id));
			persistUsers();
			void loadUsers();
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.users_delete_many_failed({}, messageOptions)));
		} finally {
			batchDeleteSaving = false;
		}
	}

	onMount(() => {
		void loadUsers();
	});
	$effect(() => {
		pageHeader.viewToggle = { value: view, onchange: setView };
		pageHeader.breadcrumbs = [{ label: m.nav_users({}, messageOptions) }];
		pageHeader.actions = [
			{ label: m.users_create({}, messageOptions), mobileLabel: m.users_create_short({}, messageOptions), icon: Plus, onclick: () => (createOpen = true) },
		];
	});

	function resetCreateForm() {
		createUsername = "";
		createName = "";
		createPassword = "";
		createConfirm = "";
	}

	async function submitCreate(e: SubmitEvent) {
		e.preventDefault();
		createPwError = validateNewPassword(createPassword);
		createConfirmError =
			createPassword !== createConfirm ? m.auth_passwords_mismatch({}, messageOptions) : null;
		if (createPwError || createConfirmError) return;
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
				throw result.error ?? new Error(m.users_create_failed({}, messageOptions));
			}
			createOpen = false;
			resetCreateForm();
			const created = result.data.createUser;
			userList = [
				...userList.filter((user) => user.id !== created.id),
				{
					id: created.id,
					username: created.username,
					name: created.name,
					avatarPath: created.avatarPath ?? null,
				},
			];
			persistUsers();
			toast.success(m.users_created({}, messageOptions));
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.users_create_failed({}, messageOptions)));
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
		resetPwError = validateNewPassword(resetPw);
		resetConfirmError = resetPw !== resetConfirm ? m.auth_passwords_mismatch({}, messageOptions) : null;
		if (resetPwError || resetConfirmError) return;
		resetSaving = true;
		try {
			const result = await client
				.mutation(RESET_PASSWORD, { id: resetTarget.id, newPassword: resetPw })
				.toPromise();
			if (result.error || !result.data?.resetUserPassword) {
				throw result.error ?? new Error(m.users_reset_failed({}, messageOptions));
			}
			toast.success(m.users_password_reset({ name: resetTarget.name }, messageOptions));
			resetTarget = null;
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.users_reset_failed({}, messageOptions)));
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
				throw result.error ?? new Error(m.users_delete_failed({}, messageOptions));
			}
			toast.success(m.users_deleted({ name: deleteTarget.name }, messageOptions));
			userList = userList.filter((user) => user.id !== deleteTarget?.id);
			persistUsers();
			deleteTarget = null;
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.users_delete_failed({}, messageOptions)));
		} finally {
			deleteSaving = false;
		}
	}

	function isSelf(user: UserRow): boolean {
		return user.id === (me.user?.id ?? auth.user?.id ?? "");
	}

	function deleteDisabledReason(user: UserRow): string {
		return isSelf(user) ? m.users_cannot_delete_self({}, messageOptions) : "";
	}
</script>

<div class="space-y-4">
	<div class="flex items-stretch gap-2">
		<div class="min-w-0 flex-1">
			<HiveSearchbar
				chips={chipConfigs}
				controller={searchController}
				placeholder={m.users_search({}, messageOptions)}
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
						{m.common_delete({}, messageOptions)}
					</Button>
				{/snippet}
			</TableSelectionToolbar>
		</div>
	</div>

	{#if loading && userList.length === 0}
		{#if loader.visible}
			<p class="text-sm text-muted-foreground">{m.users_loading({}, messageOptions)}</p>
		{/if}
	{:else if filtered.length === 0}
		<p class="text-sm text-muted-foreground">{m.users_no_match({}, messageOptions)}</p>
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
									<DropdownMenuContent align="end" class="w-max min-w-48">
										<DropdownMenuItem onclick={() => startReset(u)}>
											<KeyRound class="size-4" />
											{m.users_reset_password({}, messageOptions)}
										</DropdownMenuItem>
										<DropdownMenuItem
											disabled={isSelf(u)}
											title={deleteDisabledReason(u)}
											onclick={() => !isSelf(u) && startDelete(u)}
										>
											<Trash2 class="size-4" />
											{m.common_delete({}, messageOptions)}
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
									<TableHead>{m.users_column_name({}, messageOptions)}</TableHead>
									<TableHead>{m.users_column_username({}, messageOptions)}</TableHead>
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
											ariaLabel={m.shared_select_item({ name: u.name }, messageOptions)}
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
												<DropdownMenuContent align="end" class="w-max min-w-48">
													<DropdownMenuItem onclick={() => startReset(u)}>
														<KeyRound class="size-4" />
												{m.users_reset_password({}, messageOptions)}
													</DropdownMenuItem>
													<DropdownMenuItem
														disabled={isSelf(u)}
														title={deleteDisabledReason(u)}
														onclick={() => !isSelf(u) && startDelete(u)}
													>
														<Trash2 class="size-4" />
												{m.common_delete({}, messageOptions)}
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
			<DialogTitle>{m.users_create({}, messageOptions)}</DialogTitle>
			<DialogDescription>{m.users_create_description({}, messageOptions)}</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitCreate} class="space-y-4">
			<div class="space-y-2">
				<label for="cu-username" class="text-sm font-medium">{m.auth_username({}, messageOptions)}</label>
				<Input id="cu-username" bind:value={createUsername} required minlength={1} />
			</div>
			<div class="space-y-2">
				<label for="cu-name" class="text-sm font-medium">{m.users_display_name({}, messageOptions)}</label>
				<Input id="cu-name" bind:value={createName} required minlength={1} />
			</div>
			<div class="space-y-2">
				<label for="cu-pw" class="text-sm font-medium">{m.auth_password({}, messageOptions)}</label>
				<Input
					id="cu-pw"
					type="password"
					bind:value={createPassword}
					required
					minlength={6}
					aria-invalid={!!createPwError}
					aria-describedby={createPwError ? "cu-pw-error" : undefined}
					oninput={() => (createPwError = null)}
				/>
				<FieldError id="cu-pw-error" message={createPwError} />
			</div>
			<div class="space-y-2">
				<label for="cu-confirm" class="text-sm font-medium">{m.auth_confirm_password({}, messageOptions)}</label>
				<Input
					id="cu-confirm"
					type="password"
					bind:value={createConfirm}
					required
					minlength={6}
					aria-invalid={!!createConfirmError}
					aria-describedby={createConfirmError ? "cu-confirm-error" : undefined}
					oninput={() => (createConfirmError = null)}
				/>
				<FieldError id="cu-confirm-error" message={createConfirmError} />
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (createOpen = false)}>
					{m.common_cancel({}, messageOptions)}
				</Button>
				<Button type="submit" disabled={createSaving}>
					{createSaving ? m.users_creating({}, messageOptions) : m.users_create_short({}, messageOptions)}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={resetTarget !== null} onOpenChange={(o) => { if (!o) resetTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.users_reset_password({}, messageOptions)}</DialogTitle>
			<DialogDescription>
				{#if resetTarget}
					{m.users_reset_description({ name: resetTarget.name }, messageOptions)}
				{/if}
			</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitReset} class="space-y-4">
			<div class="space-y-2">
				<label for="rp-new" class="text-sm font-medium">{m.users_new_password({}, messageOptions)}</label>
				<Input
					id="rp-new"
					type="password"
					bind:value={resetPw}
					required
					minlength={6}
					aria-invalid={!!resetPwError}
					aria-describedby={resetPwError ? "rp-new-error" : undefined}
					oninput={() => (resetPwError = null)}
				/>
				<FieldError id="rp-new-error" message={resetPwError} />
			</div>
			<div class="space-y-2">
				<label for="rp-confirm" class="text-sm font-medium">{m.auth_confirm_password({}, messageOptions)}</label>
				<Input
					id="rp-confirm"
					type="password"
					bind:value={resetConfirm}
					required
					minlength={6}
					aria-invalid={!!resetConfirmError}
					aria-describedby={resetConfirmError ? "rp-confirm-error" : undefined}
					oninput={() => (resetConfirmError = null)}
				/>
				<FieldError id="rp-confirm-error" message={resetConfirmError} />
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (resetTarget = null)}>
					{m.common_cancel({}, messageOptions)}
				</Button>
				<Button type="submit" disabled={resetSaving}>
					{resetSaving ? m.users_saving({}, messageOptions) : m.users_reset_password({}, messageOptions)}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteTarget !== null} onOpenChange={(o) => { if (!o) deleteTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.users_delete_title({}, messageOptions)}</DialogTitle>
			<DialogDescription>
				{#if deleteTarget}
					{m.users_delete_description({ name: deleteTarget.name }, messageOptions)}
				{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (deleteTarget = null)}>{m.common_cancel({}, messageOptions)}</Button>
			<Button variant="destructive" disabled={deleteSaving} onclick={confirmDelete}>
				{deleteSaving ? m.users_deleting({}, messageOptions) : m.common_delete({}, messageOptions)}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<ConfirmDialog
	open={batchDeleteConfirm}
	title={m.users_delete_many_title({ count: selection.count }, messageOptions)}
	description={m.users_delete_many_description({}, messageOptions)}
	confirmLabel={m.common_delete({}, messageOptions)}
	loading={batchDeleteSaving}
	onconfirm={handleBatchDelete}
	oncancel={() => (batchDeleteConfirm = false)}
/>
