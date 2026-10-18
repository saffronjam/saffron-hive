# Devices, targets and status

Resolve display names from name override, friendlyName, then id. Inspect device capabilities and state before commands. Disabled and deleted devices cannot be commanded. Removed devices retain references but are absent from their integration. Deletion is Hive-local soft deletion; restoring leaves the device disabled until enabled separately.

setTargetState accepts a target plus a partial state. Discover CommandTargetInput and DeviceStateInput for exact enum values and supported fields. Brightness is 0–254, colour temperature is mireds (1,000,000 / Kelvin), RGB channels are 0–255, transition is seconds. Device capability identifiers use snake_case; domain state fields use camelCase. Do not send unsupported fields. Room/group/selector resolution deduplicates physical devices and excludes runtime-disabled members.

setDeviceConfiguration writes supported configuration attributes; runDeviceCommand runs writable device capabilities. Read device attributes and metadata to discover options and bounds. An accepted command is queued output. Confirmed device state comes from provider reports. Availability, logs, activity and stateHistory provide diagnostics. Query historical data with bounded windows and limits.

Rooms and groups are structural memberships; a device can belong to nested structures. Inspect members before modifying them. Shared memberships must not lead to duplicate physical commands. Floorplan updates replace the full graph: read it first and preserve unmodified IDs and geometry.
