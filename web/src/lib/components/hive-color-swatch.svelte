<script lang="ts">
	interface Props {
		color?: string | null;
		class?: string;
	}

	let { color, class: className = "" }: Props = $props();
</script>

<span
	class="inline-block h-5 w-5 shrink-0 rounded-full align-middle {color ? '' : 'bg-muted'} {className}"
	style={color ? `background: ${color};` : ""}
></span>
