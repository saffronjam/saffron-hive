<script lang="ts">
	import { auth } from "$lib/stores/auth.svelte";
	import { cachedDeviceImage, cacheDeviceImage } from "$lib/device-image-cache";
	import { onDestroy } from "svelte";

	interface Props {
		deviceId: string;
		version: string;
		alt: string;
		onavailability?: (available: boolean) => void;
	}

	let { deviceId, version, alt, onavailability }: Props = $props();
	let objectURL = $state<string | null>(null);
	let loaded = $state(false);
	let animateOnLoad = $state(true);
	let controller: AbortController | null = null;
	let requestKey = "";

	function clearObjectURL() {
		if (objectURL) URL.revokeObjectURL(objectURL);
		objectURL = null;
		loaded = false;
	}

	async function load(id: string, imageVersion: string) {
		controller?.abort();
		controller = new AbortController();
		clearObjectURL();
		const url = `/api/device-images/${encodeURIComponent(id)}?v=${encodeURIComponent(imageVersion)}`;
		try {
			let response = await cachedDeviceImage(url);
			animateOnLoad = response == null;
			if (!response) {
				response = await fetch(url, {
					headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
					signal: controller.signal,
				});
				if (response.ok) void cacheDeviceImage(url, response);
			}
			if (!response.ok) {
				onavailability?.(false);
				return;
			}
			objectURL = URL.createObjectURL(await response.blob());
			if (!animateOnLoad) loaded = true;
		} catch (error) {
			if (!(error instanceof DOMException && error.name === "AbortError")) {
				onavailability?.(false);
			}
		}
	}

	$effect(() => {
		const key = `${deviceId}\u0000${version}`;
		if (key === requestKey) return;
		requestKey = key;
		void load(deviceId, version);
	});

	onDestroy(() => {
		controller?.abort();
		clearObjectURL();
	});
</script>

{#if objectURL}
	<img
		src={objectURL}
		{alt}
		class="h-44 w-full object-contain lg:h-56 {animateOnLoad ? 'transition-opacity duration-300 motion-reduce:transition-none' : ''} {loaded ? 'opacity-100' : 'opacity-0'}"
		onload={() => {
			loaded = true;
			onavailability?.(true);
		}}
		onerror={() => {
			clearObjectURL();
			onavailability?.(false);
		}}
	/>
{:else}
	<div class="h-44 w-full lg:h-56" aria-hidden="true"></div>
{/if}
