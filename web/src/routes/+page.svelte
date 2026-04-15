<script lang="ts">
	import {
		deviceStore,
		isLightState,
		isSensorState,
		isSwitchState,
		type Device
	} from '$lib/stores/devices';

	const devices = $derived(Object.values($deviceStore));

	function statusColor(device: Device): string {
		return device.available ? 'bg-success' : 'bg-danger';
	}

	function deviceIcon(type: string): string {
		switch (type) {
			case 'light':
				return '💡';
			case 'sensor':
				return '🌡️';
			case 'switch':
				return '🔘';
			default:
				return '📦';
		}
	}
</script>

<div>
	<h1 class="mb-6 text-2xl font-semibold">Dashboard</h1>

	{#if devices.length === 0}
		<div class="rounded-lg border border-border bg-surface-raised p-12 text-center">
			<p class="text-text-secondary">No devices discovered yet.</p>
			<p class="mt-2 text-sm text-text-secondary">
				Devices will appear here once the backend connects to your MQTT broker.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each devices as device (device.id)}
				{@const light = isLightState(device.state) ? device.state : null}
				{@const sensor = isSensorState(device.state) ? device.state : null}
				{@const sw = isSwitchState(device.state) ? device.state : null}
				<div class="rounded-lg border border-border bg-surface-raised p-4 transition-colors hover:bg-surface-overlay">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-lg">{deviceIcon(device.type)}</span>
						<span class="h-2.5 w-2.5 rounded-full {statusColor(device)}"></span>
					</div>

					<h3 class="mb-1 font-medium text-text-primary">{device.name}</h3>
					<p class="mb-3 text-xs text-text-secondary">{device.type} &middot; {device.source}</p>

					{#if light}
						<div class="space-y-2 text-sm">
							<div class="flex items-center justify-between">
								<span class="text-text-secondary">Power</span>
								<span class={light.on ? 'text-success' : 'text-text-secondary'}>
									{light.on ? 'On' : 'Off'}
								</span>
							</div>
							{#if light.brightness != null}
								<div class="flex items-center justify-between">
									<span class="text-text-secondary">Brightness</span>
									<span class="text-text-primary">{Math.round((light.brightness / 254) * 100)}%</span>
								</div>
								<div class="h-1.5 rounded-full bg-surface-overlay">
									<div
										class="h-1.5 rounded-full bg-accent"
										style="width: {(light.brightness / 254) * 100}%"
									></div>
								</div>
							{/if}
						</div>
					{:else if sensor}
						<div class="space-y-1 text-sm">
							{#if sensor.temperature != null}
								<div class="flex items-center justify-between">
									<span class="text-text-secondary">Temperature</span>
									<span class="text-text-primary">{sensor.temperature.toFixed(1)}&deg;C</span>
								</div>
							{/if}
							{#if sensor.humidity != null}
								<div class="flex items-center justify-between">
									<span class="text-text-secondary">Humidity</span>
									<span class="text-text-primary">{sensor.humidity.toFixed(1)}%</span>
								</div>
							{/if}
							{#if sensor.battery != null}
								<div class="flex items-center justify-between">
									<span class="text-text-secondary">Battery</span>
									<span class={sensor.battery < 20 ? 'text-warning' : 'text-text-primary'}>
										{sensor.battery}%
									</span>
								</div>
							{/if}
						</div>
					{:else if sw}
						<div class="text-sm">
							<div class="flex items-center justify-between">
								<span class="text-text-secondary">Last action</span>
								<span class="text-text-primary">{sw.action ?? 'none'}</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
