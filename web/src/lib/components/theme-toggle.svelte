<script lang="ts">
	import { Moon, Sun } from "@lucide/svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { theme } from "$lib/stores/theme.js";
</script>

<Button variant="ghost" size="icon" onclick={theme.toggle} aria-label="Toggle theme">
	{#if $theme === "dark"}
		<Sun class="size-5" />
	{:else}
		<Moon class="size-5" />
	{/if}
</Button>
