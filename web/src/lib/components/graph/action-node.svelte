<script lang="ts">
	import { Handle, Position } from "@xyflow/svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { Play } from "@lucide/svelte";
	import { validateActionConfig } from "./trigger-expr";
	import DeviceStateEditor from "./device-state-editor.svelte";
	import HiveSelectAutocomplete from "$lib/components/hive-select-autocomplete.svelte";
	import HiveChip from "$lib/components/hive-chip.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import type { GroupLite, RoomLite, TargetKind } from "$lib/target-resolve";
	import type { Device } from "$lib/gql/graphql";

	interface ActionConfig {
		actionType: string;
		targetType: string;
		targetId: string;
		targetName: string;
		payload: string;
	}

	interface SceneRef {
		id: string;
		name: string;
	}

	type EffectRef =
		| { kind: "timeline"; id: string; name: string }
		| { kind: "native"; nativeName: string; name: string };

	interface ActionNodeData extends Record<string, unknown> {
		config: ActionConfig;
		editable: boolean;
		activated: boolean;
		devices?: Device[];
		groups?: (GroupLite & { name: string })[];
		rooms?: (RoomLite & { name: string })[];
		scenes?: SceneRef[];
		effects?: EffectRef[];
		onConfigChange?: (config: ActionConfig) => void;
	}

	function effectRefKey(ref: EffectRef): string {
		return ref.kind === "timeline" ? `timeline:${ref.id}` : `native:${ref.nativeName}`;
	}

	interface TargetItem {
		kind: "device" | "group" | "room" | "scene";
		id: string;
		name: string;
		deviceType?: string;
	}

	function targetKey(t: TargetItem): string {
		return `${t.kind}:${t.id}`;
	}

	const targetKindLabel: Record<TargetItem["kind"], string> = {
		device: "Device",
		group: "Group",
		room: "Room",
		scene: "Scene",
	};

	interface Props {
		data: ActionNodeData;
		id: string;
		selected?: boolean;
	}

	let { data, id, selected = false }: Props = $props();

	const actionTypes = [
		{ value: "set_device_state", label: "Set Device State" },
		{ value: "activate_scene", label: "Activate Scene" },
		{ value: "run_effect", label: "Run Effect" },
		{ value: "raise_alarm", label: "Raise Alarm" },
		{ value: "clear_alarm", label: "Clear Alarm" },
	];

	const SEVERITIES = [
		{ value: "high", label: "High" },
		{ value: "medium", label: "Medium" },
		{ value: "low", label: "Low" },
	];

	const ALARM_KINDS = [
		{ value: "auto", label: "Auto" },
		{ value: "one_shot", label: "One-shot" },
	];

	function handleActionTypeChange(value: string | undefined) {
		if (!value || !data.onConfigChange) return;
		// When switching into an alarm action, seed a sensible default payload
		// so parsing doesn't immediately throw in the panels below.
		let payload = data.config.payload;
		if (value === "raise_alarm" && !isRaiseAlarmPayload(payload)) {
			payload = JSON.stringify({ alarm_id: "", severity: "medium", kind: "auto", message: "" });
		} else if (value === "clear_alarm" && !isClearAlarmPayload(payload)) {
			payload = JSON.stringify({ alarm_id: "" });
		} else if (value === "run_effect" && !isRunEffectPayload(payload)) {
			payload = JSON.stringify({});
		}
		data.onConfigChange({
			...data.config,
			actionType: value,
			payload,
			targetType: "",
			targetId: "",
			targetName: "",
		});
	}

	function handlePayloadChange(e: Event) {
		if (!data.onConfigChange) return;
		const target = e.target as HTMLTextAreaElement;
		data.onConfigChange({ ...data.config, payload: target.value });
	}

	function isAlarmAction(t: string): boolean {
		return t === "raise_alarm" || t === "clear_alarm";
	}

	function safeParse(raw: string): Record<string, unknown> {
		try {
			const v = JSON.parse(raw);
			return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
		} catch {
			return {};
		}
	}

	function isRaiseAlarmPayload(raw: string): boolean {
		const p = safeParse(raw);
		return typeof p.alarm_id === "string" && typeof p.severity === "string" && typeof p.kind === "string";
	}

	function isClearAlarmPayload(raw: string): boolean {
		const p = safeParse(raw);
		return typeof p.alarm_id === "string";
	}

	function isRunEffectPayload(raw: string): boolean {
		const p = safeParse(raw);
		return typeof p.effect_id === "string" || typeof p.native_name === "string";
	}

	function updateEffectSelection(key: string) {
		if (!data.onConfigChange) return;
		const ref = effectsList.find((e) => effectRefKey(e) === key);
		if (!ref) return;
		const payload =
			ref.kind === "native"
				? JSON.stringify({ native_name: ref.nativeName })
				: JSON.stringify({ effect_id: ref.id });
		data.onConfigChange({ ...data.config, payload });
	}

	const parsedPayload = $derived(safeParse(data.config.payload));

	function updateRaiseField(field: "alarm_id" | "severity" | "kind" | "message", value: string) {
		if (!data.onConfigChange) return;
		const next = { ...parsedPayload, [field]: value };
		data.onConfigChange({ ...data.config, payload: JSON.stringify(next) });
	}

	function updateClearField(value: string) {
		if (!data.onConfigChange) return;
		data.onConfigChange({ ...data.config, payload: JSON.stringify({ alarm_id: value }) });
	}

	const selectedLabel = $derived(
		actionTypes.find((t) => t.value === data.config.actionType)?.label ?? "Select action",
	);

	// Inline target picker. activate_scene only picks scenes; set_device_state
	// and run_effect pick across devices + groups + rooms (best-effort fan-out
	// downstream).
	const targetItemsList = $derived.by<TargetItem[]>(() => {
		if (data.config.actionType === "activate_scene") {
			return (data.scenes ?? []).map((s) => ({ kind: "scene", id: s.id, name: s.name }));
		}
		const items: TargetItem[] = [];
		for (const d of data.devices ?? []) {
			items.push({ kind: "device", id: d.id, name: d.name, deviceType: d.type });
		}
		for (const g of data.groups ?? []) {
			items.push({ kind: "group", id: g.id, name: g.name });
		}
		for (const r of data.rooms ?? []) {
			items.push({ kind: "room", id: r.id, name: r.name });
		}
		return items;
	});

	const effectsList = $derived(data.effects ?? []);
	const selectedEffectKey = $derived.by(() => {
		const eid = parsedPayload.effect_id;
		if (typeof eid === "string" && eid !== "") return `timeline:${eid}`;
		const nname = parsedPayload.native_name;
		if (typeof nname === "string" && nname !== "") return `native:${nname}`;
		return "";
	});
	const selectedEffectName = $derived.by(() => {
		const ref = effectsList.find((e) => effectRefKey(e) === selectedEffectKey);
		return ref?.name ?? "";
	});

	const selectedTargetKey = $derived(
		data.config.targetId ? `${data.config.targetType}:${data.config.targetId}` : "",
	);

	function handleTargetChange(value: string) {
		if (!data.onConfigChange) return;
		if (!value) return;
		const [kind, ...idParts] = value.split(":");
		const id = idParts.join(":");
		const item = targetItemsList.find((t) => t.kind === kind && t.id === id);
		data.onConfigChange({
			...data.config,
			targetType: kind,
			targetId: id,
			targetName: item?.name ?? "",
		});
	}

	const targetDisplay = $derived(
		data.config.targetName || (data.config.targetId ? `${data.config.targetType}:${data.config.targetId}` : "No target"),
	);

	const severityLabel = $derived(
		SEVERITIES.find((s) => s.value === parsedPayload.severity)?.label ?? "Severity",
	);
	const kindLabel = $derived(
		ALARM_KINDS.find((k) => k.value === parsedPayload.kind)?.label ?? "Kind",
	);
	const validationError = $derived(validateActionConfig(data.config));
	const INVALID_CLS = "border-destructive ring-2 ring-destructive/40";
