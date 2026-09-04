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
	import NumberInput from "$lib/components/number-input.svelte";
	import SegmentedControl from "$lib/components/segmented-control.svelte";
	import { nowStore } from "$lib/stores/now.svelte";
	import { formatFull } from "$lib/time-format";

	const client = getContextClient();
	const messageOptions = $derived(locale.messageOptions());

	const USERS_QUERY = graphql(`
		query AccountsList {
			users {
				id
				username
				name
				avatarPath
			}
			guests {
				id
				name
				expiresAt
				createdAt
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

	const CREATE_GUEST = graphql(`
		mutation GuestsCreate($input: CreateGuestInput!) {
			createGuest(input: $input) {
				id
				name
				expiresAt
				createdAt
			}
		}
	`);

	const EXTEND_GUEST = graphql(`
		mutation GuestsExtend($id: ID!, $durationMinutes: Int!) {
			extendGuest(id: $id, durationMinutes: $durationMinutes) {
				id
				name
				expiresAt
				createdAt
			}
		}
	`);

	const DELETE_GUEST = graphql(`
		mutation GuestsDelete($id: ID!) {
			deleteGuest(id: $id)
		}
	`);

	const BATCH_DELETE_GUESTS = graphql(`
		mutation GuestsBatchDelete($ids: [ID!]!) {
			batchDeleteGuests(ids: $ids)
		}
	`);

	interface UserRow {
		kind: "user";
		id: string;
		username: string;
		name: string;
		avatarPath: string | null;
	}

	interface GuestRow {
		kind: "guest";
		id: string;
		name: string;
		expiresAt: string;
		createdAt: string;
	}

	type AccountRow = UserRow | GuestRow;
	interface AccountsSnapshot {
		users: UserRow[];
		guests: GuestRow[];
	}

	const USERS_CACHE_VERSION = 2;
	const restored = loadSessionSnapshot<AccountsSnapshot>(
		typeof window === "undefined" ? null : window.sessionStorage,
		"users",
		USERS_CACHE_VERSION,
	);
	let userList = $state<UserRow[]>(restored?.users ?? []);
	let guestList = $state<GuestRow[]>(restored?.guests ?? []);
	const accounts = $derived<AccountRow[]>([...userList, ...guestList]);
	let loading = $state(restored === null);
	const loader = delayedLoading(() => loading && accounts.length === 0);

	function persistUsers() {
		saveSessionSnapshot(window.sessionStorage, "users", USERS_CACHE_VERSION, {
			users: userList,
			guests: guestList,
		});
	}

	async function loadUsers() {
		loading = true;
		try {
			const result = await client.query(USERS_QUERY, {}, { requestPolicy: "network-only" }).toPromise();
			if (result.data?.users) {
				userList = result.data.users.map((user) => ({
					kind: "user",
					id: user.id,
					username: user.username,
					name: user.name,
					avatarPath: user.avatarPath ?? null,
				}));
				guestList = result.data.guests.map((guest) => ({
					kind: "guest",
					id: guest.id,
					name: guest.name,
					expiresAt: guest.expiresAt,
					createdAt: guest.createdAt,
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
		if (!q) return accounts;
		return accounts.filter(
			(account) =>
				account.name.toLowerCase().includes(q) ||
				(account.kind === "user" && account.username.toLowerCase().includes(q)),
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

	type DurationPreset = "60" | "240" | "1440" | "custom";
	type DurationUnit = "hours" | "days";
	let createGuestOpen = $state(false);
	let createGuestName = $state("");
	let createGuestPreset = $state<DurationPreset>("240");
	let createGuestDuration = $state<number | null>(4);
	let createGuestUnit = $state<DurationUnit>("hours");
	let createGuestSaving = $state(false);
	let extendTarget = $state<GuestRow | null>(null);
	let extendPreset = $state<DurationPreset>("60");
	let extendDuration = $state<number | null>(1);
	let extendUnit = $state<DurationUnit>("hours");
	let extendSaving = $state(false);
	let deleteGuestTarget = $state<GuestRow | null>(null);
	let deleteGuestSaving = $state(false);
	const createGuestMinutes = $derived(
		durationMinutes(createGuestPreset, createGuestDuration, createGuestUnit),
	);
	const extendMinutes = $derived(durationMinutes(extendPreset, extendDuration, extendUnit));

	const selection = createTableSelection();
	let batchDeleteConfirm = $state(false);
	let batchDeleteSaving = $state(false);

	const filteredIds = $derived(filtered.map((account) => account.id));
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
			const userIds = ids.filter((id) => userList.some((user) => user.id === id));
			const guestIds = ids.filter((id) => guestList.some((guest) => guest.id === id));
			const [usersResult, guestsResult] = await Promise.all([
				userIds.length
					? client.mutation(BATCH_DELETE_USERS, { ids: userIds }).toPromise()
					: Promise.resolve(null),
				guestIds.length
					? client.mutation(BATCH_DELETE_GUESTS, { ids: guestIds }).toPromise()
					: Promise.resolve(null),
			]);
			if (usersResult?.error) throw usersResult.error;
			if (guestsResult?.error) throw guestsResult.error;
			const n =
				(usersResult?.data?.batchDeleteUsers ?? 0) +
				(guestsResult?.data?.batchDeleteGuests ?? 0);
			toast.success(m.users_deleted_count({ count: n }, messageOptions));
			batchDeleteConfirm = false;
			selection.clear();
			userList = userList.filter((user) => !ids.includes(user.id));
			guestList = guestList.filter((guest) => !ids.includes(guest.id));
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
		if (page.url.pathname !== "/users") return;
		pageHeader.viewToggle = { value: view, onchange: setView };
		pageHeader.breadcrumbs = [{ label: m.nav_users({}, messageOptions) }];
		pageHeader.actions = [
			{ label: m.guests_add({}, messageOptions), mobileLabel: m.guests_add_short({}, messageOptions), icon: Plus, onclick: () => (createGuestOpen = true) },
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
					kind: "user",
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

	function durationMinutes(
		preset: DurationPreset,
		custom: number | null,
		unit: DurationUnit,
	): number {
		if (preset !== "custom") return Number(preset);
		return Math.round((custom ?? 0) * (unit === "days" ? 1440 : 60));
	}

	function mapGuest(guest: {
		id: string;
		name: string;
		expiresAt: string;
		createdAt: string;
	}): GuestRow {
		return { kind: "guest", ...guest };
	}

	function upsertGuest(guest: GuestRow) {
		guestList = [...guestList.filter((item) => item.id !== guest.id), guest];
		persistUsers();
	}

	async function submitCreateGuest(event: SubmitEvent) {
		event.preventDefault();
		if (!createGuestName.trim() || createGuestMinutes < 1) return;
		createGuestSaving = true;
		try {
			const result = await client
				.mutation(CREATE_GUEST, {
					input: { name: createGuestName.trim(), durationMinutes: createGuestMinutes },
				})
				.toPromise();
			if (result.error || !result.data?.createGuest) {
				throw result.error ?? new Error(m.guests_create_failed({}, messageOptions));
			}
			upsertGuest(mapGuest(result.data.createGuest));
			createGuestOpen = false;
			createGuestName = "";
			createGuestPreset = "240";
			createGuestDuration = 4;
			createGuestUnit = "hours";
			toast.success(m.guests_created({ name: result.data.createGuest.name }, messageOptions));
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.guests_create_failed({}, messageOptions)));
		} finally {
			createGuestSaving = false;
		}
	}

	function startExtend(guest: GuestRow) {
		extendTarget = guest;
		extendPreset = "60";
		extendDuration = 1;
		extendUnit = "hours";
	}

	async function submitExtend(event: SubmitEvent) {
		event.preventDefault();
		if (!extendTarget) return;
		if (extendMinutes < 1) return;
		extendSaving = true;
		try {
			const result = await client
				.mutation(EXTEND_GUEST, { id: extendTarget.id, durationMinutes: extendMinutes })
				.toPromise();
			if (result.error || !result.data?.extendGuest) {
				throw result.error ?? new Error(m.guests_extend_failed({}, messageOptions));
			}
			upsertGuest(mapGuest(result.data.extendGuest));
			toast.success(m.guests_extended({ name: result.data.extendGuest.name }, messageOptions));
			extendTarget = null;
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.guests_extend_failed({}, messageOptions)));
		} finally {
			extendSaving = false;
		}
	}

	async function confirmDeleteGuest() {
		if (!deleteGuestTarget) return;
		deleteGuestSaving = true;
		try {
			const target = deleteGuestTarget;
			const result = await client.mutation(DELETE_GUEST, { id: target.id }).toPromise();
			if (result.error || !result.data?.deleteGuest) {
				throw result.error ?? new Error(m.guests_delete_failed({}, messageOptions));
			}
			guestList = guestList.filter((guest) => guest.id !== target.id);
			persistUsers();
			deleteGuestTarget = null;
			toast.success(m.guests_deleted({ name: target.name }, messageOptions));
		} catch (e) {
			console.error(e);
			toast.error(graphqlErrorMessage(e, m.guests_delete_failed({}, messageOptions)));
		} finally {
			deleteGuestSaving = false;
		}
	}

	function expiryLabel(expiresAt: string): string {
		const diff = new Date(expiresAt).getTime() - nowStore.current.getTime();
		const formatter = new Intl.RelativeTimeFormat(locale.intlLocale, {
			numeric: "always",
			style: "long",
		});
		if (diff < 60 * 60 * 1000) return formatter.format(Math.max(1, Math.ceil(diff / 60000)), "minute");
		if (diff < 24 * 60 * 60 * 1000) return formatter.format(Math.ceil(diff / 3600000), "hour");
		return formatter.format(Math.ceil(diff / 86400000), "day");
	}
</script>

<div class="space-y-4">
	<div class="flex items-stretch gap-2">
		<div class="min-w-0 flex-1">
			<HiveSearchbar
				chips={chipConfigs}
				controller={searchController}
				placeholder={m.users_search_accounts({}, messageOptions)}
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

	{#if loading && accounts.length === 0}
		{#if loader.visible}
			<p class="text-sm text-muted-foreground">{m.users_loading_accounts({}, messageOptions)}</p>
		{/if}
	{:else if filtered.length === 0}
		<p class="text-sm text-muted-foreground">{m.users_no_account_match({}, messageOptions)}</p>
	{:else}
		<ListView mode={view}>
			{#snippet card()}
				<AnimatedGrid>
					{#each filtered as account (account.id)}
						<Card>
							<CardContent class="flex items-center gap-3 p-4">
								<Avatar user={account} size="md" />
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-semibold">{account.name}</p>
									{#if account.kind === "user"}
										<p class="truncate font-mono text-xs text-muted-foreground">
											@{account.username}
										</p>
									{:else}
										<p class="truncate text-xs text-muted-foreground" title={formatFull(new Date(account.expiresAt))}>
											{m.guests_expires({ time: expiryLabel(account.expiresAt) }, messageOptions)}
										</p>
									{/if}
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
										{#if account.kind === "user"}
											<DropdownMenuItem onclick={() => startReset(account)}>
												<KeyRound class="size-4" />
												{m.users_reset_password({}, messageOptions)}
											</DropdownMenuItem>
											<DropdownMenuItem
												disabled={isSelf(account)}
												title={deleteDisabledReason(account)}
												onclick={() => !isSelf(account) && startDelete(account)}
											>
												<Trash2 class="size-4" />
												{m.common_delete({}, messageOptions)}
											</DropdownMenuItem>
										{:else}
											<DropdownMenuItem onclick={() => startExtend(account)}>
												<Plus class="size-4" />
												{m.guests_extend({}, messageOptions)}
											</DropdownMenuItem>
											<DropdownMenuItem onclick={() => (deleteGuestTarget = account)}>
												<Trash2 class="size-4" />
												{m.common_delete({}, messageOptions)}
											</DropdownMenuItem>
										{/if}
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
									<TableHead>{m.users_column_type({}, messageOptions)}</TableHead>
									<TableHead>{m.users_column_username({}, messageOptions)}</TableHead>
									<TableHead>{m.users_column_expires({}, messageOptions)}</TableHead>
									<TableHead class="w-10"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each filtered as account (account.id)}
									<TableRow data-state={selection.isSelected(account.id) ? "selected" : undefined}>
										<TableCell>
											<TableRowCheckbox
												id={account.id}
												{selection}
												orderedIds={filteredIds}
												tooltip={account.kind === "user" ? deleteDisabledReason(account) : ""}
											ariaLabel={m.shared_select_item({ name: account.name }, messageOptions)}
											/>
										</TableCell>
										<TableCell>
											<Avatar user={account} size="sm" />
										</TableCell>
										<TableCell class="font-medium">{account.name}</TableCell>
										<TableCell>{account.kind === "guest" ? m.guests_type({}, messageOptions) : m.users_type({}, messageOptions)}</TableCell>
										<TableCell class="font-mono text-xs text-muted-foreground">
											{account.kind === "user" ? `@${account.username}` : "—"}
										</TableCell>
										<TableCell class="text-muted-foreground" title={account.kind === "guest" ? formatFull(new Date(account.expiresAt)) : undefined}>
											{account.kind === "guest" ? expiryLabel(account.expiresAt) : "—"}
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
													{#if account.kind === "user"}
														<DropdownMenuItem onclick={() => startReset(account)}>
															<KeyRound class="size-4" />
															{m.users_reset_password({}, messageOptions)}
														</DropdownMenuItem>
														<DropdownMenuItem disabled={isSelf(account)} title={deleteDisabledReason(account)} onclick={() => !isSelf(account) && startDelete(account)}>
															<Trash2 class="size-4" />
															{m.common_delete({}, messageOptions)}
														</DropdownMenuItem>
													{:else}
														<DropdownMenuItem onclick={() => startExtend(account)}>
															<Plus class="size-4" />
															{m.guests_extend({}, messageOptions)}
														</DropdownMenuItem>
														<DropdownMenuItem onclick={() => (deleteGuestTarget = account)}>
															<Trash2 class="size-4" />
															{m.common_delete({}, messageOptions)}
														</DropdownMenuItem>
													{/if}
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

<Dialog bind:open={createGuestOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.guests_add({}, messageOptions)}</DialogTitle>
			<DialogDescription>{m.guests_create_description({}, messageOptions)}</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitCreateGuest} class="space-y-4">
			<div class="space-y-2">
				<label for="guest-create-name" class="text-sm font-medium">{m.guest_name({}, messageOptions)}</label>
				<Input id="guest-create-name" bind:value={createGuestName} required minlength={1} />
			</div>
			<div class="space-y-2">
				<span class="text-sm font-medium">{m.guests_duration({}, messageOptions)}</span>
				<SegmentedControl
					value={createGuestPreset}
					onchange={(value) => (createGuestPreset = value)}
					options={[
						{ value: "60", label: m.guests_one_hour({}, messageOptions) },
						{ value: "240", label: m.guests_four_hours({}, messageOptions) },
						{ value: "1440", label: m.guests_one_day({}, messageOptions) },
						{ value: "custom", label: m.guests_custom({}, messageOptions) },
					]}
				/>
			</div>
			{#if createGuestPreset === "custom"}
				<div class="flex items-end gap-2">
					<div class="min-w-0 flex-1 space-y-2">
						<label for="guest-create-duration" class="text-sm font-medium">{m.guests_custom_duration({}, messageOptions)}</label>
						<NumberInput id="guest-create-duration" bind:value={createGuestDuration} min={1} nullable />
					</div>
					<SegmentedControl
						value={createGuestUnit}
						onchange={(value) => (createGuestUnit = value)}
						options={[
							{ value: "hours", label: m.guests_hours({}, messageOptions) },
							{ value: "days", label: m.guests_days({}, messageOptions) },
						]}
					/>
				</div>
			{/if}
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (createGuestOpen = false)}>
					{m.common_cancel({}, messageOptions)}
				</Button>
				<Button type="submit" disabled={createGuestSaving || !createGuestName.trim() || createGuestMinutes < 1}>
					{createGuestSaving ? m.users_creating({}, messageOptions) : m.users_create_short({}, messageOptions)}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={extendTarget !== null} onOpenChange={(open) => { if (!open) extendTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.guests_extend({}, messageOptions)}</DialogTitle>
			<DialogDescription>
				{#if extendTarget}{m.guests_extend_description({ name: extendTarget.name }, messageOptions)}{/if}
			</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitExtend} class="space-y-4">
			<SegmentedControl
				value={extendPreset}
				onchange={(value) => (extendPreset = value)}
				options={[
					{ value: "60", label: m.guests_one_hour({}, messageOptions) },
					{ value: "240", label: m.guests_four_hours({}, messageOptions) },
					{ value: "1440", label: m.guests_one_day({}, messageOptions) },
					{ value: "custom", label: m.guests_custom({}, messageOptions) },
				]}
			/>
			{#if extendPreset === "custom"}
				<div class="flex items-end gap-2">
					<div class="min-w-0 flex-1 space-y-2">
						<label for="guest-extend-duration" class="text-sm font-medium">{m.guests_custom_duration({}, messageOptions)}</label>
						<NumberInput id="guest-extend-duration" bind:value={extendDuration} min={1} nullable />
					</div>
					<SegmentedControl
						value={extendUnit}
						onchange={(value) => (extendUnit = value)}
						options={[
							{ value: "hours", label: m.guests_hours({}, messageOptions) },
							{ value: "days", label: m.guests_days({}, messageOptions) },
						]}
					/>
				</div>
			{/if}
			<p class="text-xs text-muted-foreground">{m.guests_extend_maximum({}, messageOptions)}</p>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (extendTarget = null)}>{m.common_cancel({}, messageOptions)}</Button>
				<Button type="submit" disabled={extendSaving || extendMinutes < 1}>
					{extendSaving ? m.users_saving({}, messageOptions) : m.guests_extend({}, messageOptions)}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<Dialog open={deleteGuestTarget !== null} onOpenChange={(open) => { if (!open) deleteGuestTarget = null; }}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.guests_delete_title({}, messageOptions)}</DialogTitle>
			<DialogDescription>
				{#if deleteGuestTarget}{m.guests_delete_description({ name: deleteGuestTarget.name }, messageOptions)}{/if}
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={() => (deleteGuestTarget = null)}>{m.common_cancel({}, messageOptions)}</Button>
			<Button variant="destructive" disabled={deleteGuestSaving} onclick={confirmDeleteGuest}>
				{deleteGuestSaving ? m.users_deleting({}, messageOptions) : m.common_delete({}, messageOptions)}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

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
