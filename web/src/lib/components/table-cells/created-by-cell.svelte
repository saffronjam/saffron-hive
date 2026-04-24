<script lang="ts">
	interface Props {
		name?: string | null;
	}

	let { name }: Props = $props();
</script>

<span class="text-sm text-muted-foreground whitespace-nowrap">{name ?? "—"}</span>
