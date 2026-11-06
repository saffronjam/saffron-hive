CREATE VIEW audit_snapshots AS
SELECT 'automations' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'enabled',enabled,'icon',icon,'createdBy',created_by,'definitions',definitions) AS snapshot FROM automations
UNION ALL
SELECT 'scenes' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'icon',icon,'createdBy',created_by) AS snapshot FROM scenes
UNION ALL
SELECT 'effects' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'icon',icon,'kind',kind,'nativeName',native_name,'loop',loop,'createdBy',created_by,'durationMs',duration_ms) AS snapshot FROM effects
UNION ALL
SELECT 'rooms' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'icon',icon,'createdBy',created_by) AS snapshot FROM rooms
UNION ALL
SELECT 'groups' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'friendlyName',friendly_name,'icon',icon,'createdBy',created_by,'provider',provider,'providerGroupId',provider_group_id,'removed',removed,'name',name) AS snapshot FROM groups
UNION ALL
SELECT 'devices' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'friendlyName',friendly_name,'source',source,'type',type,'capabilities',capabilities,'icon',icon,'removed',removed,'disabled',disabled,'displayColor',display_color,'displayBrightness',display_brightness,'controlledLoadRole',controlled_load_role,'contactRole',contact_role,'deleted',deleted) AS snapshot FROM devices
UNION ALL
SELECT 'users' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'username',username,'name',name,'passwordHash',CASE WHEN password_hash IS NULL OR password_hash='' THEN 'unset' ELSE 'configured' END,'avatarPath',avatar_path,'theme',theme,'mustChangePassword',must_change_password,'timeFormat',time_format,'temperatureUnit',temperature_unit,'tokenVersion',token_version,'hapticsEnabled',haptics_enabled,'language',language) AS snapshot FROM users
UNION ALL
SELECT 'guests' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'normalizedName',normalized_name,'expiresAt',expires_at,'language',language) AS snapshot FROM guests
UNION ALL
SELECT 'settings' AS entity_type, CAST(key AS TEXT) AS entity_id, json_object('key',key,'value',CASE WHEN key='jwt.secret' THEN '[redacted]' ELSE value END) AS snapshot FROM settings
UNION ALL
SELECT 'webhook_endpoints' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name,'enabled',enabled,'secretHash',secret_hash,'rateLimitCount',rate_limit_count,'rateLimitWindowMs',rate_limit_window_ms,'createdBy',created_by) AS snapshot FROM webhook_endpoints
UNION ALL
SELECT 'floorplans' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'name',name) AS snapshot FROM floorplans
UNION ALL
SELECT 'zigbee2mqtt_config' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'broker',broker,'username',username,'password',CASE WHEN password IS NULL OR password='' THEN 'unset' ELSE 'configured' END,'useWss',use_wss,'enabled',enabled,'scanScheduleEnabled',scan_schedule_enabled,'scanHour',scan_hour,'scanMinute',scan_minute,'frontendUrl',frontend_url,'interactiveCommandsPerSecond',interactive_commands_per_second,'continuousCommandsPerSecond',continuous_commands_per_second) AS snapshot FROM zigbee2mqtt_config
UNION ALL
SELECT 'tuya_config' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'accessId',access_id,'accessSecret',CASE WHEN access_secret IS NULL OR access_secret='' THEN 'unset' ELSE 'configured' END,'region',region,'enabled',enabled) AS snapshot FROM tuya_config
UNION ALL
SELECT 'claude_config' AS entity_type, CAST(id AS TEXT) AS entity_id, json_object('id',id,'token',CASE WHEN token IS NULL OR token='' THEN 'unset' ELSE 'configured' END,'enabled',enabled,'model',model) AS snapshot FROM claude_config;
