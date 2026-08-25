-- name: GetZigbeeDeviceMetadata :one
SELECT device_id, network_type, ieee_address, network_address, supported,
       interview_state, interview_completed, interviewing, description,
       manufacturer, model_id, power_source, software_build_id, date_code,
       definition_model, definition_vendor, definition_description,
       definition_source, definition_icon, definition_supports_ota,
       endpoints, ota_state, ota_installed_version, ota_latest_version,
       ota_progress, bridge_fingerprint, ota_fingerprint, updated_at,
       bridge_adapter_type, bridge_firmware_version, bridge_channel,
       bridge_pan_id, bridge_extended_pan_id, bridge_zigbee2mqtt_version,
       bridge_zigbee2mqtt_commit, bridge_herdsman_version,
       bridge_converters_version, bridge_info_fingerprint
FROM zigbee_device_metadata
WHERE device_id = ?;

-- name: UpsertZigbeeBridgeMetadata :one
INSERT INTO zigbee_device_metadata (
    device_id, network_type, ieee_address, network_address, supported,
    interview_state, interview_completed, interviewing, description,
    manufacturer, model_id, power_source, software_build_id, date_code,
    definition_model, definition_vendor, definition_description,
    definition_source, definition_icon, definition_supports_ota,
    endpoints, bridge_fingerprint
) VALUES (
    sqlc.arg('device_id'), sqlc.arg('network_type'), sqlc.arg('ieee_address'),
    sqlc.arg('network_address'), sqlc.arg('supported'), sqlc.arg('interview_state'),
    sqlc.arg('interview_completed'), sqlc.arg('interviewing'), sqlc.arg('description'),
    sqlc.arg('manufacturer'), sqlc.arg('model_id'), sqlc.arg('power_source'),
    sqlc.arg('software_build_id'), sqlc.arg('date_code'), sqlc.arg('definition_model'),
    sqlc.arg('definition_vendor'), sqlc.arg('definition_description'),
    sqlc.arg('definition_source'), sqlc.arg('definition_icon'),
    sqlc.arg('definition_supports_ota'), sqlc.arg('endpoints'),
    sqlc.arg('bridge_fingerprint')
)
ON CONFLICT(device_id) DO UPDATE SET
    network_type = excluded.network_type,
    ieee_address = excluded.ieee_address,
    network_address = excluded.network_address,
    supported = excluded.supported,
    interview_state = excluded.interview_state,
    interview_completed = excluded.interview_completed,
    interviewing = excluded.interviewing,
    description = excluded.description,
    manufacturer = excluded.manufacturer,
    model_id = excluded.model_id,
    power_source = excluded.power_source,
    software_build_id = excluded.software_build_id,
    date_code = excluded.date_code,
    definition_model = excluded.definition_model,
    definition_vendor = excluded.definition_vendor,
    definition_description = excluded.definition_description,
    definition_source = excluded.definition_source,
    definition_icon = excluded.definition_icon,
    definition_supports_ota = excluded.definition_supports_ota,
    endpoints = excluded.endpoints,
    bridge_fingerprint = excluded.bridge_fingerprint,
    updated_at = CURRENT_TIMESTAMP
WHERE zigbee_device_metadata.bridge_fingerprint != excluded.bridge_fingerprint
RETURNING device_id;

