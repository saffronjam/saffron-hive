CREATE TABLE tuya_devices (
    device_id        TEXT PRIMARY KEY,
    local_key        TEXT NOT NULL DEFAULT '',
    protocol_version TEXT NOT NULL DEFAULT '',
    lan_ip           TEXT NOT NULL DEFAULT '',
    product_id       TEXT NOT NULL DEFAULT ''
);
