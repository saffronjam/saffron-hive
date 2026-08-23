<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import NumberInput from "$lib/components/number-input.svelte";
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import { Plus, X } from "@lucide/svelte";
	import type {
		WebhookFilterOperator,
		WebhookFilterRule,
		WebhookFilterSource,
		WebhookFilterValueType,
	} from "./trigger-expr";

	interface Props {
		rules: WebhookFilterRule[];
		disabled?: boolean;
		invalid?: boolean;
		onchange: (rules: WebhookFilterRule[]) => void;
	}

	let { rules, disabled = false, invalid = false, onchange }: Props = $props();

	const sources: { value: WebhookFilterSource; label: string }[] = [
		{ value: "body", label: "Body" },
		{ value: "query", label: "Query" },
		{ value: "header", label: "Header" },
	];
	const operators: { value: WebhookFilterOperator; label: string }[] = [
		{ value: "exists", label: "Exists" },
		{ value: "not_exists", label: "Does not exist" },
		{ value: "equals", label: "Equals" },
		{ value: "not_equals", label: "Does not equal" },
		{ value: "contains", label: "Contains" },
		{ value: "starts_with", label: "Starts with" },
		{ value: "ends_with", label: "Ends with" },
		{ value: "greater_than", label: "Greater than" },
		{ value: "greater_than_or_equal", label: "At least" },
		{ value: "less_than", label: "Less than" },
		{ value: "less_than_or_equal", label: "At most" },
	];
	const valueTypes: { value: WebhookFilterValueType; label: string }[] = [
		{ value: "string", label: "Text" },
		{ value: "number", label: "Number" },
		{ value: "boolean", label: "Boolean" },
		{ value: "null", label: "Null" },
	];

	function addRule() {
		onchange([
			...rules,
			{ source: "body", path: "", operator: "equals", value_type: "string", value: "" },
		]);
	}

	function updateRule(index: number, patch: Partial<WebhookFilterRule>) {
		onchange(rules.with(index, { ...rules[index], ...patch }));
	}

	function setOperator(index: number, operator: WebhookFilterOperator) {
		if (operator === "exists" || operator === "not_exists") {
			updateRule(index, { operator, value_type: undefined, value: undefined });
			return;
		}
		if (operator.includes("greater") || operator.includes("less")) {
			updateRule(index, { operator, value_type: "number", value: 0 });
			return;
		}
		if (operator === "contains" || operator === "starts_with" || operator === "ends_with") {
			updateRule(index, { operator, value_type: "string", value: "" });
			return;
		}
		updateRule(index, {
			operator,
			value_type: rules[index].value_type ?? "string",
			value: rules[index].value ?? "",
		});
	}

	function setValueType(index: number, valueType: WebhookFilterValueType) {
		const value = valueType === "number" ? 0 : valueType === "boolean" ? true : valueType === "null" ? null : "";
		updateRule(index, { value_type: valueType, value });
	}

	function pathPlaceholder(source: WebhookFilterSource): string {
		if (source === "header") return "X-Event-Type";
		if (source === "query") return "event";
		return "event.status";
	}
</script>

<div class="space-y-2 {invalid ? 'rounded-md ring-2 ring-destructive/40' : ''}">
	{#each rules as rule, index (`${index}-${rule.source}-${rule.operator}`)}
		<div class="space-y-1.5 rounded-md bg-muted/45 p-2">
			<div class="grid grid-cols-[5.5rem_minmax(0,1fr)_1.75rem] gap-1">
				<Select
					type="single"
					value={rule.source}
					{disabled}
					onValueChange={(value) => value && updateRule(index, { source: value as WebhookFilterSource })}
				>
					<SelectTrigger size="sm" class="w-full text-[11px]">
						{sources.find((source) => source.value === rule.source)?.label}
					</SelectTrigger>
					<SelectContent>
						{#each sources as source (source.value)}
							<SelectItem value={source.value}>{source.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
				<Input
					value={rule.path}
					oninput={(event) => updateRule(index, { path: (event.currentTarget as HTMLInputElement).value })}
					placeholder={pathPlaceholder(rule.source)}
					{disabled}
					class="h-8 text-[11px]"
					aria-label="Webhook filter path"
				/>
				<Button
					variant="ghost"
					size="icon-sm"
					{disabled}
					onclick={() => onchange(rules.filter((_, ruleIndex) => ruleIndex !== index))}
					aria-label="Remove webhook filter"
				>
					<X class="size-3.5" />
				</Button>
			</div>
			<Select
				type="single"
				value={rule.operator}
				{disabled}
				onValueChange={(value) => value && setOperator(index, value as WebhookFilterOperator)}
			>
				<SelectTrigger size="sm" class="w-full text-[11px]">
					{operators.find((operator) => operator.value === rule.operator)?.label}
				</SelectTrigger>
				<SelectContent>
					{#each operators as operator (operator.value)}
						<SelectItem value={operator.value}>{operator.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			{#if rule.operator !== "exists" && rule.operator !== "not_exists"}
				<div class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-1">
					<Select
						type="single"
						value={rule.value_type ?? "string"}
						{disabled}
						onValueChange={(value) => value && setValueType(index, value as WebhookFilterValueType)}
					>
						<SelectTrigger size="sm" class="w-full text-[11px]">
							{valueTypes.find((type) => type.value === (rule.value_type ?? "string"))?.label}
						</SelectTrigger>
						<SelectContent>
							{#each valueTypes as valueType (valueType.value)}
								<SelectItem value={valueType.value}>{valueType.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
					{#if rule.value_type === "number"}
						<NumberInput
							allowDecimal
							allowNegative
							value={typeof rule.value === "number" ? rule.value : null}
							onValueChange={(value) => updateRule(index, { value })}
							{disabled}
							class="h-8 text-[11px]"
							ariaLabel="Webhook filter value"
						/>
					{:else if rule.value_type === "boolean"}
						<Select
							type="single"
							value={String(rule.value ?? true)}
							{disabled}
							onValueChange={(value) => value && updateRule(index, { value: value === "true" })}
						>
							<SelectTrigger size="sm" class="w-full text-[11px]">{rule.value === false ? "False" : "True"}</SelectTrigger>
							<SelectContent>
								<SelectItem value="true">True</SelectItem>
								<SelectItem value="false">False</SelectItem>
							</SelectContent>
						</Select>
					{:else if rule.value_type === "null"}
						<div class="flex h-8 items-center rounded-md border border-input px-2 text-[11px] text-muted-foreground">Null</div>
					{:else}
						<Input
							value={typeof rule.value === "string" ? rule.value : ""}
							oninput={(event) => updateRule(index, { value: (event.currentTarget as HTMLInputElement).value })}
							{disabled}
							class="h-8 text-[11px]"
							aria-label="Webhook filter value"
						/>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
	<Button variant="outline" size="sm" class="w-full text-xs" {disabled} onclick={addRule}>
		<Plus class="size-3.5" />
		Add filter
	</Button>
</div>
