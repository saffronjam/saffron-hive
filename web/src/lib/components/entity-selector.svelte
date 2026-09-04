<script lang="ts">
	import type { Snippet } from "svelte";
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription,
	} from "$lib/components/ui/sheet/index.js";
	import {
		Command,
		CommandEmpty,
		CommandInput,
		CommandList,
	} from "$lib/components/ui/command/index.js";
	import { m } from "$lib/i18n/messages";
	import { locale } from "$lib/i18n/locale.svelte";

	interface Props {
		open: boolean;
		title: string;
		description: string;
		placeholder?: string;
		emptyMessage?: string;
		children: Snippet;
	}

	let {
		open = $bindable(false),
		title,
		description,
		placeholder,
		emptyMessage,
		children,
	}: Props = $props();

	const resolvedPlaceholder = $derived(
		placeholder ?? m.common_search({}, locale.messageOptions()),
	);
	const resolvedEmptyMessage = $derived(
		emptyMessage ?? m.shared_no_results_found({}, locale.messageOptions()),
	);

	let activeItem = $state("");
</script>

<Sheet bind:open>
	<SheetContent side="right" class="w-full sm:max-w-md">
		<SheetHeader>
			<SheetTitle>{title}</SheetTitle>
			<SheetDescription>{description}</SheetDescription>
		</SheetHeader>
		<div class="mt-4 flex min-h-0 flex-1 flex-col">
			<Command bind:value={activeItem} class="flex min-h-0 flex-1 flex-col">
				<CommandInput placeholder={resolvedPlaceholder} />
				<CommandList class="max-h-none flex-1" onpointerleave={() => (activeItem = "")}>
					<CommandEmpty>{resolvedEmptyMessage}</CommandEmpty>
					{@render children()}
				</CommandList>
			</Command>
		</div>
	</SheetContent>
</Sheet>
