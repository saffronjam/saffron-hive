DROP TRIGGER audit_room_members_created;
CREATE TRIGGER audit_room_members_created AFTER INSERT ON room_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'roomId',NEW.room_id,'memberType',NEW.member_type,'memberId',NEW.member_id)));
END;
DROP TRIGGER audit_room_members_updated;
CREATE TRIGGER audit_room_members_updated AFTER UPDATE ON room_members WHEN OLD.id IS NOT NEW.id OR OLD.room_id IS NOT NEW.room_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'roomId',OLD.room_id,'memberType',OLD.member_type,'memberId',OLD.member_id)),audit_json(json_object('id',NEW.id,'roomId',NEW.room_id,'memberType',NEW.member_type,'memberId',NEW.member_id)));
END;
DROP TRIGGER audit_room_members_deleted;
CREATE TRIGGER audit_room_members_deleted AFTER DELETE ON room_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'room_members',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'roomId',OLD.room_id,'memberType',OLD.member_type,'memberId',OLD.member_id)),audit_json('null'));
END;
DROP TRIGGER audit_effect_tracks_created;
CREATE TRIGGER audit_effect_tracks_created AFTER INSERT ON effect_tracks BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'effectId',NEW.effect_id,'trackIndex',NEW.track_index,'name',NEW.name)));
END;
DROP TRIGGER audit_effect_tracks_updated;
CREATE TRIGGER audit_effect_tracks_updated AFTER UPDATE ON effect_tracks WHEN OLD.id IS NOT NEW.id OR OLD.effect_id IS NOT NEW.effect_id OR OLD.track_index IS NOT NEW.track_index OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',audit_json(json_object('id',OLD.id,'effectId',OLD.effect_id,'trackIndex',OLD.track_index,'name',OLD.name)),audit_json(json_object('id',NEW.id,'effectId',NEW.effect_id,'trackIndex',NEW.track_index,'name',NEW.name)));
END;
DROP TRIGGER audit_effect_tracks_deleted;
CREATE TRIGGER audit_effect_tracks_deleted AFTER DELETE ON effect_tracks BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'effect_tracks',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',audit_json(json_object('id',OLD.id,'effectId',OLD.effect_id,'trackIndex',OLD.track_index,'name',OLD.name)),audit_json('null'));
END;
DROP TRIGGER audit_group_tags_created;
CREATE TRIGGER audit_group_tags_created AFTER INSERT ON group_tags BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),'created',audit_json('null'),audit_json(json_object('groupId',NEW.group_id,'tag',NEW.tag)));
END;
DROP TRIGGER audit_group_tags_updated;
CREATE TRIGGER audit_group_tags_updated AFTER UPDATE ON group_tags WHEN OLD.group_id IS NOT NEW.group_id OR OLD.tag IS NOT NEW.tag BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),CAST(NEW.group_id AS TEXT) || ':' || CAST(NEW.tag AS TEXT),'updated',audit_json(json_object('groupId',OLD.group_id,'tag',OLD.tag)),audit_json(json_object('groupId',NEW.group_id,'tag',NEW.tag)));
END;
DROP TRIGGER audit_group_tags_deleted;
CREATE TRIGGER audit_group_tags_deleted AFTER DELETE ON group_tags BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_tags',CAST(OLD.group_id AS TEXT) || ':' || CAST(OLD.tag AS TEXT),CAST(OLD.group_id AS TEXT) || ':' || CAST(OLD.tag AS TEXT),'deleted',audit_json(json_object('groupId',OLD.group_id,'tag',OLD.tag)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_vertices_created;
CREATE TRIGGER audit_floorplan_vertices_created AFTER INSERT ON floorplan_vertices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'x',NEW.x,'y',NEW.y)));
END;
DROP TRIGGER audit_floorplan_vertices_updated;
CREATE TRIGGER audit_floorplan_vertices_updated AFTER UPDATE ON floorplan_vertices WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'x',OLD.x,'y',OLD.y)),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'x',NEW.x,'y',NEW.y)));
END;
DROP TRIGGER audit_floorplan_vertices_deleted;
CREATE TRIGGER audit_floorplan_vertices_deleted AFTER DELETE ON floorplan_vertices BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_vertices',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'x',OLD.x,'y',OLD.y)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_walls_created;
CREATE TRIGGER audit_floorplan_walls_created AFTER INSERT ON floorplan_walls BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'vertexA',NEW.vertex_a,'vertexB',NEW.vertex_b,'thickness',NEW.thickness,'curveX',NEW.curve_x,'curveY',NEW.curve_y)));
END;
DROP TRIGGER audit_floorplan_walls_updated;
CREATE TRIGGER audit_floorplan_walls_updated AFTER UPDATE ON floorplan_walls WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.vertex_a IS NOT NEW.vertex_a OR OLD.vertex_b IS NOT NEW.vertex_b OR OLD.thickness IS NOT NEW.thickness OR OLD.curve_x IS NOT NEW.curve_x OR OLD.curve_y IS NOT NEW.curve_y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'vertexA',OLD.vertex_a,'vertexB',OLD.vertex_b,'thickness',OLD.thickness,'curveX',OLD.curve_x,'curveY',OLD.curve_y)),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'vertexA',NEW.vertex_a,'vertexB',NEW.vertex_b,'thickness',NEW.thickness,'curveX',NEW.curve_x,'curveY',NEW.curve_y)));
END;
DROP TRIGGER audit_floorplan_walls_deleted;
CREATE TRIGGER audit_floorplan_walls_deleted AFTER DELETE ON floorplan_walls BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_walls',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'vertexA',OLD.vertex_a,'vertexB',OLD.vertex_b,'thickness',OLD.thickness,'curveX',OLD.curve_x,'curveY',OLD.curve_y)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_rooms_created;
CREATE TRIGGER audit_floorplan_rooms_created AFTER INSERT ON floorplan_rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'name',NEW.name,'roomId',NEW.room_id,'vertexIds',NEW.vertex_ids)));
END;
DROP TRIGGER audit_floorplan_rooms_updated;
CREATE TRIGGER audit_floorplan_rooms_updated AFTER UPDATE ON floorplan_rooms WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.name IS NOT NEW.name OR OLD.room_id IS NOT NEW.room_id OR OLD.vertex_ids IS NOT NEW.vertex_ids BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'name',OLD.name,'roomId',OLD.room_id,'vertexIds',OLD.vertex_ids)),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'name',NEW.name,'roomId',NEW.room_id,'vertexIds',NEW.vertex_ids)));
END;
DROP TRIGGER audit_floorplan_rooms_deleted;
CREATE TRIGGER audit_floorplan_rooms_deleted AFTER DELETE ON floorplan_rooms BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_rooms',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'name',OLD.name,'roomId',OLD.room_id,'vertexIds',OLD.vertex_ids)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_placements_created;
CREATE TRIGGER audit_floorplan_placements_created AFTER INSERT ON floorplan_placements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),'created',audit_json('null'),audit_json(json_object('floorplanId',NEW.floorplan_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'x',NEW.x,'y',NEW.y)));
END;
DROP TRIGGER audit_floorplan_placements_updated;
CREATE TRIGGER audit_floorplan_placements_updated AFTER UPDATE ON floorplan_placements WHEN OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),CAST(NEW.member_type AS TEXT) || ':' || CAST(NEW.member_id AS TEXT),'updated',audit_json(json_object('floorplanId',OLD.floorplan_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'x',OLD.x,'y',OLD.y)),audit_json(json_object('floorplanId',NEW.floorplan_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'x',NEW.x,'y',NEW.y)));
END;
DROP TRIGGER audit_floorplan_placements_deleted;
CREATE TRIGGER audit_floorplan_placements_deleted AFTER DELETE ON floorplan_placements BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_placements',CAST(OLD.member_type AS TEXT) || ':' || CAST(OLD.member_id AS TEXT),CAST(OLD.member_type AS TEXT) || ':' || CAST(OLD.member_id AS TEXT),'deleted',audit_json(json_object('floorplanId',OLD.floorplan_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'x',OLD.x,'y',OLD.y)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_openings_created;
CREATE TRIGGER audit_floorplan_openings_created AFTER INSERT ON floorplan_openings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'wallId',NEW.wall_id,'t',NEW.t,'width',NEW.width,'kind',NEW.kind)));
END;
DROP TRIGGER audit_floorplan_openings_updated;
CREATE TRIGGER audit_floorplan_openings_updated AFTER UPDATE ON floorplan_openings WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.wall_id IS NOT NEW.wall_id OR OLD.t IS NOT NEW.t OR OLD.width IS NOT NEW.width OR OLD.kind IS NOT NEW.kind BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'wallId',OLD.wall_id,'t',OLD.t,'width',OLD.width,'kind',OLD.kind)),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'wallId',NEW.wall_id,'t',NEW.t,'width',NEW.width,'kind',NEW.kind)));
END;
DROP TRIGGER audit_floorplan_openings_deleted;
CREATE TRIGGER audit_floorplan_openings_deleted AFTER DELETE ON floorplan_openings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_openings',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'wallId',OLD.wall_id,'t',OLD.t,'width',OLD.width,'kind',OLD.kind)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_furniture_created;
CREATE TRIGGER audit_floorplan_furniture_created AFTER INSERT ON floorplan_furniture BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'kind',NEW.kind,'x',NEW.x,'y',NEW.y,'width',NEW.width,'height',NEW.height,'rotation',NEW.rotation,'occluder',NEW.occluder)));
END;
DROP TRIGGER audit_floorplan_furniture_updated;
CREATE TRIGGER audit_floorplan_furniture_updated AFTER UPDATE ON floorplan_furniture WHEN OLD.id IS NOT NEW.id OR OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.kind IS NOT NEW.kind OR OLD.x IS NOT NEW.x OR OLD.y IS NOT NEW.y OR OLD.width IS NOT NEW.width OR OLD.height IS NOT NEW.height OR OLD.rotation IS NOT NEW.rotation OR OLD.occluder IS NOT NEW.occluder BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'kind',OLD.kind,'x',OLD.x,'y',OLD.y,'width',OLD.width,'height',OLD.height,'rotation',OLD.rotation,'occluder',OLD.occluder)),audit_json(json_object('id',NEW.id,'floorplanId',NEW.floorplan_id,'kind',NEW.kind,'x',NEW.x,'y',NEW.y,'width',NEW.width,'height',NEW.height,'rotation',NEW.rotation,'occluder',NEW.occluder)));
END;
DROP TRIGGER audit_floorplan_furniture_deleted;
CREATE TRIGGER audit_floorplan_furniture_deleted AFTER DELETE ON floorplan_furniture BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_furniture',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'floorplanId',OLD.floorplan_id,'kind',OLD.kind,'x',OLD.x,'y',OLD.y,'width',OLD.width,'height',OLD.height,'rotation',OLD.rotation,'occluder',OLD.occluder)),audit_json('null'));
END;
DROP TRIGGER audit_floorplan_door_bindings_created;
CREATE TRIGGER audit_floorplan_door_bindings_created AFTER INSERT ON floorplan_door_bindings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(NEW.opening_id AS TEXT),CAST(NEW.opening_id AS TEXT),'created',audit_json('null'),audit_json(json_object('floorplanId',NEW.floorplan_id,'openingId',NEW.opening_id,'deviceId',NEW.device_id,'hingeSide',NEW.hinge_side,'swingSide',NEW.swing_side)));
END;
DROP TRIGGER audit_floorplan_door_bindings_updated;
CREATE TRIGGER audit_floorplan_door_bindings_updated AFTER UPDATE ON floorplan_door_bindings WHEN OLD.floorplan_id IS NOT NEW.floorplan_id OR OLD.opening_id IS NOT NEW.opening_id OR OLD.device_id IS NOT NEW.device_id OR OLD.hinge_side IS NOT NEW.hinge_side OR OLD.swing_side IS NOT NEW.swing_side BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(NEW.opening_id AS TEXT),CAST(NEW.opening_id AS TEXT),'updated',audit_json(json_object('floorplanId',OLD.floorplan_id,'openingId',OLD.opening_id,'deviceId',OLD.device_id,'hingeSide',OLD.hinge_side,'swingSide',OLD.swing_side)),audit_json(json_object('floorplanId',NEW.floorplan_id,'openingId',NEW.opening_id,'deviceId',NEW.device_id,'hingeSide',NEW.hinge_side,'swingSide',NEW.swing_side)));
END;
DROP TRIGGER audit_floorplan_door_bindings_deleted;
CREATE TRIGGER audit_floorplan_door_bindings_deleted AFTER DELETE ON floorplan_door_bindings BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'floorplan_door_bindings',CAST(OLD.opening_id AS TEXT),CAST(OLD.opening_id AS TEXT),'deleted',audit_json(json_object('floorplanId',OLD.floorplan_id,'openingId',OLD.opening_id,'deviceId',OLD.device_id,'hingeSide',OLD.hinge_side,'swingSide',OLD.swing_side)),audit_json('null'));
END;
DROP TRIGGER audit_group_members_created;
CREATE TRIGGER audit_group_members_created AFTER INSERT ON group_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'groupId',NEW.group_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'providerEndpoint',NEW.provider_endpoint)));
END;
DROP TRIGGER audit_group_members_updated;
CREATE TRIGGER audit_group_members_updated AFTER UPDATE ON group_members WHEN OLD.id IS NOT NEW.id OR OLD.group_id IS NOT NEW.group_id OR OLD.member_type IS NOT NEW.member_type OR OLD.member_id IS NOT NEW.member_id OR OLD.provider_endpoint IS NOT NEW.provider_endpoint BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(NEW.id AS TEXT),CAST(NEW.id AS TEXT),'updated',audit_json(json_object('id',OLD.id,'groupId',OLD.group_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'providerEndpoint',OLD.provider_endpoint)),audit_json(json_object('id',NEW.id,'groupId',NEW.group_id,'memberType',NEW.member_type,'memberId',NEW.member_id,'providerEndpoint',NEW.provider_endpoint)));
END;
DROP TRIGGER audit_group_members_deleted;
CREATE TRIGGER audit_group_members_deleted AFTER DELETE ON group_members BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'group_members',CAST(OLD.id AS TEXT),CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('id',OLD.id,'groupId',OLD.group_id,'memberType',OLD.member_type,'memberId',OLD.member_id,'providerEndpoint',OLD.provider_endpoint)),audit_json('null'));
END;
DROP TRIGGER audit_scene_dynamic_sources_created;
CREATE TRIGGER audit_scene_dynamic_sources_created AFTER INSERT ON scene_dynamic_sources BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(NEW.scene_id AS TEXT),CAST(NEW.scene_id AS TEXT),'created',audit_json('null'),audit_json(json_object('sceneId',NEW.scene_id,'domain',NEW.domain,'sourceKind',NEW.source_kind,'presetId',NEW.preset_id,'guidedSelectedIds',NEW.guided_selected_ids,'seed',NEW.seed,'brightness',NEW.brightness,'movement',NEW.movement,'cycleNanos',NEW.cycle_nanos,'gridWidth',NEW.grid_width,'gridHeight',NEW.grid_height)));
END;
DROP TRIGGER audit_scene_dynamic_sources_updated;
CREATE TRIGGER audit_scene_dynamic_sources_updated AFTER UPDATE ON scene_dynamic_sources WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.domain IS NOT NEW.domain OR OLD.source_kind IS NOT NEW.source_kind OR OLD.preset_id IS NOT NEW.preset_id OR OLD.guided_selected_ids IS NOT NEW.guided_selected_ids OR OLD.seed IS NOT NEW.seed OR OLD.brightness IS NOT NEW.brightness OR OLD.movement IS NOT NEW.movement OR OLD.cycle_nanos IS NOT NEW.cycle_nanos OR OLD.grid_width IS NOT NEW.grid_width OR OLD.grid_height IS NOT NEW.grid_height BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(NEW.scene_id AS TEXT),CAST(NEW.scene_id AS TEXT),'updated',audit_json(json_object('sceneId',OLD.scene_id,'domain',OLD.domain,'sourceKind',OLD.source_kind,'presetId',OLD.preset_id,'guidedSelectedIds',OLD.guided_selected_ids,'seed',OLD.seed,'brightness',OLD.brightness,'movement',OLD.movement,'cycleNanos',OLD.cycle_nanos,'gridWidth',OLD.grid_width,'gridHeight',OLD.grid_height)),audit_json(json_object('sceneId',NEW.scene_id,'domain',NEW.domain,'sourceKind',NEW.source_kind,'presetId',NEW.preset_id,'guidedSelectedIds',NEW.guided_selected_ids,'seed',NEW.seed,'brightness',NEW.brightness,'movement',NEW.movement,'cycleNanos',NEW.cycle_nanos,'gridWidth',NEW.grid_width,'gridHeight',NEW.grid_height)));
END;
DROP TRIGGER audit_scene_dynamic_sources_deleted;
CREATE TRIGGER audit_scene_dynamic_sources_deleted AFTER DELETE ON scene_dynamic_sources BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_sources',CAST(OLD.scene_id AS TEXT),CAST(OLD.scene_id AS TEXT),'deleted',audit_json(json_object('sceneId',OLD.scene_id,'domain',OLD.domain,'sourceKind',OLD.source_kind,'presetId',OLD.preset_id,'guidedSelectedIds',OLD.guided_selected_ids,'seed',OLD.seed,'brightness',OLD.brightness,'movement',OLD.movement,'cycleNanos',OLD.cycle_nanos,'gridWidth',OLD.grid_width,'gridHeight',OLD.grid_height)),audit_json('null'));
END;
DROP TRIGGER audit_scene_dynamic_samples_created;
CREATE TRIGGER audit_scene_dynamic_samples_created AFTER INSERT ON scene_dynamic_samples BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),'created',audit_json('null'),audit_json(json_object('sceneId',NEW.scene_id,'position',NEW.position,'lightness',NEW.lightness,'chroma',NEW.chroma,'hue',NEW.hue,'brightness',NEW.brightness,'mireds',NEW.mireds)));
END;
DROP TRIGGER audit_scene_dynamic_samples_updated;
CREATE TRIGGER audit_scene_dynamic_samples_updated AFTER UPDATE ON scene_dynamic_samples WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.position IS NOT NEW.position OR OLD.lightness IS NOT NEW.lightness OR OLD.chroma IS NOT NEW.chroma OR OLD.hue IS NOT NEW.hue OR OLD.brightness IS NOT NEW.brightness OR OLD.mireds IS NOT NEW.mireds BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.position AS TEXT),'updated',audit_json(json_object('sceneId',OLD.scene_id,'position',OLD.position,'lightness',OLD.lightness,'chroma',OLD.chroma,'hue',OLD.hue,'brightness',OLD.brightness,'mireds',OLD.mireds)),audit_json(json_object('sceneId',NEW.scene_id,'position',NEW.position,'lightness',NEW.lightness,'chroma',NEW.chroma,'hue',NEW.hue,'brightness',NEW.brightness,'mireds',NEW.mireds)));
END;
DROP TRIGGER audit_scene_dynamic_samples_deleted;
CREATE TRIGGER audit_scene_dynamic_samples_deleted AFTER DELETE ON scene_dynamic_samples BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_dynamic_samples',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.position AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.position AS TEXT),'deleted',audit_json(json_object('sceneId',OLD.scene_id,'position',OLD.position,'lightness',OLD.lightness,'chroma',OLD.chroma,'hue',OLD.hue,'brightness',OLD.brightness,'mireds',OLD.mireds)),audit_json('null'));
END;
DROP TRIGGER audit_scene_targets_created;
CREATE TRIGGER audit_scene_targets_created AFTER INSERT ON scene_targets BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'created',audit_json('null'),audit_json(json_object('id',NEW.id,'sceneId',NEW.scene_id,'position',NEW.position,'targetType',NEW.target_type,'targetId',NEW.target_id,'expression',NEW.expression,'name',NEW.name)));
END;
DROP TRIGGER audit_scene_targets_updated;
CREATE TRIGGER audit_scene_targets_updated AFTER UPDATE ON scene_targets WHEN OLD.id IS NOT NEW.id OR OLD.scene_id IS NOT NEW.scene_id OR OLD.position IS NOT NEW.position OR OLD.target_type IS NOT NEW.target_type OR OLD.target_id IS NOT NEW.target_id OR OLD.expression IS NOT NEW.expression OR OLD.name IS NOT NEW.name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(NEW.id AS TEXT),COALESCE(NEW.name, CAST(NEW.id AS TEXT)),'updated',audit_json(json_object('id',OLD.id,'sceneId',OLD.scene_id,'position',OLD.position,'targetType',OLD.target_type,'targetId',OLD.target_id,'expression',OLD.expression,'name',OLD.name)),audit_json(json_object('id',NEW.id,'sceneId',NEW.scene_id,'position',NEW.position,'targetType',NEW.target_type,'targetId',NEW.target_id,'expression',NEW.expression,'name',NEW.name)));
END;
DROP TRIGGER audit_scene_targets_deleted;
CREATE TRIGGER audit_scene_targets_deleted AFTER DELETE ON scene_targets BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_targets',CAST(OLD.id AS TEXT),COALESCE(OLD.name, CAST(OLD.id AS TEXT)),'deleted',audit_json(json_object('id',OLD.id,'sceneId',OLD.scene_id,'position',OLD.position,'targetType',OLD.target_type,'targetId',OLD.target_id,'expression',OLD.expression,'name',OLD.name)),audit_json('null'));
END;
DROP TRIGGER audit_automation_nodes_created;
CREATE TRIGGER audit_automation_nodes_created AFTER INSERT ON automation_nodes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),'created',audit_json('null'),audit_json(json_object('automationId',NEW.automation_id,'id',NEW.id,'type',NEW.type,'config',NEW.config,'positionX',NEW.position_x,'positionY',NEW.position_y)));
END;
DROP TRIGGER audit_automation_nodes_updated;
CREATE TRIGGER audit_automation_nodes_updated AFTER UPDATE ON automation_nodes WHEN OLD.automation_id IS NOT NEW.automation_id OR OLD.id IS NOT NEW.id OR OLD.type IS NOT NEW.type OR OLD.config IS NOT NEW.config OR OLD.position_x IS NOT NEW.position_x OR OLD.position_y IS NOT NEW.position_y BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.id AS TEXT),'updated',audit_json(json_object('automationId',OLD.automation_id,'id',OLD.id,'type',OLD.type,'config',OLD.config,'positionX',OLD.position_x,'positionY',OLD.position_y)),audit_json(json_object('automationId',NEW.automation_id,'id',NEW.id,'type',NEW.type,'config',NEW.config,'positionX',NEW.position_x,'positionY',NEW.position_y)));
END;
DROP TRIGGER audit_automation_nodes_deleted;
CREATE TRIGGER audit_automation_nodes_deleted AFTER DELETE ON automation_nodes BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_nodes',CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.id AS TEXT),CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.id AS TEXT),'deleted',audit_json(json_object('automationId',OLD.automation_id,'id',OLD.id,'type',OLD.type,'config',OLD.config,'positionX',OLD.position_x,'positionY',OLD.position_y)),audit_json('null'));
END;
DROP TRIGGER audit_automation_edges_created;
CREATE TRIGGER audit_automation_edges_created AFTER INSERT ON automation_edges BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),'created',audit_json('null'),audit_json(json_object('automationId',NEW.automation_id,'fromNodeId',NEW.from_node_id,'toNodeId',NEW.to_node_id)));
END;
DROP TRIGGER audit_automation_edges_updated;
CREATE TRIGGER audit_automation_edges_updated AFTER UPDATE ON automation_edges WHEN OLD.automation_id IS NOT NEW.automation_id OR OLD.from_node_id IS NOT NEW.from_node_id OR OLD.to_node_id IS NOT NEW.to_node_id BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),CAST(NEW.automation_id AS TEXT) || ':' || CAST(NEW.from_node_id AS TEXT) || ':' || CAST(NEW.to_node_id AS TEXT),'updated',audit_json(json_object('automationId',OLD.automation_id,'fromNodeId',OLD.from_node_id,'toNodeId',OLD.to_node_id)),audit_json(json_object('automationId',NEW.automation_id,'fromNodeId',NEW.from_node_id,'toNodeId',NEW.to_node_id)));
END;
DROP TRIGGER audit_automation_edges_deleted;
CREATE TRIGGER audit_automation_edges_deleted AFTER DELETE ON automation_edges BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'automation_edges',CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.from_node_id AS TEXT) || ':' || CAST(OLD.to_node_id AS TEXT),CAST(OLD.automation_id AS TEXT) || ':' || CAST(OLD.from_node_id AS TEXT) || ':' || CAST(OLD.to_node_id AS TEXT),'deleted',audit_json(json_object('automationId',OLD.automation_id,'fromNodeId',OLD.from_node_id,'toNodeId',OLD.to_node_id)),audit_json('null'));
END;
DROP TRIGGER audit_scene_light_overrides_created;
CREATE TRIGGER audit_scene_light_overrides_created AFTER INSERT ON scene_light_overrides BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'created',audit_json('null'),audit_json(json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'kind',NEW.kind,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing,'effectId',NEW.effect_id,'nativeEffectName',NEW.native_effect_name)));
END;
DROP TRIGGER audit_scene_light_overrides_updated;
CREATE TRIGGER audit_scene_light_overrides_updated AFTER UPDATE ON scene_light_overrides WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.device_id IS NOT NEW.device_id OR OLD.kind IS NOT NEW.kind OR OLD.on_state IS NOT NEW.on_state OR OLD.brightness IS NOT NEW.brightness OR OLD.color_temp IS NOT NEW.color_temp OR OLD.color_r IS NOT NEW.color_r OR OLD.color_g IS NOT NEW.color_g OR OLD.color_b IS NOT NEW.color_b OR OLD.color_x IS NOT NEW.color_x OR OLD.color_y IS NOT NEW.color_y OR OLD.transition IS NOT NEW.transition OR OLD.target_temperature IS NOT NEW.target_temperature OR OLD.hvac_mode IS NOT NEW.hvac_mode OR OLD.fan_mode IS NOT NEW.fan_mode OR OLD.swing IS NOT NEW.swing OR OLD.effect_id IS NOT NEW.effect_id OR OLD.native_effect_name IS NOT NEW.native_effect_name BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'updated',audit_json(json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'kind',OLD.kind,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing,'effectId',OLD.effect_id,'nativeEffectName',OLD.native_effect_name)),audit_json(json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'kind',NEW.kind,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing,'effectId',NEW.effect_id,'nativeEffectName',NEW.native_effect_name)));
END;
DROP TRIGGER audit_scene_light_overrides_deleted;
CREATE TRIGGER audit_scene_light_overrides_deleted AFTER DELETE ON scene_light_overrides BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_light_overrides',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),'deleted',audit_json(json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'kind',OLD.kind,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing,'effectId',OLD.effect_id,'nativeEffectName',OLD.native_effect_name)),audit_json('null'));
END;
DROP TRIGGER audit_scene_supporting_states_created;
CREATE TRIGGER audit_scene_supporting_states_created AFTER INSERT ON scene_supporting_states BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'created',audit_json('null'),audit_json(json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing)));
END;
DROP TRIGGER audit_scene_supporting_states_updated;
CREATE TRIGGER audit_scene_supporting_states_updated AFTER UPDATE ON scene_supporting_states WHEN OLD.scene_id IS NOT NEW.scene_id OR OLD.device_id IS NOT NEW.device_id OR OLD.on_state IS NOT NEW.on_state OR OLD.brightness IS NOT NEW.brightness OR OLD.color_temp IS NOT NEW.color_temp OR OLD.color_r IS NOT NEW.color_r OR OLD.color_g IS NOT NEW.color_g OR OLD.color_b IS NOT NEW.color_b OR OLD.color_x IS NOT NEW.color_x OR OLD.color_y IS NOT NEW.color_y OR OLD.transition IS NOT NEW.transition OR OLD.target_temperature IS NOT NEW.target_temperature OR OLD.hvac_mode IS NOT NEW.hvac_mode OR OLD.fan_mode IS NOT NEW.fan_mode OR OLD.swing IS NOT NEW.swing BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),CAST(NEW.scene_id AS TEXT) || ':' || CAST(NEW.device_id AS TEXT),'updated',audit_json(json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing)),audit_json(json_object('sceneId',NEW.scene_id,'deviceId',NEW.device_id,'onState',NEW.on_state,'brightness',NEW.brightness,'colorTemp',NEW.color_temp,'colorR',NEW.color_r,'colorG',NEW.color_g,'colorB',NEW.color_b,'colorX',NEW.color_x,'colorY',NEW.color_y,'transition',NEW.transition,'targetTemperature',NEW.target_temperature,'hvacMode',NEW.hvac_mode,'fanMode',NEW.fan_mode,'swing',NEW.swing)));
END;
DROP TRIGGER audit_scene_supporting_states_deleted;
CREATE TRIGGER audit_scene_supporting_states_deleted AFTER DELETE ON scene_supporting_states BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'scene_supporting_states',CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),CAST(OLD.scene_id AS TEXT) || ':' || CAST(OLD.device_id AS TEXT),'deleted',audit_json(json_object('sceneId',OLD.scene_id,'deviceId',OLD.device_id,'onState',OLD.on_state,'brightness',OLD.brightness,'colorTemp',OLD.color_temp,'colorR',OLD.color_r,'colorG',OLD.color_g,'colorB',OLD.color_b,'colorX',OLD.color_x,'colorY',OLD.color_y,'transition',OLD.transition,'targetTemperature',OLD.target_temperature,'hvacMode',OLD.hvac_mode,'fanMode',OLD.fan_mode,'swing',OLD.swing)),audit_json('null'));
END;
