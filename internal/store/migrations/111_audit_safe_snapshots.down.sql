DROP TRIGGER audit_scenes_created;
CREATE TRIGGER audit_scenes_created AFTER INSERT ON scenes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scenes',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_scenes_updated;
CREATE TRIGGER audit_scenes_updated AFTER UPDATE ON scenes WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.icon IS NOT NEW.icon OR OLD.created_by IS NOT NEW.created_by BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scenes',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'createdBy',OLD.created_by),json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_scenes_deleted;
CREATE TRIGGER audit_scenes_deleted AFTER DELETE ON scenes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scenes',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'createdBy',OLD.created_by),'null');
END;
DROP TRIGGER audit_groups_created;
CREATE TRIGGER audit_groups_created AFTER INSERT ON groups BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'groups',CAST(NEW.id AS TEXT),COALESCE(NEW.name, NEW.friendly_name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'friendlyName',NEW.friendly_name,'icon',NEW.icon,'createdBy',NEW.created_by,'provider',NEW.provider,'providerGroupId',NEW.provider_group_id,'removed',NEW.removed,'name',NEW.name));
END;
DROP TRIGGER audit_groups_updated;
CREATE TRIGGER audit_groups_updated AFTER UPDATE ON groups WHEN OLD.id IS NOT NEW.id OR OLD.friendly_name IS NOT NEW.friendly_name OR OLD.icon IS NOT NEW.icon OR OLD.created_by IS NOT NEW.created_by OR OLD.provider IS NOT NEW.provider OR OLD.provider_group_id IS NOT NEW.provider_group_id OR OLD.removed IS NOT NEW.removed OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'groups',CAST(NEW.id AS TEXT),COALESCE(NEW.name, NEW.friendly_name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'friendlyName',OLD.friendly_name,'icon',OLD.icon,'createdBy',OLD.created_by,'provider',OLD.provider,'providerGroupId',OLD.provider_group_id,'removed',OLD.removed,'name',OLD.name),json_object('id',NEW.id,'friendlyName',NEW.friendly_name,'icon',NEW.icon,'createdBy',NEW.created_by,'provider',NEW.provider,'providerGroupId',NEW.provider_group_id,'removed',NEW.removed,'name',NEW.name));
END;
DROP TRIGGER audit_groups_deleted;
CREATE TRIGGER audit_groups_deleted AFTER DELETE ON groups BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'groups',CAST(OLD.id AS TEXT),COALESCE(OLD.name, OLD.friendly_name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'friendlyName',OLD.friendly_name,'icon',OLD.icon,'createdBy',OLD.created_by,'provider',OLD.provider,'providerGroupId',OLD.provider_group_id,'removed',OLD.removed,'name',OLD.name),'null');
END;
DROP TRIGGER audit_automations_created;
CREATE TRIGGER audit_automations_created AFTER INSERT ON automations BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automations',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'enabled',NEW.enabled,'icon',NEW.icon,'createdBy',NEW.created_by,'definitions',NEW.definitions));
END;
DROP TRIGGER audit_automations_updated;
CREATE TRIGGER audit_automations_updated AFTER UPDATE ON automations WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.enabled IS NOT NEW.enabled OR OLD.icon IS NOT NEW.icon OR OLD.created_by IS NOT NEW.created_by OR OLD.definitions IS NOT NEW.definitions BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automations',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'enabled',OLD.enabled,'icon',OLD.icon,'createdBy',OLD.created_by,'definitions',OLD.definitions),json_object('id',NEW.id,'name',NEW.name,'enabled',NEW.enabled,'icon',NEW.icon,'createdBy',NEW.created_by,'definitions',NEW.definitions));
END;
DROP TRIGGER audit_automations_deleted;
CREATE TRIGGER audit_automations_deleted AFTER DELETE ON automations BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automations',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'enabled',OLD.enabled,'icon',OLD.icon,'createdBy',OLD.created_by,'definitions',OLD.definitions),'null');
END;
DROP TRIGGER audit_zigbee2mqtt_config_created;
CREATE TRIGGER audit_zigbee2mqtt_config_created AFTER INSERT ON zigbee2mqtt_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'zigbee2mqtt_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'broker',NEW.broker,'username',NEW.username,'password',CASE WHEN NEW.password IS NULL OR NEW.password='' THEN 'unset' ELSE 'configured' END,'useWss',NEW.use_wss,'enabled',NEW.enabled,'scanScheduleEnabled',NEW.scan_schedule_enabled,'scanHour',NEW.scan_hour,'scanMinute',NEW.scan_minute,'frontendUrl',NEW.frontend_url,'interactiveCommandsPerSecond',NEW.interactive_commands_per_second,'continuousCommandsPerSecond',NEW.continuous_commands_per_second));
END;
DROP TRIGGER audit_zigbee2mqtt_config_updated;
CREATE TRIGGER audit_zigbee2mqtt_config_updated AFTER UPDATE ON zigbee2mqtt_config WHEN OLD.id IS NOT NEW.id OR OLD.broker IS NOT NEW.broker OR OLD.username IS NOT NEW.username OR OLD.password IS NOT NEW.password OR OLD.use_wss IS NOT NEW.use_wss OR OLD.enabled IS NOT NEW.enabled OR OLD.scan_schedule_enabled IS NOT NEW.scan_schedule_enabled OR OLD.scan_hour IS NOT NEW.scan_hour OR OLD.scan_minute IS NOT NEW.scan_minute OR OLD.frontend_url IS NOT NEW.frontend_url OR OLD.interactive_commands_per_second IS NOT NEW.interactive_commands_per_second OR OLD.continuous_commands_per_second IS NOT NEW.continuous_commands_per_second BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'zigbee2mqtt_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'broker',OLD.broker,'username',OLD.username,'password',CASE WHEN OLD.password IS NULL OR OLD.password='' THEN 'unset' ELSE 'configured' END,'useWss',OLD.use_wss,'enabled',OLD.enabled,'scanScheduleEnabled',OLD.scan_schedule_enabled,'scanHour',OLD.scan_hour,'scanMinute',OLD.scan_minute,'frontendUrl',OLD.frontend_url,'interactiveCommandsPerSecond',OLD.interactive_commands_per_second,'continuousCommandsPerSecond',OLD.continuous_commands_per_second),json_object('id',NEW.id,'broker',NEW.broker,'username',NEW.username,'password',CASE WHEN OLD.password IS NOT NEW.password THEN '[changed]' ELSE CASE WHEN NEW.password IS NULL OR NEW.password='' THEN 'unset' ELSE 'configured' END END,'useWss',NEW.use_wss,'enabled',NEW.enabled,'scanScheduleEnabled',NEW.scan_schedule_enabled,'scanHour',NEW.scan_hour,'scanMinute',NEW.scan_minute,'frontendUrl',NEW.frontend_url,'interactiveCommandsPerSecond',NEW.interactive_commands_per_second,'continuousCommandsPerSecond',NEW.continuous_commands_per_second));
END;
DROP TRIGGER audit_zigbee2mqtt_config_deleted;
CREATE TRIGGER audit_zigbee2mqtt_config_deleted AFTER DELETE ON zigbee2mqtt_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'zigbee2mqtt_config',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'broker',OLD.broker,'username',OLD.username,'password',CASE WHEN OLD.password IS NULL OR OLD.password='' THEN 'unset' ELSE 'configured' END,'useWss',OLD.use_wss,'enabled',OLD.enabled,'scanScheduleEnabled',OLD.scan_schedule_enabled,'scanHour',OLD.scan_hour,'scanMinute',OLD.scan_minute,'frontendUrl',OLD.frontend_url,'interactiveCommandsPerSecond',OLD.interactive_commands_per_second,'continuousCommandsPerSecond',OLD.continuous_commands_per_second),'null');
END;
DROP TRIGGER audit_settings_created;
CREATE TRIGGER audit_settings_created AFTER INSERT ON settings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'settings',CAST(NEW.key AS TEXT),CAST(NEW.key AS TEXT),'created','null',json_object('key',NEW.key,'value',CASE WHEN NEW.key='jwt.secret' THEN '[redacted]' ELSE NEW.value END));
END;
DROP TRIGGER audit_settings_updated;
CREATE TRIGGER audit_settings_updated AFTER UPDATE ON settings WHEN OLD.key IS NOT NEW.key OR OLD.value IS NOT NEW.value BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'settings',CAST(NEW.key AS TEXT),CAST(NEW.key AS TEXT),'updated',json_object('key',OLD.key,'value',CASE WHEN OLD.key='jwt.secret' THEN '[redacted]' ELSE OLD.value END),json_object('key',NEW.key,'value',CASE WHEN NEW.key='jwt.secret' THEN '[redacted]' ELSE NEW.value END));
END;
DROP TRIGGER audit_settings_deleted;
CREATE TRIGGER audit_settings_deleted AFTER DELETE ON settings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'settings',CAST(OLD.key AS TEXT),CAST(OLD.key AS TEXT),'deleted',json_object('key',OLD.key,'value',CASE WHEN OLD.key='jwt.secret' THEN '[redacted]' ELSE OLD.value END),'null');
END;
DROP TRIGGER audit_rooms_created;
CREATE TRIGGER audit_rooms_created AFTER INSERT ON rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_rooms_updated;
CREATE TRIGGER audit_rooms_updated AFTER UPDATE ON rooms WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.icon IS NOT NEW.icon OR OLD.created_by IS NOT NEW.created_by BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'createdBy',OLD.created_by),json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_rooms_deleted;
CREATE TRIGGER audit_rooms_deleted AFTER DELETE ON rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'rooms',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'createdBy',OLD.created_by),'null');
END;
DROP TRIGGER audit_users_created;
CREATE TRIGGER audit_users_created AFTER INSERT ON users BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'users',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'username',NEW.username,'name',NEW.name,'passwordHash',CASE WHEN NEW.password_hash IS NULL OR NEW.password_hash='' THEN 'unset' ELSE 'configured' END,'avatarPath',NEW.avatar_path,'theme',NEW.theme,'mustChangePassword',NEW.must_change_password,'timeFormat',NEW.time_format,'temperatureUnit',NEW.temperature_unit,'tokenVersion',NEW.token_version,'hapticsEnabled',NEW.haptics_enabled,'language',NEW.language));
END;
DROP TRIGGER audit_users_updated;
CREATE TRIGGER audit_users_updated AFTER UPDATE ON users WHEN OLD.id IS NOT NEW.id OR OLD.username IS NOT NEW.username OR OLD.name IS NOT NEW.name OR OLD.password_hash IS NOT NEW.password_hash OR OLD.avatar_path IS NOT NEW.avatar_path OR OLD.theme IS NOT NEW.theme OR OLD.must_change_password IS NOT NEW.must_change_password OR OLD.time_format IS NOT NEW.time_format OR OLD.temperature_unit IS NOT NEW.temperature_unit OR OLD.token_version IS NOT NEW.token_version OR OLD.haptics_enabled IS NOT NEW.haptics_enabled OR OLD.language IS NOT NEW.language BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'users',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'username',OLD.username,'name',OLD.name,'passwordHash',CASE WHEN OLD.password_hash IS NULL OR OLD.password_hash='' THEN 'unset' ELSE 'configured' END,'avatarPath',OLD.avatar_path,'theme',OLD.theme,'mustChangePassword',OLD.must_change_password,'timeFormat',OLD.time_format,'temperatureUnit',OLD.temperature_unit,'tokenVersion',OLD.token_version,'hapticsEnabled',OLD.haptics_enabled,'language',OLD.language),json_object('id',NEW.id,'username',NEW.username,'name',NEW.name,'passwordHash',CASE WHEN OLD.password_hash IS NOT NEW.password_hash THEN '[changed]' ELSE CASE WHEN NEW.password_hash IS NULL OR NEW.password_hash='' THEN 'unset' ELSE 'configured' END END,'avatarPath',NEW.avatar_path,'theme',NEW.theme,'mustChangePassword',NEW.must_change_password,'timeFormat',NEW.time_format,'temperatureUnit',NEW.temperature_unit,'tokenVersion',NEW.token_version,'hapticsEnabled',NEW.haptics_enabled,'language',NEW.language));
END;
DROP TRIGGER audit_users_deleted;
CREATE TRIGGER audit_users_deleted AFTER DELETE ON users BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'users',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'username',OLD.username,'name',OLD.name,'passwordHash',CASE WHEN OLD.password_hash IS NULL OR OLD.password_hash='' THEN 'unset' ELSE 'configured' END,'avatarPath',OLD.avatar_path,'theme',OLD.theme,'mustChangePassword',OLD.must_change_password,'timeFormat',OLD.time_format,'temperatureUnit',OLD.temperature_unit,'tokenVersion',OLD.token_version,'hapticsEnabled',OLD.haptics_enabled,'language',OLD.language),'null');
END;
DROP TRIGGER audit_room_members_created;
CREATE TRIGGER audit_room_members_created AFTER INSERT ON room_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'roomId',NEW.room_id,'memberType',NEW.member_type,'memberId',NEW.member_id));
END;
DROP TRIGGER audit_room_members_updated;
CREATE TRIGGER audit_room_members_updated AFTER UPDATE ON room_members WHEN OLD.id IS NOT NEW.id OR OLD.room_id IS NOT NEW.room_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'roomId',OLD.room_id,'memberType',OLD.member_type,'memberId',OLD.member_id),json_object('id',NEW.id,'roomId',NEW.room_id,'memberType',NEW.member_type,'memberId',NEW.member_id));
END;
DROP TRIGGER audit_room_members_deleted;
CREATE TRIGGER audit_room_members_deleted AFTER DELETE ON room_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'roomId',OLD.room_id,'memberType',OLD.member_type,'memberId',OLD.member_id),'null');
END;
DROP TRIGGER audit_effects_created;
CREATE TRIGGER audit_effects_created AFTER INSERT ON effects BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effects',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'kind',NEW.kind,'nativeName',NEW.native_name,'loop',NEW.loop,'createdBy',NEW.created_by,'durationMs',NEW.duration_ms));
END;
DROP TRIGGER audit_effects_updated;
CREATE TRIGGER audit_effects_updated AFTER UPDATE ON effects WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.icon IS NOT NEW.icon OR OLD.kind IS NOT NEW.kind OR OLD.native_name IS NOT NEW.native_name OR OLD.loop IS NOT NEW.loop OR OLD.created_by IS NOT NEW.created_by OR OLD.duration_ms IS NOT NEW.duration_ms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effects',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'kind',OLD.kind,'nativeName',OLD.native_name,'loop',OLD.loop,'createdBy',OLD.created_by,'durationMs',OLD.duration_ms),json_object('id',NEW.id,'name',NEW.name,'icon',NEW.icon,'kind',NEW.kind,'nativeName',NEW.native_name,'loop',NEW.loop,'createdBy',NEW.created_by,'durationMs',NEW.duration_ms));
END;
DROP TRIGGER audit_effects_deleted;
CREATE TRIGGER audit_effects_deleted AFTER DELETE ON effects BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effects',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'icon',OLD.icon,'kind',OLD.kind,'nativeName',OLD.native_name,'loop',OLD.loop,'createdBy',OLD.created_by,'durationMs',OLD.duration_ms),'null');
END;
DROP TRIGGER audit_effect_tracks_created;
CREATE TRIGGER audit_effect_tracks_created AFTER INSERT ON effect_tracks BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'effectId',NEW.effect_id,'trackIndex',NEW.track_index,'name',NEW.name));
END;
DROP TRIGGER audit_effect_tracks_updated;
CREATE TRIGGER audit_effect_tracks_updated AFTER UPDATE ON effect_tracks WHEN OLD.id IS NOT NEW.id OR OLD.effect_id IS NOT NEW.effect_id OR OLD.track_index IS NOT NEW.track_index OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'effectId',OLD.effect_id,'trackIndex',OLD.track_index,'name',OLD.name),json_object('id',NEW.id,'effectId',NEW.effect_id,'trackIndex',NEW.track_index,'name',NEW.name));
END;
DROP TRIGGER audit_effect_tracks_deleted;
CREATE TRIGGER audit_effect_tracks_deleted AFTER DELETE ON effect_tracks BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'effectId',OLD.effect_id,'trackIndex',OLD.track_index,'name',OLD.name),'null');
END;
DROP TRIGGER audit_effect_clips_created;
CREATE TRIGGER audit_effect_clips_created AFTER INSERT ON effect_clips BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_clips',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'trackId',NEW.track_id,'startMs',NEW.start_ms,'transitionMinMs',NEW.transition_min_ms,'transitionMaxMs',NEW.transition_max_ms,'kind',NEW.kind,'config',NEW.config));
END;
DROP TRIGGER audit_effect_clips_updated;
CREATE TRIGGER audit_effect_clips_updated AFTER UPDATE ON effect_clips WHEN OLD.id IS NOT NEW.id OR OLD.track_id IS NOT NEW.track_id OR OLD.start_ms IS NOT NEW.start_ms OR OLD.transition_min_ms IS NOT NEW.transition_min_ms OR OLD.transition_max_ms IS NOT NEW.transition_max_ms OR OLD.kind IS NOT NEW.kind OR OLD.config IS NOT NEW.config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_clips',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'trackId',OLD.track_id,'startMs',OLD.start_ms,'transitionMinMs',OLD.transition_min_ms,'transitionMaxMs',OLD.transition_max_ms,'kind',OLD.kind,'config',OLD.config),json_object('id',NEW.id,'trackId',NEW.track_id,'startMs',NEW.start_ms,'transitionMinMs',NEW.transition_min_ms,'transitionMaxMs',NEW.transition_max_ms,'kind',NEW.kind,'config',NEW.config));
END;
DROP TRIGGER audit_effect_clips_deleted;
CREATE TRIGGER audit_effect_clips_deleted AFTER DELETE ON effect_clips BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_clips',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'trackId',OLD.track_id,'startMs',OLD.start_ms,'transitionMinMs',OLD.transition_min_ms,'transitionMaxMs',OLD.transition_max_ms,'kind',OLD.kind,'config',OLD.config),'null');
END;
DROP TRIGGER audit_group_tags_created;
CREATE TRIGGER audit_group_tags_created AFTER INSERT ON group_tags BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),'created','null',json_object('groupId',NEW.group_id,'tag',NEW.tag));
END;
DROP TRIGGER audit_group_tags_updated;
CREATE TRIGGER audit_group_tags_updated AFTER UPDATE ON group_tags WHEN OLD.group_id IS NOT NEW.group_id OR OLD.tag IS NOT NEW.tag BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),'updated',json_object('groupId',OLD.group_id,'tag',OLD.tag),json_object('groupId',NEW.group_id,'tag',NEW.tag));
END;
DROP TRIGGER audit_group_tags_deleted;
CREATE TRIGGER audit_group_tags_deleted AFTER DELETE ON group_tags BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(OLD.group_id AS TEXT) || ':' || CAST(OLD.tag AS TEXT),CAST(OLD.group_id AS TEXT) || ':' || CAST(OLD.tag AS TEXT),'deleted',json_object('groupId',OLD.group_id,'tag',OLD.tag),'null');
END;
DROP TRIGGER audit_tuya_config_created;
CREATE TRIGGER audit_tuya_config_created AFTER INSERT ON tuya_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'accessId',NEW.access_id,'accessSecret',CASE WHEN NEW.access_secret IS NULL OR NEW.access_secret='' THEN 'unset' ELSE 'configured' END,'region',NEW.region,'enabled',NEW.enabled));
END;
DROP TRIGGER audit_tuya_config_updated;
CREATE TRIGGER audit_tuya_config_updated AFTER UPDATE ON tuya_config WHEN OLD.id IS NOT NEW.id OR OLD.access_id IS NOT NEW.access_id OR OLD.access_secret IS NOT NEW.access_secret OR OLD.region IS NOT NEW.region OR OLD.enabled IS NOT NEW.enabled BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'accessId',OLD.access_id,'accessSecret',CASE WHEN OLD.access_secret IS NULL OR OLD.access_secret='' THEN 'unset' ELSE 'configured' END,'region',OLD.region,'enabled',OLD.enabled),json_object('id',NEW.id,'accessId',NEW.access_id,'accessSecret',CASE WHEN OLD.access_secret IS NOT NEW.access_secret THEN '[changed]' ELSE CASE WHEN NEW.access_secret IS NULL OR NEW.access_secret='' THEN 'unset' ELSE 'configured' END END,'region',NEW.region,'enabled',NEW.enabled));
END;
DROP TRIGGER audit_tuya_config_deleted;
CREATE TRIGGER audit_tuya_config_deleted AFTER DELETE ON tuya_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_config',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'accessId',OLD.access_id,'accessSecret',CASE WHEN OLD.access_secret IS NULL OR OLD.access_secret='' THEN 'unset' ELSE 'configured' END,'region',OLD.region,'enabled',OLD.enabled),'null');
END;
DROP TRIGGER audit_tuya_devices_created;
CREATE TRIGGER audit_tuya_devices_created AFTER INSERT ON tuya_devices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_devices',CAST(NEW.device_id AS TEXT),CAST(NEW.device_id AS TEXT),'created','null',json_object('deviceId',NEW.device_id,'localKey',CASE WHEN NEW.local_key IS NULL OR NEW.local_key='' THEN 'unset' ELSE 'configured' END,'protocolVersion',NEW.protocol_version,'lanIp',NEW.lan_ip,'productId',NEW.product_id));
END;
DROP TRIGGER audit_tuya_devices_updated;
CREATE TRIGGER audit_tuya_devices_updated AFTER UPDATE ON tuya_devices WHEN OLD.device_id IS NOT NEW.device_id OR OLD.local_key IS NOT NEW.local_key OR OLD.protocol_version IS NOT NEW.protocol_version OR OLD.lan_ip IS NOT NEW.lan_ip OR OLD.product_id IS NOT NEW.product_id BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_devices',CAST(NEW.device_id AS TEXT),CAST(NEW.device_id AS TEXT),'updated',json_object('deviceId',OLD.device_id,'localKey',CASE WHEN OLD.local_key IS NULL OR OLD.local_key='' THEN 'unset' ELSE 'configured' END,'protocolVersion',OLD.protocol_version,'lanIp',OLD.lan_ip,'productId',OLD.product_id),json_object('deviceId',NEW.device_id,'localKey',CASE WHEN OLD.local_key IS NOT NEW.local_key THEN '[changed]' ELSE CASE WHEN NEW.local_key IS NULL OR NEW.local_key='' THEN 'unset' ELSE 'configured' END END,'protocolVersion',NEW.protocol_version,'lanIp',NEW.lan_ip,'productId',NEW.product_id));
END;
DROP TRIGGER audit_tuya_devices_deleted;
CREATE TRIGGER audit_tuya_devices_deleted AFTER DELETE ON tuya_devices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'tuya_devices',CAST(OLD.device_id AS TEXT),CAST(OLD.device_id AS TEXT),'deleted',json_object('deviceId',OLD.device_id,'localKey',CASE WHEN OLD.local_key IS NULL OR OLD.local_key='' THEN 'unset' ELSE 'configured' END,'protocolVersion',OLD.protocol_version,'lanIp',OLD.lan_ip,'productId',OLD.product_id),'null');
END;
DROP TRIGGER audit_devices_created;
CREATE TRIGGER audit_devices_created AFTER INSERT ON devices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'devices',CAST(NEW.id AS TEXT),COALESCE(NEW.name, NEW.friendly_name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'friendlyName',NEW.friendly_name,'source',NEW.source,'type',NEW.type,'capabilities',NEW.capabilities,'icon',NEW.icon,'removed',NEW.removed,'disabled',NEW.disabled,'displayColor',NEW.display_color,'displayBrightness',NEW.display_brightness,'controlledLoadRole',NEW.controlled_load_role,'contactRole',NEW.contact_role,'deleted',NEW.deleted));
END;
DROP TRIGGER audit_devices_updated;
CREATE TRIGGER audit_devices_updated AFTER UPDATE ON devices WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.friendly_name IS NOT NEW.friendly_name OR OLD.source IS NOT NEW.source OR OLD.type IS NOT NEW.type OR OLD.capabilities IS NOT NEW.capabilities OR OLD.icon IS NOT NEW.icon OR OLD.removed IS NOT NEW.removed OR OLD.disabled IS NOT NEW.disabled OR OLD.display_color IS NOT NEW.display_color OR OLD.display_brightness IS NOT NEW.display_brightness OR OLD.controlled_load_role IS NOT NEW.controlled_load_role OR OLD.contact_role IS NOT NEW.contact_role OR OLD.deleted IS NOT NEW.deleted BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'devices',CAST(NEW.id AS TEXT),COALESCE(NEW.name, NEW.friendly_name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'friendlyName',OLD.friendly_name,'source',OLD.source,'type',OLD.type,'capabilities',OLD.capabilities,'icon',OLD.icon,'removed',OLD.removed,'disabled',OLD.disabled,'displayColor',OLD.display_color,'displayBrightness',OLD.display_brightness,'controlledLoadRole',OLD.controlled_load_role,'contactRole',OLD.contact_role,'deleted',OLD.deleted),json_object('id',NEW.id,'name',NEW.name,'friendlyName',NEW.friendly_name,'source',NEW.source,'type',NEW.type,'capabilities',NEW.capabilities,'icon',NEW.icon,'removed',NEW.removed,'disabled',NEW.disabled,'displayColor',NEW.display_color,'displayBrightness',NEW.display_brightness,'controlledLoadRole',NEW.controlled_load_role,'contactRole',NEW.contact_role,'deleted',NEW.deleted));
END;
DROP TRIGGER audit_devices_deleted;
CREATE TRIGGER audit_devices_deleted AFTER DELETE ON devices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'devices',CAST(OLD.id AS TEXT),COALESCE(OLD.name, OLD.friendly_name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'friendlyName',OLD.friendly_name,'source',OLD.source,'type',OLD.type,'capabilities',OLD.capabilities,'icon',OLD.icon,'removed',OLD.removed,'disabled',OLD.disabled,'displayColor',OLD.display_color,'displayBrightness',OLD.display_brightness,'controlledLoadRole',OLD.controlled_load_role,'contactRole',OLD.contact_role,'deleted',OLD.deleted),'null');
END;
DROP TRIGGER audit_floorplans_created;
CREATE TRIGGER audit_floorplans_created AFTER INSERT ON floorplans BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplans',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name));
END;
DROP TRIGGER audit_floorplans_updated;
CREATE TRIGGER audit_floorplans_updated AFTER UPDATE ON floorplans WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplans',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name),json_object('id',NEW.id,'name',NEW.name));
END;
DROP TRIGGER audit_floorplans_deleted;
CREATE TRIGGER audit_floorplans_deleted AFTER DELETE ON floorplans BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplans',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name),'null');
END;
DROP TRIGGER audit_floorplan_vertices_created;
CREATE TRIGGER audit_floorplan_vertices_created AFTER INSERT ON floorplan_vertices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'x',NEW.x,'y',NEW.y));
END;
DROP TRIGGER audit_floorplan_vertices_updated;
CREATE TRIGGER audit_floorplan_vertices_updated AFTER UPDATE ON floorplan_vertices WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'x',OLD.x,'y',OLD.y),json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'x',NEW.x,'y',NEW.y));
END;
DROP TRIGGER audit_floorplan_vertices_deleted;
CREATE TRIGGER audit_floorplan_vertices_deleted AFTER DELETE ON floorplan_vertices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'x',OLD.x,'y',OLD.y),'null');
END;
DROP TRIGGER audit_floorplan_walls_created;
CREATE TRIGGER audit_floorplan_walls_created AFTER INSERT ON floorplan_walls BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'vertexA',NEW.vertex_a,'vertexB',NEW.vertex_b,'thickness',NEW.thickness,'curveX',NEW.curve_x,'curveY',NEW.curve_y));
END;
DROP TRIGGER audit_floorplan_walls_updated;
CREATE TRIGGER audit_floorplan_walls_updated AFTER UPDATE ON floorplan_walls WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.vertex_a IS NOT NEW.vertex_a OR OLD.vertex_b IS NOT NEW.vertex_b OR OLD.thickness IS NOT NEW.thickness OR OLD.curve_x IS NOT NEW.curve_x OR OLD.curve_y IS NOT NEW.curve_y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'vertexA',OLD.vertex_a,'vertexB',OLD.vertex_b,'thickness',OLD.thickness,'curveX',OLD.curve_x,'curveY',OLD.curve_y),json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'vertexA',NEW.vertex_a,'vertexB',NEW.vertex_b,'thickness',NEW.thickness,'curveX',NEW.curve_x,'curveY',NEW.curve_y));
END;
DROP TRIGGER audit_floorplan_walls_deleted;
CREATE TRIGGER audit_floorplan_walls_deleted AFTER DELETE ON floorplan_walls BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'vertexA',OLD.vertex_a,'vertexB',OLD.vertex_b,'thickness',OLD.thickness,'curveX',OLD.curve_x,'curveY',OLD.curve_y),'null');
END;
DROP TRIGGER audit_floorplan_rooms_created;
CREATE TRIGGER audit_floorplan_rooms_created AFTER INSERT ON floorplan_rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'name',NEW.name,'roomId',NEW.room_id,'vertexIds',NEW.vertex_ids));
END;
DROP TRIGGER audit_floorplan_rooms_updated;
CREATE TRIGGER audit_floorplan_rooms_updated AFTER UPDATE ON floorplan_rooms WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.name IS NOT NEW.name OR OLD.room_id IS NOT NEW.room_id OR OLD.vertex_ids IS NOT NEW.vertex_ids BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'name',OLD.name,'roomId',OLD.room_id,'vertexIds',OLD.vertex_ids),json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'name',NEW.name,'roomId',NEW.room_id,'vertexIds',NEW.vertex_ids));
END;
DROP TRIGGER audit_floorplan_rooms_deleted;
CREATE TRIGGER audit_floorplan_rooms_deleted AFTER DELETE ON floorplan_rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'name',OLD.name,'roomId',OLD.room_id,'vertexIds',OLD.vertex_ids),'null');
END;
DROP TRIGGER audit_floorplan_placements_created;
CREATE TRIGGER audit_floorplan_placements_created AFTER INSERT ON floorplan_placements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),'created','null',json_object('floorplanId',NEW.floorplan_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'x',NEW.x,'y',NEW.y));
END;
DROP TRIGGER audit_floorplan_placements_updated;
CREATE TRIGGER audit_floorplan_placements_updated AFTER UPDATE ON floorplan_placements WHEN OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),'updated',json_object('floorplanId',OLD.floorplan_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'x',OLD.x,'y',OLD.y),json_object('floorplanId',NEW.floorplan_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'x',NEW.x,'y',NEW.y));
END;
DROP TRIGGER audit_floorplan_placements_deleted;
CREATE TRIGGER audit_floorplan_placements_deleted AFTER DELETE ON floorplan_placements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(OLD.member_type AS TEXT) || ':' || CAST(OLD.member_id AS TEXT),CAST(OLD.member_type AS TEXT) || ':' || CAST(OLD.member_id AS TEXT),'deleted',json_object('floorplanId',OLD.floorplan_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'x',OLD.x,'y',OLD.y),'null');
END;
DROP TRIGGER audit_floorplan_openings_created;
CREATE TRIGGER audit_floorplan_openings_created AFTER INSERT ON floorplan_openings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'wallId',NEW.wall_id,'t',NEW.t,'width',NEW.width,'kind',NEW.kind));
END;
DROP TRIGGER audit_floorplan_openings_updated;
CREATE TRIGGER audit_floorplan_openings_updated AFTER UPDATE ON floorplan_openings WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.wall_id IS NOT NEW.wall_id OR OLD.t IS NOT NEW.t OR OLD.width IS NOT NEW.width OR OLD.kind IS NOT NEW.kind BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'wallId',OLD.wall_id,'t',OLD.t,'width',OLD.width,'kind',OLD.kind),json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'wallId',NEW.wall_id,'t',NEW.t,'width',NEW.width,'kind',NEW.kind));
END;
DROP TRIGGER audit_floorplan_openings_deleted;
CREATE TRIGGER audit_floorplan_openings_deleted AFTER DELETE ON floorplan_openings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'wallId',OLD.wall_id,'t',OLD.t,'width',OLD.width,'kind',OLD.kind),'null');
END;
DROP TRIGGER audit_floorplan_furniture_created;
CREATE TRIGGER audit_floorplan_furniture_created AFTER INSERT ON floorplan_furniture BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'kind',NEW.kind,'x',NEW.x,'y',NEW.y,'width',NEW.width,'height',NEW.height,'rotation',NEW.rotation,'occluder',NEW.occluder));
END;
DROP TRIGGER audit_floorplan_furniture_updated;
CREATE TRIGGER audit_floorplan_furniture_updated AFTER UPDATE ON floorplan_furniture WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.kind IS NOT NEW.kind OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y OR OLD.width IS NOT NEW.width OR OLD.height IS NOT NEW.height OR OLD.rotation IS NOT NEW.rotation OR OLD.occluder IS NOT NEW.occluder BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'kind',OLD.kind,'x',OLD.x,'y',OLD.y,'width',OLD.width,'height',OLD.height,'rotation',OLD.rotation,'occluder',OLD.occluder),json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'kind',NEW.kind,'x',NEW.x,'y',NEW.y,'width',NEW.width,'height',NEW.height,'rotation',NEW.rotation,'occluder',NEW.occluder));
END;
DROP TRIGGER audit_floorplan_furniture_deleted;
CREATE TRIGGER audit_floorplan_furniture_deleted AFTER DELETE ON floorplan_furniture BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'kind',OLD.kind,'x',OLD.x,'y',OLD.y,'width',OLD.width,'height',OLD.height,'rotation',OLD.rotation,'occluder',OLD.occluder),'null');
END;
DROP TRIGGER audit_floorplan_door_bindings_created;
CREATE TRIGGER audit_floorplan_door_bindings_created AFTER INSERT ON floorplan_door_bindings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(NEW.opening_id AS TEXT),CAST(NEW.opening_id AS TEXT),'created','null',json_object('floorplanId',NEW.floorplan_id,'openingId',NEW.opening_id,'deviceId',NEW.device_id,'hingeSide',NEW.hinge_side,'swingSide',NEW.swing_side));
END;
DROP TRIGGER audit_floorplan_door_bindings_updated;
CREATE TRIGGER audit_floorplan_door_bindings_updated AFTER UPDATE ON floorplan_door_bindings WHEN OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.opening_id IS NOT NEW.opening_id OR OLD.device_id IS NOT NEW.device_id OR OLD.hinge_side IS NOT NEW.hinge_side OR OLD.swing_side IS NOT NEW.swing_side BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(NEW.opening_id AS TEXT),CAST(NEW.opening_id AS TEXT),'updated',json_object('floorplanId',OLD.floorplan_id,'openingId',OLD.opening_id,'deviceId',OLD.device_id,'hingeSide',OLD.hinge_side,'swingSide',OLD.swing_side),json_object('floorplanId',NEW.floorplan_id,'openingId',NEW.opening_id,'deviceId',NEW.device_id,'hingeSide',NEW.hinge_side,'swingSide',NEW.swing_side));
END;
DROP TRIGGER audit_floorplan_door_bindings_deleted;
CREATE TRIGGER audit_floorplan_door_bindings_deleted AFTER DELETE ON floorplan_door_bindings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(OLD.opening_id AS TEXT),CAST(OLD.opening_id AS TEXT),'deleted',json_object('floorplanId',OLD.floorplan_id,'openingId',OLD.opening_id,'deviceId',OLD.device_id,'hingeSide',OLD.hinge_side,'swingSide',OLD.swing_side),'null');
END;
DROP TRIGGER audit_group_members_created;
CREATE TRIGGER audit_group_members_created AFTER INSERT ON group_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'groupId',NEW.group_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'providerEndpoint',NEW.provider_endpoint));
END;
DROP TRIGGER audit_group_members_updated;
CREATE TRIGGER audit_group_members_updated AFTER UPDATE ON group_members WHEN OLD.id IS NOT NEW.id OR OLD.group_id IS NOT NEW.group_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id OR OLD.provider_endpoint IS NOT NEW.provider_endpoint BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'groupId',OLD.group_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'providerEndpoint',OLD.provider_endpoint),json_object('id',NEW.id,'groupId',NEW.group_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'providerEndpoint',NEW.provider_endpoint));
END;
DROP TRIGGER audit_group_members_deleted;
CREATE TRIGGER audit_group_members_deleted AFTER DELETE ON group_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'groupId',OLD.group_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'providerEndpoint',OLD.provider_endpoint),'null');
END;
DROP TRIGGER audit_maintenance_acknowledgements_created;
CREATE TRIGGER audit_maintenance_acknowledgements_created AFTER INSERT ON maintenance_acknowledgements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'maintenance_acknowledgements',CAST(NEW.task_key AS TEXT) || ':' || CAST(NEW.condition_fingerprint AS TEXT),CAST(NEW.task_key AS TEXT) || ':' || CAST(NEW.condition_fingerprint AS TEXT),'created','null',json_object('taskKey',NEW.task_key,'conditionFingerprint',NEW.condition_fingerprint,'completedAt',NEW.completed_at,'completedBy',NEW.completed_by));
END;
DROP TRIGGER audit_maintenance_acknowledgements_updated;
CREATE TRIGGER audit_maintenance_acknowledgements_updated AFTER UPDATE ON maintenance_acknowledgements WHEN OLD.task_key IS NOT NEW.task_key OR OLD.condition_fingerprint IS NOT NEW.condition_fingerprint OR OLD.completed_at IS NOT NEW.completed_at OR OLD.completed_by IS NOT NEW.completed_by BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'maintenance_acknowledgements',CAST(NEW.task_key AS TEXT) || ':' || CAST(NEW.condition_fingerprint AS TEXT),CAST(NEW.task_key AS TEXT) || ':' || CAST(NEW.condition_fingerprint AS TEXT),'updated',json_object('taskKey',OLD.task_key,'conditionFingerprint',OLD.condition_fingerprint,'completedAt',OLD.completed_at,'completedBy',OLD.completed_by),json_object('taskKey',NEW.task_key,'conditionFingerprint',NEW.condition_fingerprint,'completedAt',NEW.completed_at,'completedBy',NEW.completed_by));
END;
DROP TRIGGER audit_maintenance_acknowledgements_deleted;
CREATE TRIGGER audit_maintenance_acknowledgements_deleted AFTER DELETE ON maintenance_acknowledgements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'maintenance_acknowledgements',CAST(OLD.task_key AS TEXT) || ':' || CAST(OLD.condition_fingerprint AS TEXT),CAST(OLD.task_key AS TEXT) || ':' || CAST(OLD.condition_fingerprint AS TEXT),'deleted',json_object('taskKey',OLD.task_key,'conditionFingerprint',OLD.condition_fingerprint,'completedAt',OLD.completed_at,'completedBy',OLD.completed_by),'null');
END;
DROP TRIGGER audit_webhook_endpoints_created;
CREATE TRIGGER audit_webhook_endpoints_created AFTER INSERT ON webhook_endpoints BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'webhook_endpoints',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'enabled',NEW.enabled,'secretHash',CASE WHEN NEW.secret_hash IS NULL OR NEW.secret_hash='' THEN 'unset' ELSE 'configured' END,'rateLimitCount',NEW.rate_limit_count,'rateLimitWindowMs',NEW.rate_limit_window_ms,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_webhook_endpoints_updated;
CREATE TRIGGER audit_webhook_endpoints_updated AFTER UPDATE ON webhook_endpoints WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.enabled IS NOT NEW.enabled OR OLD.secret_hash IS NOT NEW.secret_hash OR OLD.rate_limit_count IS NOT NEW.rate_limit_count OR OLD.rate_limit_window_ms IS NOT NEW.rate_limit_window_ms OR OLD.created_by IS NOT NEW.created_by BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'webhook_endpoints',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'enabled',OLD.enabled,'secretHash',CASE WHEN OLD.secret_hash IS NULL OR OLD.secret_hash='' THEN 'unset' ELSE 'configured' END,'rateLimitCount',OLD.rate_limit_count,'rateLimitWindowMs',OLD.rate_limit_window_ms,'createdBy',OLD.created_by),json_object('id',NEW.id,'name',NEW.name,'enabled',NEW.enabled,'secretHash',CASE WHEN OLD.secret_hash IS NOT NEW.secret_hash THEN '[changed]' ELSE CASE WHEN NEW.secret_hash IS NULL OR NEW.secret_hash='' THEN 'unset' ELSE 'configured' END END,'rateLimitCount',NEW.rate_limit_count,'rateLimitWindowMs',NEW.rate_limit_window_ms,'createdBy',NEW.created_by));
END;
DROP TRIGGER audit_webhook_endpoints_deleted;
CREATE TRIGGER audit_webhook_endpoints_deleted AFTER DELETE ON webhook_endpoints BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'webhook_endpoints',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'enabled',OLD.enabled,'secretHash',CASE WHEN OLD.secret_hash IS NULL OR OLD.secret_hash='' THEN 'unset' ELSE 'configured' END,'rateLimitCount',OLD.rate_limit_count,'rateLimitWindowMs',OLD.rate_limit_window_ms,'createdBy',OLD.created_by),'null');
END;
DROP TRIGGER audit_scene_dynamic_sources_created;
CREATE TRIGGER audit_scene_dynamic_sources_created AFTER INSERT ON scene_dynamic_sources BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(NEW.scene_id AS TEXT),CAST(NEW.scene_id AS TEXT),'created','null',json_object('sceneId',NEW.scene_id,'domain',NEW.domain,'sourceKind',NEW.source_kind,'presetId',NEW.preset_id,'guidedSelectedIds',NEW.guided_selected_ids,'seed',NEW.seed,'brightness',NEW.brightness,'movement',NEW.movement,'cycleNanos',NEW.cycle_nanos,'gridWidth',NEW.grid_width,'gridHeight',NEW.grid_height));
END;
DROP TRIGGER audit_scene_dynamic_sources_updated;
CREATE TRIGGER audit_scene_dynamic_sources_updated AFTER UPDATE ON scene_dynamic_sources WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.domain IS NOT NEW.domain OR OLD.source_kind IS NOT NEW.source_kind OR OLD.preset_id IS NOT NEW.preset_id OR OLD.guided_selected_ids IS NOT NEW.guided_selected_ids OR OLD.seed IS NOT NEW.seed OR OLD.brightness IS NOT NEW.brightness OR OLD.movement IS NOT NEW.movement OR OLD.cycle_nanos IS NOT NEW.cycle_nanos OR OLD.grid_width IS NOT NEW.grid_width OR OLD.grid_height IS NOT NEW.grid_height BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(NEW.scene_id AS TEXT),CAST(NEW.scene_id AS TEXT),'updated',json_object('sceneId',OLD.scene_id,'domain',OLD.domain,'sourceKind',OLD.source_kind,'presetId',OLD.preset_id,'guidedSelectedIds',OLD.guided_selected_ids,'seed',OLD.seed,'brightness',OLD.brightness,'movement',OLD.movement,'cycleNanos',OLD.cycle_nanos,'gridWidth',OLD.grid_width,'gridHeight',OLD.grid_height),json_object('sceneId',NEW.scene_id,'domain',NEW.domain,'sourceKind',NEW.source_kind,'presetId',NEW.preset_id,'guidedSelectedIds',NEW.guided_selected_ids,'seed',NEW.seed,'brightness',NEW.brightness,'movement',NEW.movement,'cycleNanos',NEW.cycle_nanos,'gridWidth',NEW.grid_width,'gridHeight',NEW.grid_height));
END;
DROP TRIGGER audit_scene_dynamic_sources_deleted;
CREATE TRIGGER audit_scene_dynamic_sources_deleted AFTER DELETE ON scene_dynamic_sources BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(OLD.scene_id AS TEXT),CAST(OLD.scene_id AS TEXT),'deleted',json_object('sceneId',OLD.scene_id,'domain',OLD.domain,'sourceKind',OLD.source_kind,'presetId',OLD.preset_id,'guidedSelectedIds',OLD.guided_selected_ids,'seed',OLD.seed,'brightness',OLD.brightness,'movement',OLD.movement,'cycleNanos',OLD.cycle_nanos,'gridWidth',OLD.grid_width,'gridHeight',OLD.grid_height),'null');
END;
DROP TRIGGER audit_scene_dynamic_samples_created;
CREATE TRIGGER audit_scene_dynamic_samples_created AFTER INSERT ON scene_dynamic_samples BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),'created','null',json_object('sceneId',NEW.scene_id,'position',NEW.position,'lightness',NEW.lightness,'chroma',NEW.chroma,'hue',NEW.hue,'brightness',NEW.brightness,'mireds',NEW.mireds));
END;
DROP TRIGGER audit_scene_dynamic_samples_updated;
CREATE TRIGGER audit_scene_dynamic_samples_updated AFTER UPDATE ON scene_dynamic_samples WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.position IS NOT NEW.position OR OLD.lightness IS NOT NEW.lightness OR OLD.chroma IS NOT NEW.chroma OR OLD.hue IS NOT NEW.hue OR OLD.brightness IS NOT NEW.brightness OR OLD.mireds IS NOT NEW.mireds BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),'updated',json_object('sceneId',OLD.scene_id,'position',OLD.position,'lightness',OLD.lightness,'chroma',OLD.chroma,'hue',OLD.hue,'brightness',OLD.brightness,'mireds',OLD.mireds),json_object('sceneId',NEW.scene_id,'position',NEW.position,'lightness',NEW.lightness,'chroma',NEW.chroma,'hue',NEW.hue,'brightness',NEW.brightness,'mireds',NEW.mireds));
END;
DROP TRIGGER audit_scene_dynamic_samples_deleted;
CREATE TRIGGER audit_scene_dynamic_samples_deleted AFTER DELETE ON scene_dynamic_samples BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.position AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.position AS TEXT),'deleted',json_object('sceneId',OLD.scene_id,'position',OLD.position,'lightness',OLD.lightness,'chroma',OLD.chroma,'hue',OLD.hue,'brightness',OLD.brightness,'mireds',OLD.mireds),'null');
END;
DROP TRIGGER audit_alarms_created;
CREATE TRIGGER audit_alarms_created AFTER INSERT ON alarms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'alarms',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'alarmId',NEW.alarm_id,'severity',NEW.severity,'kind',NEW.kind,'message',NEW.message,'messageCode',NEW.message_code,'messageArguments',NEW.message_arguments,'source',NEW.source,'raisedAt',NEW.raised_at));
END;
DROP TRIGGER audit_alarms_updated;
CREATE TRIGGER audit_alarms_updated AFTER UPDATE ON alarms WHEN OLD.id IS NOT NEW.id OR OLD.alarm_id IS NOT NEW.alarm_id OR OLD.severity IS NOT NEW.severity OR OLD.kind IS NOT NEW.kind OR OLD.message IS NOT NEW.message OR OLD.message_code IS NOT NEW.message_code OR OLD.message_arguments IS NOT NEW.message_arguments OR OLD.source IS NOT NEW.source OR OLD.raised_at IS NOT NEW.raised_at BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'alarms',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'alarmId',OLD.alarm_id,'severity',OLD.severity,'kind',OLD.kind,'message',OLD.message,'messageCode',OLD.message_code,'messageArguments',OLD.message_arguments,'source',OLD.source,'raisedAt',OLD.raised_at),json_object('id',NEW.id,'alarmId',NEW.alarm_id,'severity',NEW.severity,'kind',NEW.kind,'message',NEW.message,'messageCode',NEW.message_code,'messageArguments',NEW.message_arguments,'source',NEW.source,'raisedAt',NEW.raised_at));
END;
DROP TRIGGER audit_alarms_deleted;
CREATE TRIGGER audit_alarms_deleted AFTER DELETE ON alarms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'alarms',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'alarmId',OLD.alarm_id,'severity',OLD.severity,'kind',OLD.kind,'message',OLD.message,'messageCode',OLD.message_code,'messageArguments',OLD.message_arguments,'source',OLD.source,'raisedAt',OLD.raised_at),'null');
END;
DROP TRIGGER audit_localized_names_created;
CREATE TRIGGER audit_localized_names_created AFTER INSERT ON localized_names BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'localized_names',CAST(NEW.entity_type AS TEXT) || ':' || CAST(NEW.entity_id AS TEXT) || ':' || CAST(NEW.language AS TEXT),CAST(NEW.entity_type AS TEXT) || ':' || CAST(NEW.entity_id AS TEXT) || ':' || CAST(NEW.language AS TEXT),'created','null',json_object('entityType',NEW.entity_type,'entityId',NEW.entity_id,'language',NEW.language,'value',NEW.value));
END;
DROP TRIGGER audit_localized_names_updated;
CREATE TRIGGER audit_localized_names_updated AFTER UPDATE ON localized_names WHEN OLD.entity_type IS NOT NEW.entity_type OR OLD.entity_id IS NOT NEW.entity_id OR OLD.language IS NOT NEW.language OR OLD.value IS NOT NEW.value BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'localized_names',CAST(NEW.entity_type AS TEXT) || ':' || CAST(NEW.entity_id AS TEXT) || ':' || CAST(NEW.language AS TEXT),CAST(NEW.entity_type AS TEXT) || ':' || CAST(NEW.entity_id AS TEXT) || ':' || CAST(NEW.language AS TEXT),'updated',json_object('entityType',OLD.entity_type,'entityId',OLD.entity_id,'language',OLD.language,'value',OLD.value),json_object('entityType',NEW.entity_type,'entityId',NEW.entity_id,'language',NEW.language,'value',NEW.value));
END;
DROP TRIGGER audit_localized_names_deleted;
CREATE TRIGGER audit_localized_names_deleted AFTER DELETE ON localized_names BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'localized_names',CAST(OLD.entity_type AS TEXT) || ':' || CAST(OLD.entity_id AS TEXT) || ':' || CAST(OLD.language AS TEXT),CAST(OLD.entity_type AS TEXT) || ':' || CAST(OLD.entity_id AS TEXT) || ':' || CAST(OLD.language AS TEXT),'deleted',json_object('entityType',OLD.entity_type,'entityId',OLD.entity_id,'language',OLD.language,'value',OLD.value),'null');
END;
DROP TRIGGER audit_scene_targets_created;
CREATE TRIGGER audit_scene_targets_created AFTER INSERT ON scene_targets BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'sceneId',NEW.scene_id,'position',NEW.position,'targetType',NEW.target_type,'targetId',NEW.target_id,'expression',NEW.expression,'name',NEW.name));
END;
DROP TRIGGER audit_scene_targets_updated;
CREATE TRIGGER audit_scene_targets_updated AFTER UPDATE ON scene_targets WHEN OLD.id IS NOT NEW.id OR OLD.scene_id IS NOT NEW.scene_id OR OLD.position IS NOT NEW.position OR OLD.target_type IS NOT NEW.target_type OR OLD.target_id IS NOT NEW.target_id OR OLD.expression IS NOT NEW.expression OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'sceneId',OLD.scene_id,'position',OLD.position,'targetType',OLD.target_type,'targetId',OLD.target_id,'expression',OLD.expression,'name',OLD.name),json_object('id',NEW.id,'sceneId',NEW.scene_id,'position',NEW.position,'targetType',NEW.target_type,'targetId',NEW.target_id,'expression',NEW.expression,'name',NEW.name));
END;
DROP TRIGGER audit_scene_targets_deleted;
CREATE TRIGGER audit_scene_targets_deleted AFTER DELETE ON scene_targets BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'sceneId',OLD.scene_id,'position',OLD.position,'targetType',OLD.target_type,'targetId',OLD.target_id,'expression',OLD.expression,'name',OLD.name),'null');
END;
DROP TRIGGER audit_guests_created;
CREATE TRIGGER audit_guests_created AFTER INSERT ON guests BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'guests',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created','null',json_object('id',NEW.id,'name',NEW.name,'normalizedName',NEW.normalized_name,'expiresAt',NEW.expires_at,'language',NEW.language));
END;
DROP TRIGGER audit_guests_updated;
CREATE TRIGGER audit_guests_updated AFTER UPDATE ON guests WHEN OLD.id IS NOT NEW.id OR OLD.name IS NOT NEW.name OR OLD.normalized_name IS NOT NEW.normalized_name OR OLD.expires_at IS NOT NEW.expires_at OR OLD.language IS NOT NEW.language BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'guests',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',json_object('id',OLD.id,'name',OLD.name,'normalizedName',OLD.normalized_name,'expiresAt',OLD.expires_at,'language',OLD.language),json_object('id',NEW.id,'name',NEW.name,'normalizedName',NEW.normalized_name,'expiresAt',NEW.expires_at,'language',NEW.language));
END;
DROP TRIGGER audit_guests_deleted;
CREATE TRIGGER audit_guests_deleted AFTER DELETE ON guests BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'guests',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',json_object('id',OLD.id,'name',OLD.name,'normalizedName',OLD.normalized_name,'expiresAt',OLD.expires_at,'language',OLD.language),'null');
END;
DROP TRIGGER audit_automation_nodes_created;
CREATE TRIGGER audit_automation_nodes_created AFTER INSERT ON automation_nodes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),'created','null',json_object('automationId',NEW.automation_id,'id',NEW.id,'type',NEW.type,'config',NEW.config,'positionX',NEW.position_x,'positionY',NEW.position_y));
END;
DROP TRIGGER audit_automation_nodes_updated;
CREATE TRIGGER audit_automation_nodes_updated AFTER UPDATE ON automation_nodes WHEN OLD.automation_id IS NOT NEW.automation_id OR OLD.id IS NOT NEW.id OR OLD.type IS NOT NEW.type OR OLD.config IS NOT NEW.config OR OLD.position_x IS NOT NEW.position_x OR OLD.position_y IS NOT NEW.position_y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),'updated',json_object('automationId',OLD.automation_id,'id',OLD.id,'type',OLD.type,'config',OLD.config,'positionX',OLD.position_x,'positionY',OLD.position_y),json_object('automationId',NEW.automation_id,'id',NEW.id,'type',NEW.type,'config',NEW.config,'positionX',NEW.position_x,'positionY',NEW.position_y));
END;
DROP TRIGGER audit_automation_nodes_deleted;
CREATE TRIGGER audit_automation_nodes_deleted AFTER DELETE ON automation_nodes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.id AS TEXT),CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.id AS TEXT),'deleted',json_object('automationId',OLD.automation_id,'id',OLD.id,'type',OLD.type,'config',OLD.config,'positionX',OLD.position_x,'positionY',OLD.position_y),'null');
END;
DROP TRIGGER audit_automation_edges_created;
CREATE TRIGGER audit_automation_edges_created AFTER INSERT ON automation_edges BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),'created','null',json_object('automationId',NEW.automation_id,'fromNodeId',NEW.from_node_id,'toNodeId',NEW.to_node_id));
END;
DROP TRIGGER audit_automation_edges_updated;
CREATE TRIGGER audit_automation_edges_updated AFTER UPDATE ON automation_edges WHEN OLD.automation_id IS NOT NEW.automation_id OR OLD.from_node_id IS NOT NEW.from_node_id OR OLD.to_node_id IS NOT NEW.to_node_id BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),'updated',json_object('automationId',OLD.automation_id,'fromNodeId',OLD.from_node_id,'toNodeId',OLD.to_node_id),json_object('automationId',NEW.automation_id,'fromNodeId',NEW.from_node_id,'toNodeId',NEW.to_node_id));
END;
DROP TRIGGER audit_automation_edges_deleted;
CREATE TRIGGER audit_automation_edges_deleted AFTER DELETE ON automation_edges BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.from_node_id AS TEXT) || ':' || CAST(OLD.to_node_id AS TEXT),CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.from_node_id AS TEXT) || ':' || CAST(OLD.to_node_id AS TEXT),'deleted',json_object('automationId',OLD.automation_id,'fromNodeId',OLD.from_node_id,'toNodeId',OLD.to_node_id),'null');
END;
DROP TRIGGER audit_claude_config_created;
CREATE TRIGGER audit_claude_config_created AFTER INSERT ON claude_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'claude_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created','null',json_object('id',NEW.id,'token',CASE WHEN NEW.token IS NULL OR NEW.token='' THEN 'unset' ELSE 'configured' END,'enabled',NEW.enabled,'model',NEW.model));
END;
DROP TRIGGER audit_claude_config_updated;
CREATE TRIGGER audit_claude_config_updated AFTER UPDATE ON claude_config WHEN OLD.id IS NOT NEW.id OR OLD.token IS NOT NEW.token OR OLD.enabled IS NOT NEW.enabled OR OLD.model IS NOT NEW.model BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'claude_config',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',json_object('id',OLD.id,'token',CASE WHEN OLD.token IS NULL OR OLD.token='' THEN 'unset' ELSE 'configured' END,'enabled',OLD.enabled,'model',OLD.model),json_object('id',NEW.id,'token',CASE WHEN OLD.token IS NOT NEW.token THEN '[changed]' ELSE CASE WHEN NEW.token IS NULL OR NEW.token='' THEN 'unset' ELSE 'configured' END END,'enabled',NEW.enabled,'model',NEW.model));
END;
DROP TRIGGER audit_claude_config_deleted;
CREATE TRIGGER audit_claude_config_deleted AFTER DELETE ON claude_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'claude_config',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',json_object('id',OLD.id,'token',CASE WHEN OLD.token IS NULL OR OLD.token='' THEN 'unset' ELSE 'configured' END,'enabled',OLD.enabled,'model',OLD.model),'null');
END;
DROP TRIGGER audit_scene_light_overrides_created;
CREATE TRIGGER audit_scene_light_overrides_created AFTER INSERT ON scene_light_overrides BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'created','null',json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'kind',NEW.kind,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing,'effectId',NEW.effect_id,'nativeEffectName',NEW.native_effect_name));
END;
DROP TRIGGER audit_scene_light_overrides_updated;
CREATE TRIGGER audit_scene_light_overrides_updated AFTER UPDATE ON scene_light_overrides WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.device_id IS NOT NEW.device_id OR OLD.kind IS NOT NEW.kind OR OLD.on_state IS NOT NEW.on_state OR OLD.brightness IS NOT NEW.brightness OR OLD.color_temp IS NOT NEW.color_temp OR OLD.color_r IS NOT NEW.color_r OR OLD.color_g IS NOT NEW.color_g OR OLD.color_b IS NOT NEW.color_b OR OLD.color_x IS NOT NEW.color_x OR OLD.color_y IS NOT NEW.color_y OR OLD.transition IS NOT NEW.transition OR OLD.target_temperature IS NOT NEW.target_temperature OR OLD.hvac_mode IS NOT NEW.hvac_mode OR OLD.fan_mode IS NOT NEW.fan_mode OR OLD.swing IS NOT NEW.swing OR OLD.effect_id IS NOT NEW.effect_id OR OLD.native_effect_name IS NOT NEW.native_effect_name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'updated',json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'kind',OLD.kind,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing,'effectId',OLD.effect_id,'nativeEffectName',OLD.native_effect_name),json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'kind',NEW.kind,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing,'effectId',NEW.effect_id,'nativeEffectName',NEW.native_effect_name));
END;
DROP TRIGGER audit_scene_light_overrides_deleted;
CREATE TRIGGER audit_scene_light_overrides_deleted AFTER DELETE ON scene_light_overrides BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),'deleted',json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'kind',OLD.kind,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing,'effectId',OLD.effect_id,'nativeEffectName',OLD.native_effect_name),'null');
END;
DROP TRIGGER audit_scene_supporting_states_created;
CREATE TRIGGER audit_scene_supporting_states_created AFTER INSERT ON scene_supporting_states BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'created','null',json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing));
END;
DROP TRIGGER audit_scene_supporting_states_updated;
CREATE TRIGGER audit_scene_supporting_states_updated AFTER UPDATE ON scene_supporting_states WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.device_id IS NOT NEW.device_id OR OLD.on_state IS NOT NEW.on_state OR OLD.brightness IS NOT NEW.brightness OR OLD.color_temp IS NOT NEW.color_temp OR OLD.color_r IS NOT NEW.color_r OR OLD.color_g IS NOT NEW.color_g OR OLD.color_b IS NOT NEW.color_b OR OLD.color_x IS NOT NEW.color_x OR OLD.color_y IS NOT NEW.color_y OR OLD.transition IS NOT NEW.transition OR OLD.target_temperature IS NOT NEW.target_temperature OR OLD.hvac_mode IS NOT NEW.hvac_mode OR OLD.fan_mode IS NOT NEW.fan_mode OR OLD.swing IS NOT NEW.swing BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'updated',json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing),json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing));
END;
DROP TRIGGER audit_scene_supporting_states_deleted;
CREATE TRIGGER audit_scene_supporting_states_deleted AFTER DELETE ON scene_supporting_states BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),'deleted',json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing),'null');
END;