-- name: MergeZigbeeBridgeInfo :one
INSERT INTO zigbee_device_metadata (
    device_id, bridge_adapter_type, bridge_firmware_version, bridge_channel,
    bridge_pan_id, bridge_extended_pan_id, bridge_zigbee2mqtt_version,
    bridge_zigbee2mqtt_commit, bridge_herdsman_version,
    bridge_converters_version, bridge_info_fingerprint
) VALUES (
    sqlc.arg('device_id'), sqlc.arg('bridge_adapter_type'),
    sqlc.arg('bridge_firmware_version'), sqlc.arg('bridge_channel'),
    sqlc.arg('bridge_pan_id'), sqlc.arg('bridge_extended_pan_id'),
    sqlc.arg('bridge_zigbee2mqtt_version'), sqlc.arg('bridge_zigbee2mqtt_commit'),
    sqlc.arg('bridge_herdsman_version'), sqlc.arg('bridge_converters_version'),
    sqlc.arg('bridge_info_fingerprint')
)
ON CONFLICT(device_id) DO UPDATE SET
    bridge_adapter_type = excluded.bridge_adapter_type,
    bridge_firmware_version = excluded.bridge_firmware_version,
    bridge_channel = excluded.bridge_channel,
    bridge_pan_id = excluded.bridge_pan_id,
    bridge_extended_pan_id = excluded.bridge_extended_pan_id,
    bridge_zigbee2mqtt_version = excluded.bridge_zigbee2mqtt_version,
    bridge_zigbee2mqtt_commit = excluded.bridge_zigbee2mqtt_commit,
    bridge_herdsman_version = excluded.bridge_herdsman_version,
    bridge_converters_version = excluded.bridge_converters_version,
    bridge_info_fingerprint = excluded.bridge_info_fingerprint,
    updated_at = CURRENT_TIMESTAMP
WHERE zigbee_device_metadata.bridge_info_fingerprint != excluded.bridge_info_fingerprint
RETURNING device_id;

-- name: MergeZigbeeOTAStatus :one
INSERT INTO zigbee_device_metadata (
    device_id, ota_state, ota_installed_version, ota_latest_version,
    ota_progress, ota_fingerprint
) VALUES (
    sqlc.arg('device_id'), sqlc.arg('ota_state'), sqlc.arg('ota_installed_version'),
    sqlc.arg('ota_latest_version'), sqlc.arg('ota_progress'), sqlc.arg('ota_fingerprint')
)
ON CONFLICT(device_id) DO UPDATE SET
    ota_state = excluded.ota_state,
    ota_installed_version = excluded.ota_installed_version,
    ota_latest_version = excluded.ota_latest_version,
    ota_progress = excluded.ota_progress,
    ota_fingerprint = excluded.ota_fingerprint,
    updated_at = CURRENT_TIMESTAMP
WHERE zigbee_device_metadata.ota_fingerprint != excluded.ota_fingerprint
RETURNING device_id;

-- name: ListZigbeeFirmwareCandidates :many
SELECT device_id, network_type, ieee_address, network_address, supported,
       interview_state, interview_completed, interviewing, description,
       manufacturer, model_id, power_source, software_build_id, date_code,
       definition_model, definition_vendor, definition_description,
       definition_source, definition_icon, definition_supports_ota,
       endpoints, ota_state, ota_installed_version, ota_latest_version,
       ota_progress, bridge_fingerprint, ota_fingerprint, updated_at,
       bridge_adapter_type, bridge_firmware_version, bridge_channel,
       bridge_pan_id, bridge_extended_pan_id, bridge_zigbee2mqtt_version,
       bridge_zigbee2mqtt_commit, bridge_herdsman_version,
       bridge_converters_version, bridge_info_fingerprint
FROM zigbee_device_metadata
WHERE definition_supports_ota = true
  AND LOWER(COALESCE(ota_state, '')) = 'available'
  AND ota_latest_version IS NOT NULL
  AND ota_latest_version != -1
ORDER BY device_id;

-- name: ListZigbeeProviderGroupsForDevice :many
SELECT g.id, g.provider_group_id,
       COALESCE(NULLIF(g.name, ''), NULLIF(g.friendly_name, ''), g.id) AS display_name,
       gm.provider_endpoint
FROM groups g
JOIN group_members gm ON gm.group_id = g.id
WHERE g.provider = 'zigbee2mqtt'
  AND g.removed = false
  AND gm.member_type = 'device'
  AND gm.member_id = ?
ORDER BY g.id, gm.provider_endpoint;

-- name: DeleteZigbeeDeviceMetadata :exec
DELETE FROM zigbee_device_metadata WHERE device_id = ?;
