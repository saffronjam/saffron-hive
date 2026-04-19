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
		placeholder = "Search...",
		emptyMessage = "No results found.",
		children,
	}: Props = $props();
</script>

<Sheet bind:open>
	<SheetContent side="right" class="w-full sm:max-w-md">
		<SheetHeader>
			<SheetTitle>{title}</SheetTitle>
			<SheetDescription>{description}</SheetDescription>
		</SheetHeader>
		<div class="mt-4 flex min-h-0 flex-1 flex-col">
			<Command class="flex min-h-0 flex-1 flex-col">
				<CommandInput {placeholder} />
				<CommandList class="max-h-none flex-1">
					<CommandEmpty>{emptyMessage}</CommandEmpty>
					{@render children()}
				</CommandList>
			</Command>
		</div>
	</SheetContent>
</Sheet>
