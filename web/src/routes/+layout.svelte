<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/scenes', label: 'Scenes' },
		{ href: '/automations', label: 'Automations' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Saffron Hive</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<nav class="border-b border-border bg-surface-raised">
		<div class="mx-auto flex max-w-7xl items-center gap-8 px-6 py-4">
			<a href="/" class="text-lg font-semibold text-accent">Saffron Hive</a>
			<div class="flex gap-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-overlay hover:text-text-primary"
					>
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<main class="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
		{@render children()}
	</main>
</div>