</script>

<div
	class="w-64 rounded-lg border-2 bg-card shadow-md transition-all {data.activated
		? 'border-automation-action shadow-automation-action/50 shadow-lg'
		: selected
			? 'border-automation-action ring-2 ring-automation-action/30'
			: 'border-automation-action/40'}"
	data-nodeid={id}
>
	<div class="flex items-center gap-2 rounded-t-md bg-automation-action/15 px-3 py-2">
		<Play class="size-4 text-automation-action" />
		<span class="text-sm font-medium text-automation-action">Action</span>
	</div>

	<div class="space-y-2 p-3 nodrag">
		{#if data.editable}
			<Select
				type="single"
				value={data.config.actionType}
				onValueChange={handleActionTypeChange}
			>
				<SelectTrigger class="w-full text-xs">
					{selectedLabel}
				</SelectTrigger>
				<SelectContent>
					{#each actionTypes as actionType (actionType.value)}
						<SelectItem value={actionType.value}>{actionType.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>

			{#if data.config.actionType === "raise_alarm"}
				<Input
					value={(parsedPayload.alarm_id as string) ?? ""}
					oninput={(e) => updateRaiseField("alarm_id", (e.currentTarget as HTMLInputElement).value)}
					placeholder="alarm id (e.g. humidity.high)"
					class="text-xs"
					aria-invalid={validationError?.field === "payload" ? "true" : undefined}
				/>
				<Select
					type="single"
					value={(parsedPayload.severity as string) ?? "medium"}
					onValueChange={(v) => v && updateRaiseField("severity", v)}
				>
					<SelectTrigger class="w-full text-xs">{severityLabel}</SelectTrigger>
					<SelectContent>
						{#each SEVERITIES as s (s.value)}
							<SelectItem value={s.value}>{s.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				<Select
					type="single"
					value={(parsedPayload.kind as string) ?? "auto"}
					onValueChange={(v) => v && updateRaiseField("kind", v)}
				>
					<SelectTrigger class="w-full text-xs">{kindLabel}</SelectTrigger>
					<SelectContent>
						{#each ALARM_KINDS as k (k.value)}
							<SelectItem value={k.value}>{k.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				<Textarea
					value={(parsedPayload.message as string) ?? ""}
					oninput={(e) => updateRaiseField("message", (e.currentTarget as HTMLTextAreaElement).value)}
					placeholder="Message displayed in the alarms page"
					class="min-h-[50px] text-xs"
					rows={2}
				/>
			{:else if data.config.actionType === "clear_alarm"}
				<Input
					value={(parsedPayload.alarm_id as string) ?? ""}
					oninput={(e) => updateClearField((e.currentTarget as HTMLInputElement).value)}
					placeholder="alarm id to delete"
					class="text-xs"
					aria-invalid={validationError?.field === "payload" ? "true" : undefined}
				/>
			{:else}
				<HiveSelectAutocomplete
					items={targetItemsList}
					value={selectedTargetKey}
					getValue={targetKey}
					getLabel={(t) => t.name}
					placeholder={data.config.actionType === "activate_scene" ? "Select scene" : "Select target"}
					size="sm"
					class={validationError?.field === "target" ? `text-xs ${INVALID_CLS}` : "text-xs"}
					onchange={handleTargetChange}
				>
					{#snippet renderSelected(t: TargetItem)}
						<span class="truncate">{t.name}</span>
						{#if t.kind === "device" && t.deviceType}
							<HiveChip type={t.deviceType} class="text-[10px] py-0 shrink-0" />
						{:else}
							<Badge variant="secondary" class="text-[10px] py-0 shrink-0">
								{targetKindLabel[t.kind]}
							</Badge>
						{/if}
					{/snippet}
					{#snippet item(t: TargetItem)}
						<span class="flex w-full items-center gap-1.5 overflow-hidden">
							<span class="truncate">{t.name}</span>
							{#if t.kind === "device" && t.deviceType}
								<HiveChip type={t.deviceType} class="text-[10px] py-0 shrink-0 ml-auto" />
							{:else}
								<Badge variant="secondary" class="text-[10px] py-0 shrink-0 ml-auto">
									{targetKindLabel[t.kind]}
								</Badge>
							{/if}
						</span>
					{/snippet}
				</HiveSelectAutocomplete>

				{#if data.config.actionType === "set_device_state"}
					{#if data.config.targetType && data.config.targetId}
						<DeviceStateEditor
							target={{ type: data.config.targetType as TargetKind, id: data.config.targetId }}
							value={data.config.payload}
							onchange={(payload) =>
								data.onConfigChange?.({ ...data.config, payload })}
							devices={data.devices ?? []}
							groups={data.groups ?? []}
							rooms={data.rooms ?? []}
							disabled={!data.editable}
						/>
					{:else}
						<p class="text-[11px] text-muted-foreground">Pick a target to configure state.</p>
					{/if}
				{:else if data.config.actionType === "run_effect"}
					<Select
						type="single"
						value={selectedEffectKey}
						onValueChange={(v) => v && updateEffectSelection(v)}
					>
						<SelectTrigger class="w-full text-xs">
							{selectedEffectName || "Select effect"}
						</SelectTrigger>
						<SelectContent>
							{#each effectsList as eff (effectRefKey(eff))}
								<SelectItem value={effectRefKey(eff)}>{eff.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				{:else if data.config.actionType !== "activate_scene"}
					<Textarea
						value={data.config.payload}
						oninput={handlePayloadChange}
						placeholder={'{"on": true, "brightness": 254}'}
						class="min-h-[60px] text-xs font-mono"
						rows={2}
					/>
				{/if}
			{/if}
		{:else}
			<p class="text-xs text-foreground">{selectedLabel}</p>
			{#if data.config.actionType === "raise_alarm"}
				<p class="truncate text-xs text-muted-foreground">{(parsedPayload.alarm_id as string) ?? ""}</p>
				<p class="truncate text-xs text-muted-foreground">
					{severityLabel} &middot; {kindLabel}
				</p>
				<p class="truncate text-xs text-muted-foreground">{(parsedPayload.message as string) ?? ""}</p>
			{:else if data.config.actionType === "clear_alarm"}
				<p class="truncate text-xs text-muted-foreground">{(parsedPayload.alarm_id as string) ?? ""}</p>
			{:else if data.config.actionType === "run_effect"}
				<p class="truncate text-xs text-muted-foreground">{targetDisplay}</p>
				<p class="truncate text-xs text-muted-foreground">
					{selectedEffectName || "No effect"}
				</p>
			{:else}
				<p class="truncate text-xs text-muted-foreground">{targetDisplay}</p>
				{#if data.config.actionType !== "activate_scene" && data.config.payload}
					<p class="truncate text-xs font-mono text-muted-foreground">{data.config.payload}</p>
				{/if}
			{/if}
		{/if}
		{#if validationError && data.editable}
			<p class="text-[10px] text-destructive">{validationError.message}</p>
		{/if}
	</div>

	<Handle type="target" position={Position.Left} class="!bg-automation-action !border-automation-action !w-3 !h-3 before:absolute before:inset-[-8px] before:content-['']" />
</div>
