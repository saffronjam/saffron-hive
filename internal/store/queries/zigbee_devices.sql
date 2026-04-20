-- name: RegisterZigbeeDevice :exec
INSERT INTO zigbee_devices (device_id, ieee_address, friendly_name)
VALUES (?, ?, ?);

-- name: UpsertZigbeeDevice :exec
INSERT INTO zigbee_devices (device_id, ieee_address, friendly_name)
VALUES (?, ?, ?)
ON CONFLICT(device_id) DO UPDATE SET
    ieee_address  = excluded.ieee_address,
    friendly_name = excluded.friendly_name;

-- name: GetZigbeeDeviceByIEEEAddress :one
SELECT device_id, ieee_address, friendly_name
FROM zigbee_devices
WHERE ieee_address = ?;

-- name: GetZigbeeDeviceByFriendlyName :one
SELECT device_id, ieee_address, friendly_name
FROM zigbee_devices
WHERE friendly_name = ?;
