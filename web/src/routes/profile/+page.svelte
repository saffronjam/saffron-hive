<script lang="ts">
	import { getContextClient } from "@urql/svelte";
	import FieldError from "$lib/components/field-error.svelte";
	import { graphql } from "$lib/gql";
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import {
		Tooltip,
		TooltipContent,
		TooltipTrigger,
	} from "$lib/components/ui/tooltip/index.js";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog/index.js";
	import Avatar from "$lib/components/avatar.svelte";
	import SaveButton from "$lib/components/save-button.svelte";
	import SegmentedControl from "$lib/components/segmented-control.svelte";
	import { auth } from "$lib/stores/auth.svelte";
	import { sessionTeardown } from "$lib/session";
	import { me } from "$lib/stores/me.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { validateNewPassword } from "$lib/password";
	import {
		Theme as ThemeEnum,
		TimeFormat as TimeFormatEnum,
		TemperatureUnit as TempUnitEnum,
	} from "$lib/gql/graphql";
	import { Info, Sun, Moon, Upload, X } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";

	const client = getContextClient();

	const UPDATE_CURRENT_USER = graphql(`
		mutation ProfileUpdateCurrentUser($input: UpdateCurrentUserInput!) {
			updateCurrentUser(input: $input) {
				id
				username
				name
				avatarPath
				theme
				timeFormat
				temperatureUnit
				createdAt
				mustChangePassword
			}
		}
	`);

	const CHANGE_PASSWORD = graphql(`
		mutation ProfileChangePassword($input: ChangePasswordInput!) {
			changePassword(input: $input)
		}
	`);

	const FORCE_LOGOUT_ALL = graphql(`
		mutation ProfileForceLogoutAll {
			forceLogoutAllSessions
		}
	`);

	pageHeader.breadcrumbs = [{ label: "Profile" }];
	pageHeader.actions = [];
	pageHeader.viewToggle = null;
	const loader = delayedLoading(() => !me.user);

	let nameDraft = $state(me.user?.name ?? auth.user?.name ?? "");
	let nameSaving = $state(false);
	let nameError = $state<string | null>(null);
	let newPwError = $state<string | null>(null);
	let confirmPwError = $state<string | null>(null);
	let uploading = $state(false);
	let clearing = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let passwordOpen = $state(false);
	let oldPw = $state("");
	let newPw = $state("");
	let confirmPw = $state("");
	let pwSaving = $state(false);

	$effect(() => {
		if (me.user && !nameSaving) {
			nameDraft = me.user.name;
		}
	});

	const nameDirty = $derived(me.user != null && nameDraft.trim() !== me.user.name);

	async function saveName() {
		const trimmed = nameDraft.trim();
		nameError = trimmed ? null : "Display name cannot be empty.";
		if (nameError) return;
		nameSaving = true;
		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { name: trimmed } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				throw new Error(result.error?.message ?? "Failed to update name");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update name");
		} finally {
			nameSaving = false;
		}
	}

	async function setTheme(next: ThemeEnum) {
		if (me.user?.theme === (next === ThemeEnum.Light ? "light" : "dark")) return;
		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { theme: next } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				throw new Error(result.error?.message ?? "Failed to update theme");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update theme");
		}
	}

	async function setTimeFormat(next: "12h" | "24h") {
		if (me.user?.timeFormat === next) return;
		const enumValue = next === "12h" ? TimeFormatEnum.TwelveHour : TimeFormatEnum.TwentyFourHour;
		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { timeFormat: enumValue } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				throw new Error(result.error?.message ?? "Failed to update time format");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update time format");
		}
	}

	async function setTemperatureUnit(next: "celsius" | "fahrenheit") {
		if (me.user?.temperatureUnit === next) return;
		const enumValue = next === "fahrenheit" ? TempUnitEnum.Fahrenheit : TempUnitEnum.Celsius;
		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { temperatureUnit: enumValue } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				throw new Error(result.error?.message ?? "Failed to update temperature unit");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to update temperature unit");
		}
	}

	async function uploadAvatar(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			toast.error("Image too large (max 10 MB)");
			return;
		}
		uploading = true;
		const form = new FormData();
		form.append("file", file);
		try {
			const res = await fetch("/api/avatars", {
				method: "POST",
				headers: { Authorization: `Bearer ${auth.token}` },
				body: form,
			});
			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || `Upload failed (${res.status})`);
			}
			await me.refresh(client);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to upload avatar");
		} finally {
			uploading = false;
			if (fileInput) fileInput.value = "";
		}
	}

	async function clearAvatar() {
		if (!me.user?.avatarPath) return;
		clearing = true;
		try {
			const res = await fetch("/api/avatars", {
				method: "DELETE",
				headers: { Authorization: `Bearer ${auth.token}` },
			});
			if (!res.ok && res.status !== 204) {
				const msg = await res.text();
				throw new Error(msg || `Clear failed (${res.status})`);
			}
			await me.refresh(client);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to clear avatar");
		} finally {
			clearing = false;
		}
	}

	function onFilePicked(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) void uploadAvatar(file);
	}

	function openPasswordDialog() {
		oldPw = "";
		newPw = "";
		confirmPw = "";
		passwordOpen = true;
	}

	async function submitPassword(e: SubmitEvent) {
		e.preventDefault();
		newPwError = validateNewPassword(newPw);
		confirmPwError = newPw !== confirmPw ? "Passwords do not match." : null;
		if (newPwError || confirmPwError) return;
		pwSaving = true;
		try {
			const result = await client
				.mutation(CHANGE_PASSWORD, {
					input: { oldPassword: oldPw, newPassword: newPw },
				})
				.toPromise();
			if (result.error || !result.data?.changePassword) {
				throw new Error(result.error?.message ?? "Failed to change password");
			}
			passwordOpen = false;
			toast.info("Please log in again with your new password.");
			sessionTeardown();
			await goto("/login");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to change password");
		} finally {
			pwSaving = false;
		}
	}

	let signingOutAll = $state(false);
	async function forceLogoutAll() {
		signingOutAll = true;
		try {
			const result = await client.mutation(FORCE_LOGOUT_ALL, {}).toPromise();
			if (result.error || !result.data?.forceLogoutAllSessions) {
				throw new Error(result.error?.message ?? "Failed to sign out everywhere");
			}
			toast.success("Signed out of every device. Please log in again.");
			sessionTeardown();
			goto("/login");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Failed to sign out everywhere");
		} finally {
			signingOutAll = false;
		}
	}

	const createdLabel = $derived.by(() => {
		if (!me.user?.createdAt) return "";
		const d = new Date(me.user.createdAt);
		return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
	});
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<Card>
		<CardHeader>
			<CardTitle>Account</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if me.user}
				<div class="flex items-center gap-4">
					<Avatar user={me.user} size="lg" />
					<div class="space-y-2">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp"
							class="hidden"
							bind:this={fileInput}
							onchange={onFilePicked}
						/>
						<div class="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={uploading || clearing}
								onclick={() => fileInput?.click()}
							>
								<Upload class="size-4" />
								{uploading ? "Uploading..." : "Change avatar"}
							</Button>
							{#if me.user.avatarPath}
								<Button
									variant="ghost"
									size="sm"
									disabled={uploading || clearing}
									onclick={clearAvatar}
								>
									<X class="size-4" />
									{clearing ? "Removing..." : "Remove"}
								</Button>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground">JPEG, PNG, or WebP. Max 10 MB.</p>
					</div>
				</div>

				<div class="space-y-2">
					<label for="profile-name" class="text-sm font-medium">Display name</label>
					<div class="flex gap-2">
						<Input
							id="profile-name"
							bind:value={nameDraft}
							disabled={nameSaving}
							aria-invalid={!!nameError}
							aria-describedby={nameError ? "profile-name-error" : undefined}
							oninput={() => (nameError = null)}
						/>
						<FieldError id="profile-name-error" message={nameError} />
						<SaveButton
							saving={nameSaving}
							disabled={!nameDirty || nameSaving}
							onclick={saveName}
						/>
					</div>
				</div>

				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">Username</p>
					<p class="font-mono text-sm">@{me.user.username}</p>
				</div>

				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">Member since</p>
					<p class="text-sm">{createdLabel}</p>
				</div>

				<div class="flex flex-wrap gap-2">
					<Button variant="outline" onclick={openPasswordDialog}>Change password</Button>
					<Button
						variant="outline"
						disabled={signingOutAll}
						onclick={forceLogoutAll}
						title="Invalidate every signed-in session for this account, including this one."
					>
						{signingOutAll ? "Signing out…" : "Sign out everywhere"}
					</Button>
				</div>
			{:else if loader.visible}
				<p class="text-sm text-muted-foreground">Loading…</p>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Preferences</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">Theme</p>
					<Tooltip>
						<TooltipTrigger class="text-muted-foreground" aria-label="About theme">
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>Saved per-user. Pre-login pages follow the most recent theme on this device.</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.theme ?? "dark"}
					onchange={(v) => setTheme(v === "light" ? ThemeEnum.Light : ThemeEnum.Dark)}
					options={[
						{ value: "light", label: "Light", icon: Sun },
						{ value: "dark", label: "Dark", icon: Moon },
					]}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">Time format</p>
					<Tooltip>
						<TooltipTrigger class="text-muted-foreground" aria-label="About time format">
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>Applies wherever time is shown. Dates use YYYY-MM-DD.</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.timeFormat ?? "24h"}
					onchange={(v) => setTimeFormat(v as "12h" | "24h")}
					options={[
						{ value: "24h", label: "24-hour" },
						{ value: "12h", label: "12-hour" },
					]}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">Temperature unit</p>
					<Tooltip>
						<TooltipTrigger class="text-muted-foreground" aria-label="About temperature unit">
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>Applies wherever temperature is shown. Values are stored in Celsius.</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.temperatureUnit ?? "celsius"}
					onchange={(v) => setTemperatureUnit(v as "celsius" | "fahrenheit")}
					options={[
						{ value: "celsius", label: "Celsius (°C)" },
						{ value: "fahrenheit", label: "Fahrenheit (°F)" },
					]}
				/>
			</div>
		</CardContent>
	</Card>
