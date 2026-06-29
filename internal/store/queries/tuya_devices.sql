-- name: UpsertTuyaDevice :exec
INSERT INTO tuya_devices (device_id, local_key, protocol_version, lan_ip, product_id)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(device_id) DO UPDATE SET
    local_key        = excluded.local_key,
    protocol_version = excluded.protocol_version,
    lan_ip           = excluded.lan_ip,
    product_id       = excluded.product_id;

-- name: ListTuyaDevices :many
SELECT device_id, local_key, protocol_version, lan_ip, product_id
FROM tuya_devices;
