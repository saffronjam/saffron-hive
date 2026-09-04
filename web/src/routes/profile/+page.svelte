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
	import { Switch } from "$lib/components/ui/switch/index.js";
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
	import { haptics, type HapticPointerType } from "$lib/stores/haptics.svelte";
	import { pageHeader } from "$lib/stores/page-header.svelte";
	import { delayedLoading } from "$lib/delayed-loading.svelte";
	import { validateNewPassword } from "$lib/password";
	import {
		Theme as ThemeEnum,
		TimeFormat as TimeFormatEnum,
		TemperatureUnit as TempUnitEnum,
		Language as LanguageEnum,
	} from "$lib/gql/graphql";
	import { Info, Sun, Moon, Upload, X } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { goto } from "$app/navigation";
	import { languageName, m, type Language } from "$lib/i18n/messages";
	import { locale, selectableLanguages } from "$lib/i18n/locale.svelte";

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
				hapticsEnabled
				language
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

	$effect(() => {
		pageHeader.breadcrumbs = [{ label: m.nav_profile({}, locale.messageOptions()) }];
		pageHeader.actions = [];
		pageHeader.viewToggle = null;
	});
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
	let hapticsEnabled = $state(me.user?.hapticsEnabled ?? true);
	let hapticsSaving = $state(false);
	let hapticsPointerType: HapticPointerType | null = null;

	$effect(() => {
		if (me.user && !nameSaving) {
			nameDraft = me.user.name;
		}
		if (me.user && !hapticsSaving) {
			hapticsEnabled = me.user.hapticsEnabled;
		}
	});

	function captureHapticsPointer(event: PointerEvent) {
		hapticsPointerType = event.pointerType === "touch" || event.pointerType === "pen" ? event.pointerType : null;
	}

	async function setHapticsEnabled(next: boolean) {
		if (hapticsSaving || hapticsEnabled === next) return;
		const previous = hapticsEnabled;
		const source = hapticsPointerType;
		hapticsPointerType = null;
		hapticsEnabled = next;
		hapticsSaving = true;

		if (next) {
			haptics.syncFromProfile(true);
			haptics.play("selection", source);
		} else {
			haptics.play("selection", source);
			haptics.syncFromProfile(false);
		}

		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { hapticsEnabled: next } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				if (result.error) console.error(result.error);
				throw new Error("update haptics");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			hapticsEnabled = previous;
			haptics.syncFromProfile(previous);
			console.error(e);
			toast.error(m.profile_haptics_update_failed({}, locale.messageOptions()));
		} finally {
			hapticsSaving = false;
		}
	}

	const nameDirty = $derived(me.user != null && nameDraft.trim() !== me.user.name);

	async function saveName() {
		const trimmed = nameDraft.trim();
		nameError = trimmed
			? null
			: m.profile_display_name_empty({}, locale.messageOptions());
		if (nameError) return;
		nameSaving = true;
		try {
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { name: trimmed } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				if (result.error) console.error(result.error);
				throw new Error("update name");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_name_update_failed({}, locale.messageOptions()));
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
				if (result.error) console.error(result.error);
				throw new Error("update theme");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_theme_update_failed({}, locale.messageOptions()));
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
				if (result.error) console.error(result.error);
				throw new Error("update time format");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_time_update_failed({}, locale.messageOptions()));
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
				if (result.error) console.error(result.error);
				throw new Error("update temperature unit");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_temperature_update_failed({}, locale.messageOptions()));
		}
	}

	async function setUILanguage(next: Language) {
		const previous = me.user?.language ?? locale.currentLanguage;
		if (next === previous) return;
		locale.setLanguage(next);
		try {
			const language = next === "sv" ? LanguageEnum.Sv : next === "ru" ? LanguageEnum.Ru : LanguageEnum.En;
			const result = await client
				.mutation(UPDATE_CURRENT_USER, { input: { language } })
				.toPromise();
			if (result.error || !result.data?.updateCurrentUser) {
				if (result.error) console.error(result.error);
				throw new Error("update language");
			}
			me.apply(result.data.updateCurrentUser);
		} catch (error) {
			console.error(error);
			locale.setLanguage(previous);
			toast.error(m.profile_language_update_failed({}, locale.messageOptions()));
		}
	}

	async function uploadAvatar(file: File) {
		if (file.size > 10 * 1024 * 1024) {
			toast.error(m.profile_avatar_too_large({ size: 10 }, locale.messageOptions()));
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
				console.error(msg || `avatar upload failed (${res.status})`);
				throw new Error("avatar upload");
			}
			await me.refresh(client);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_avatar_upload_failed({}, locale.messageOptions()));
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
				console.error(msg || `avatar removal failed (${res.status})`);
				throw new Error("avatar removal");
			}
			await me.refresh(client);
		} catch (e) {
			console.error(e);
			toast.error(m.profile_avatar_clear_failed({}, locale.messageOptions()));
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
		confirmPwError =
			newPw !== confirmPw
				? m.auth_passwords_mismatch({}, locale.messageOptions())
				: null;
		if (newPwError || confirmPwError) return;
		pwSaving = true;
		try {
			const result = await client
				.mutation(CHANGE_PASSWORD, {
					input: { oldPassword: oldPw, newPassword: newPw },
				})
				.toPromise();
			if (result.error || !result.data?.changePassword) {
				if (result.error) console.error(result.error);
				throw new Error("change password");
			}
			passwordOpen = false;
			toast.info(m.profile_login_again({}, locale.messageOptions()));
			sessionTeardown();
			await goto("/login");
		} catch (e) {
			console.error(e);
			toast.error(m.profile_password_change_failed({}, locale.messageOptions()));
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
				if (result.error) console.error(result.error);
				throw new Error("sign out everywhere");
			}
			toast.success(m.profile_sign_out_success({}, locale.messageOptions()));
			sessionTeardown();
			goto("/login");
		} catch (e) {
			console.error(e);
			toast.error(m.profile_sign_out_failed({}, locale.messageOptions()));
		} finally {
			signingOutAll = false;
		}
	}

	const createdLabel = $derived.by(() => {
		if (!me.user?.createdAt) return "";
		const d = new Date(me.user.createdAt);
		return new Intl.DateTimeFormat(locale.intlLocale, {
			year: "numeric",
			month: "long",
			day: "numeric",
		}).format(d);
	});
