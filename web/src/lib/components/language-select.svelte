<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select/index.js";
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant,
	} from "$lib/components/ui/button/index.js";
	import { nativeLanguageName, m, type Language } from "$lib/i18n/messages";
	import { locale, selectableLanguages } from "$lib/i18n/locale.svelte";
	import { cn } from "$lib/utils";
	import { Languages } from "@lucide/svelte";

	interface Props {
		value: Language;
		onchange: (value: Language) => void;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
	}

	let {
		value,
		onchange,
		variant = "outline",
		size = "default",
		class: className,
	}: Props = $props();
</script>

<Select
	type="single"
	{value}
	onValueChange={(next) => {
		if (next && next !== value) onchange(next as Language);
	}}
>
	<SelectTrigger
		aria-label={m.profile_language({}, locale.messageOptions())}
		class={cn(buttonVariants({ variant, size }), "w-auto", className)}
	>
		<Languages />
		{nativeLanguageName(value)}
	</SelectTrigger>
	<SelectContent>
		{#each selectableLanguages as language}
			<SelectItem value={language}>{nativeLanguageName(language)}</SelectItem>
		{/each}
	</SelectContent>
</Select>
