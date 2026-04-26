<script lang="ts">
	import { getContextClient, queryStore } from "@urql/svelte";
	import { graphql } from "$lib/gql";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Zap } from "@lucide/svelte";

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
				supportedDeviceCount
			}
		}
	`);

	const client = getContextClient();
	const optionsStore = queryStore({
		client,
		query: NATIVE_EFFECT_OPTIONS_QUERY,
	});

	const options = $derived($optionsStore.data?.nativeEffectOptions ?? []);
	const selected = $derived(
		options.find((o) => o.name === nativeName) ?? null,
	);
</script>

<div class="rounded-lg shadow-card bg-card p-4 flex flex-col gap-3">
	<div class="flex items-center gap-2 text-sm text-muted-foreground">
		<Zap class="size-4" />
		<span>Native effect</span>
	</div>

	{#if $optionsStore.fetching && options.length === 0}
		<p class="text-sm text-muted-foreground">Loading available effects…</p>
	{:else if $optionsStore.error}
		<p class="text-sm text-destructive">
			Could not load native effects: {$optionsStore.error.message}
		</p>
	{:else if options.length === 0}
		<p class="text-sm text-muted-foreground">
			No devices report any native effects yet.
		</p>
	{:else}
		<div class="flex flex-col gap-2">
			<label class="text-sm text-muted-foreground" for="native-effect">
				Effect
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
					{selected ? selected.displayName : "Select an effect"}
				</SelectTrigger>
				<SelectContent>
					{#each options as opt (opt.name)}
						<SelectItem value={opt.name}>
							<div class="flex items-center justify-between gap-3 w-full">
								<span>{opt.displayName}</span>
								<span class="text-xs text-muted-foreground">
									{opt.supportedDeviceCount} device{opt.supportedDeviceCount === 1 ? "" : "s"}
								</span>
							</div>
						</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			{#if selected}
				<div class="flex items-center gap-2 text-xs text-muted-foreground">
					<Badge variant="secondary">native</Badge>
					<span>
						Supported on {selected.supportedDeviceCount} device{selected.supportedDeviceCount === 1 ? "" : "s"}
					</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