</div>

<Dialog bind:open={passwordOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Change password</DialogTitle>
			<DialogDescription>Enter your current password, then pick a new one.</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitPassword} class="space-y-4">
			<div class="space-y-2">
				<label for="pw-old" class="text-sm font-medium">Current password</label>
				<Input id="pw-old" type="password" bind:value={oldPw} required />
			</div>
			<div class="space-y-2">
				<label for="pw-new" class="text-sm font-medium">New password</label>
				<Input
					id="pw-new"
					type="password"
					bind:value={newPw}
					required
					minlength={6}
					aria-invalid={!!newPwError}
					aria-describedby={newPwError ? "pw-new-error" : undefined}
					oninput={() => (newPwError = null)}
				/>
				<FieldError id="pw-new-error" message={newPwError} />
			</div>
			<div class="space-y-2">
				<label for="pw-confirm" class="text-sm font-medium">Confirm new password</label>
				<Input
					id="pw-confirm"
					type="password"
					bind:value={confirmPw}
					required
					minlength={6}
					aria-invalid={!!confirmPwError}
					aria-describedby={confirmPwError ? "pw-confirm-error" : undefined}
					oninput={() => (confirmPwError = null)}
				/>
				<FieldError id="pw-confirm-error" message={confirmPwError} />
			</div>
			<DialogFooter>
				<Button type="button" variant="outline" onclick={() => (passwordOpen = false)}>
					Cancel
				</Button>
				<Button type="submit" disabled={pwSaving}>
					{pwSaving ? "Saving..." : "Change password"}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