</script>

<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
	<Card>
		<CardHeader>
			<CardTitle>{m.profile_account({}, locale.messageOptions())}</CardTitle>
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
								{uploading
									? m.common_uploading({}, locale.messageOptions())
									: m.profile_change_avatar({}, locale.messageOptions())}
							</Button>
							{#if me.user.avatarPath}
								<Button
									variant="ghost"
									size="sm"
									disabled={uploading || clearing}
									onclick={clearAvatar}
								>
									<X class="size-4" />
									{clearing
										? m.profile_removing({}, locale.messageOptions())
										: m.common_remove({}, locale.messageOptions())}
								</Button>
							{/if}
						</div>
						<p class="text-xs text-muted-foreground">
							{m.profile_avatar_help({ size: 10 }, locale.messageOptions())}
						</p>
					</div>
				</div>

				<div class="space-y-2">
					<label for="profile-name" class="text-sm font-medium">
						{m.profile_display_name({}, locale.messageOptions())}
					</label>
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
					<p class="text-sm font-medium text-muted-foreground">
						{m.profile_username({}, locale.messageOptions())}
					</p>
					<p class="font-mono text-sm">@{me.user.username}</p>
				</div>

				<div class="space-y-2">
					<p class="text-sm font-medium text-muted-foreground">
						{m.profile_member_since({}, locale.messageOptions())}
					</p>
					<p class="text-sm">{createdLabel}</p>
				</div>

				<div class="flex flex-wrap gap-2">
					<Button variant="outline" onclick={openPasswordDialog}>
						{m.profile_change_password({}, locale.messageOptions())}
					</Button>
					<Button
						variant="outline"
						disabled={signingOutAll}
						onclick={forceLogoutAll}
						title={m.profile_sign_out_description({}, locale.messageOptions())}
					>
						{signingOutAll
							? m.profile_signing_out({}, locale.messageOptions())
							: m.profile_sign_out_everywhere({}, locale.messageOptions())}
					</Button>
				</div>
			{:else if loader.visible}
				<p class="text-sm text-muted-foreground">
					{m.common_loading({}, locale.messageOptions())}
				</p>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>{m.profile_preferences({}, locale.messageOptions())}</CardTitle>
		</CardHeader>
		<CardContent class="space-y-6">
			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">{m.profile_language({}, locale.messageOptions())}</p>
					<Tooltip>
						<TooltipTrigger
							class="text-muted-foreground"
							aria-label={m.profile_language_about({}, locale.messageOptions())}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>{m.profile_language_help({}, locale.messageOptions())}</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={locale.currentLanguage}
					onchange={(value) => void setUILanguage(value as Language)}
					options={selectableLanguages.map((language) => ({
						value: language,
						label: languageName(language, locale.currentLanguage),
					}))}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">{m.profile_theme({}, locale.messageOptions())}</p>
					<Tooltip>
						<TooltipTrigger
							class="text-muted-foreground"
							aria-label={m.profile_theme_about({}, locale.messageOptions())}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>
							{m.profile_theme_help({}, locale.messageOptions())}
						</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.theme ?? "dark"}
					onchange={(v) => setTheme(v === "light" ? ThemeEnum.Light : ThemeEnum.Dark)}
					options={[
						{ value: "light", label: m.profile_theme_light({}, locale.messageOptions()), icon: Sun },
						{ value: "dark", label: m.profile_theme_dark({}, locale.messageOptions()), icon: Moon },
					]}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">
						{m.profile_time_format({}, locale.messageOptions())}
					</p>
					<Tooltip>
						<TooltipTrigger
							class="text-muted-foreground"
							aria-label={m.profile_time_format_about({}, locale.messageOptions())}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>
							{m.profile_time_format_help({}, locale.messageOptions())}
						</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.timeFormat ?? "24h"}
					onchange={(v) => setTimeFormat(v as "12h" | "24h")}
					options={[
						{ value: "24h", label: m.profile_time_24_hour({}, locale.messageOptions()) },
						{ value: "12h", label: m.profile_time_12_hour({}, locale.messageOptions()) },
					]}
				/>
			</div>

			<div class="space-y-2">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">
						{m.profile_temperature_unit({}, locale.messageOptions())}
					</p>
					<Tooltip>
						<TooltipTrigger
							class="text-muted-foreground"
							aria-label={m.profile_temperature_about({}, locale.messageOptions())}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>
							{m.profile_temperature_help({}, locale.messageOptions())}
						</TooltipContent>
					</Tooltip>
				</div>
				<SegmentedControl
					value={me.user?.temperatureUnit ?? "celsius"}
					onchange={(v) => setTemperatureUnit(v as "celsius" | "fahrenheit")}
					options={[
						{ value: "celsius", label: m.profile_temperature_celsius({}, locale.messageOptions()) },
						{ value: "fahrenheit", label: m.profile_temperature_fahrenheit({}, locale.messageOptions()) },
					]}
				/>
			</div>

			<div class="flex items-center gap-3">
				<div class="flex items-center gap-1.5">
					<p class="text-sm font-medium">
						{m.profile_haptics({}, locale.messageOptions())}
					</p>
					<Tooltip>
						<TooltipTrigger
							class="text-muted-foreground"
							aria-label={m.profile_haptics_about({}, locale.messageOptions())}
						>
							<Info class="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>
							{m.profile_haptics_help({}, locale.messageOptions())}
						</TooltipContent>
					</Tooltip>
				</div>
				<Switch
					checked={hapticsEnabled}
					disabled={hapticsSaving}
					haptic={false}
					onpointerdown={captureHapticsPointer}
					onpointercancel={() => (hapticsPointerType = null)}
					onkeydown={() => (hapticsPointerType = null)}
					onCheckedChange={setHapticsEnabled}
					aria-label={m.profile_haptics_enable({}, locale.messageOptions())}
				/>
			</div>
		</CardContent>
	</Card>
</div>

<Dialog bind:open={passwordOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{m.profile_change_password({}, locale.messageOptions())}</DialogTitle>
			<DialogDescription>
				{m.profile_password_description({}, locale.messageOptions())}
			</DialogDescription>
		</DialogHeader>
		<form onsubmit={submitPassword} class="space-y-4">
			<div class="space-y-2">
				<label for="pw-old" class="text-sm font-medium">
					{m.profile_current_password({}, locale.messageOptions())}
				</label>
				<Input id="pw-old" type="password" bind:value={oldPw} required />
			</div>
			<div class="space-y-2">
				<label for="pw-new" class="text-sm font-medium">
					{m.auth_new_password({}, locale.messageOptions())}
				</label>
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
				<label for="pw-confirm" class="text-sm font-medium">
					{m.auth_confirm_new_password({}, locale.messageOptions())}
				</label>
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
					{m.common_cancel({}, locale.messageOptions())}
				</Button>
				<Button type="submit" disabled={pwSaving}>
					{pwSaving
						? m.common_saving({}, locale.messageOptions())
						: m.profile_change_password({}, locale.messageOptions())}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
