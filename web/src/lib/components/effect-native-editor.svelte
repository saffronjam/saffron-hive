<script lang="ts">
	import { getContextClient, queryStore, subscriptionStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import { onGraphQLRecovered } from "$lib/graphql/app-recovery";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { nativeEffectSupportSummary } from "$lib/native-effect";
	import { Zap } from "@lucide/svelte";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		nativeName: string | null;
		disabled?: boolean;
	}

	let { nativeName = $bindable(), disabled = false }: Props = $props();

	const NATIVE_EFFECT_OPTIONS_QUERY = graphql(`
		query NativeEffectOptions {
			nativeEffectOptions {
				name
				displayName
				confirmedDeviceCount
				untestedDeviceCount
				unsupportedDeviceCount
				source
			}
		}
	`);
	const NATIVE_EFFECT_SUPPORT_CHANGED = graphql(`
		subscription NativeEffectEditorSupportChanged {
			nativeEffectSupportChanged
		}
	`);

	const client = getContextClient();
	const optionsStore = queryStore({
		client,
		query: NATIVE_EFFECT_OPTIONS_QUERY,
	});
	const supportUpdates = subscriptionStore({ client, query: NATIVE_EFFECT_SUPPORT_CHANGED });
	$effect(() => {
		if (!$supportUpdates.data?.nativeEffectSupportChanged) return;
		optionsStore.reexecute({ requestPolicy: "network-only" });
	});
	onGraphQLRecovered(() => {
		optionsStore.reexecute({ requestPolicy: "network-only" });
	});

	const options = $derived($optionsStore.data?.nativeEffectOptions ?? []);
	const selected = $derived(
		options.find((o) => o.name === nativeName) ?? null,
	);
</script>

<div class="rounded-lg shadow-card bg-card p-4 flex flex-col gap-3">
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<Zap class="size-4" />
		<span>{m.effects_zigbee_effect({}, locale.messageOptions())}</span>
	</div>

	{#if $optionsStore.fetching && options.length === 0}
		<p class="text-sm text-muted-foreground">{m.effects_native_loading({}, locale.messageOptions())}</p>
	{:else if $optionsStore.error}
		<p class="text-sm text-destructive">
			{m.effects_native_load_error({}, locale.messageOptions())}
		</p>
	{:else if options.length === 0}
		<p class="text-sm text-muted-foreground">
			{m.effects_native_empty({}, locale.messageOptions())}
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			<label class="text-sm text-muted-foreground" for="native-effect">
				{m.scene_editor_effect({}, locale.messageOptions())}
			</label>
			<Select
				type="single"
				value={nativeName ?? ""}
				onValueChange={(v) => {
					nativeName = v && v !== "" ? v : null;
				}}
				{disabled}
			>
				<SelectTrigger id="native-effect" class="w-full">
					{selected ? selected.displayName : m.effects_select_effect({}, locale.messageOptions())}
				</SelectTrigger>
				<SelectContent>
					{#each options as opt (opt.name)}
						<SelectItem value={opt.name}>
							<div class="flex items-center justify-between gap-3 w-full">
								<span>{opt.displayName}</span>
								<span class="text-xs text-muted-foreground">
									{nativeEffectSupportSummary(opt)}
								</span>
							</div>
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			{#if selected}
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<HiveChip type="hub" label="Zigbee" />
					<span>
						{nativeEffectSupportSummary(selected)}
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
