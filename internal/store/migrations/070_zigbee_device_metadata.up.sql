CREATE TABLE zigbee_device_metadata (
    device_id TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    network_type TEXT,
    ieee_address TEXT,
    network_address INTEGER,
    supported BOOLEAN,
    interview_state TEXT,
    interview_completed BOOLEAN,
    interviewing BOOLEAN,
    description TEXT,
    manufacturer TEXT,
    model_id TEXT,
    power_source TEXT,
    software_build_id TEXT,
    date_code TEXT,
    definition_model TEXT,
    definition_vendor TEXT,
    definition_description TEXT,
    definition_source TEXT,
    definition_icon TEXT,
    definition_supports_ota BOOLEAN,
    endpoints TEXT NOT NULL DEFAULT '[]',
    ota_state TEXT,
    ota_installed_version INTEGER,
    ota_latest_version INTEGER,
    ota_progress REAL,
    bridge_fingerprint TEXT NOT NULL DEFAULT '',
    ota_fingerprint TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zigbee_device_metadata_firmware
ON zigbee_device_metadata(definition_supports_ota, ota_installed_version, ota_latest_version);

ALTER TABLE zigbee2mqtt_config ADD COLUMN frontend_url TEXT;
