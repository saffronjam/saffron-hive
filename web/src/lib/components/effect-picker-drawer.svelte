<script lang="ts">
	import HiveDrawer from "$lib/components/hive-drawer.svelte";
	import type { DrawerGroup } from "$lib/components/hive-drawer";
	import { Sparkles } from "@lucide/svelte";
	import { EffectKind } from "$lib/gql/graphql";
	import type { EffectSummary } from "$lib/effect-editable";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";
	import { entityDisplayName } from "$lib/utils";
	import { localizedNamesStore } from "$lib/stores/localized-names.svelte";

	export type EffectPickerSelection =
		| { kind: "timeline"; effectId: string }
		| { kind: "native"; nativeName: string };

	interface Props {
		open: boolean;
		effects: EffectSummary[];
		caps?: string[];
		onselect: (selection: EffectPickerSelection) => void;
		onclose: () => void;
	}

	let { open, effects, caps = [], onselect, onclose }: Props = $props();

	let drawerOpen = $state(false);

	$effect(() => {
		drawerOpen = open;
	});

	$effect(() => {
		if (!drawerOpen && open) {
			onclose();
		}
	});

	const filtered = $derived.by(() => {
		if (caps.length === 0) return effects;
		return effects.filter((e) => {
			if (e.kind === EffectKind.Native) return true;
			return e.requiredCapabilities.every((c) => caps.includes(c));
		});
	});

	const groups = $derived.by((): DrawerGroup<"effect">[] => {
		const timeline = filtered.filter((e) => e.kind === EffectKind.Timeline);
		const native = filtered.filter((e) => e.kind === EffectKind.Native);
		const out: DrawerGroup<"effect">[] = [];
		if (timeline.length > 0) {
			out.push({
				heading: m.effects_hive_group({}, locale.messageOptions()),
				items: timeline.map((e) => ({
					type: "effect" as const,
					id: e.id,
					name: entityDisplayName("effect", e),
					icon: Sparkles,
					searchValue: `${localizedNamesStore.searchValues("effect", e.id, e.name).join(" ")} ${e.requiredCapabilities.join(" ")}`,
				})),
			});
		}
		if (native.length > 0) {
			out.push({
				heading: m.effects_zigbee_group({}, locale.messageOptions()),
				items: native.map((e) => ({
					type: "effect" as const,
					id: e.id,
					name: e.name,
					icon: Sparkles,
					badge: "Zigbee",
				})),
			});
		}
		return out;
	});

	function handleSelect(_type: "effect", id: string) {
		const picked = effects.find((e) => e.id === id);
		if (!picked) return;
		if (picked.kind === EffectKind.Native) {
			const nativeName = picked.nativeName ?? "";
			if (nativeName === "") return;
			onselect({ kind: "native", nativeName });
			return;
		}
		onselect({ kind: "timeline", effectId: picked.id });
	}
</script>

<HiveDrawer
	bind:open={drawerOpen}
	title={m.effects_picker_title({}, locale.messageOptions())}
	description={m.effects_picker_description({}, locale.messageOptions())}
	{groups}
	onselect={handleSelect}
/>
