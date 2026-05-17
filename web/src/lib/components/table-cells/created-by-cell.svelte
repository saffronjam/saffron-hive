<script lang="ts">
	import Avatar from "$lib/components/avatar.svelte";

	interface Props {
		user?: { name: string; username?: string; avatarPath?: string | null } | null;
	}

	let { user }: Props = $props();
</script>

{#if user}
	<span class="inline-flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
		<Avatar {user} size="xs" />
		<span>{user.name}</span>
	</span>
{:else}
	<span class="text-sm text-muted-foreground">—</span>
{/if}
