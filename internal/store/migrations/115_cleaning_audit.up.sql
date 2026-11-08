CREATE TRIGGER audit_dreame_config_created AFTER INSERT ON dreame_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'dreame_config','dreame','dreame','created',audit_json('null'),audit_json(json_object('email',NEW.email,'region',NEW.region,'enabled',NEW.enabled,'passwordConfigured',CASE WHEN NEW.password='' THEN 0 ELSE 1 END)));
END;
CREATE TRIGGER audit_dreame_config_updated AFTER UPDATE ON dreame_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'dreame_config','dreame','dreame','updated',audit_json(json_object('email',OLD.email,'region',OLD.region,'enabled',OLD.enabled,'passwordConfigured',CASE WHEN OLD.password='' THEN 0 ELSE 1 END)),audit_json(json_object('email',NEW.email,'region',NEW.region,'enabled',NEW.enabled,'passwordConfigured',CASE WHEN NEW.password='' THEN 0 ELSE 1 END)));
END;
CREATE TRIGGER audit_dreame_config_deleted AFTER DELETE ON dreame_config BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'dreame_config','dreame','dreame','deleted',audit_json(json_object('email',OLD.email,'region',OLD.region,'enabled',OLD.enabled,'passwordConfigured',CASE WHEN OLD.password='' THEN 0 ELSE 1 END)),audit_json('null'));
END;
CREATE TRIGGER audit_cleaning_room_links_created AFTER INSERT ON cleaning_room_links BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_room_links',NEW.device_id||':'||NEW.map_id||':'||NEW.room_id||':'||NEW.area_id,NEW.device_id||':'||NEW.map_id||':'||NEW.room_id||':'||NEW.area_id,'created',audit_json('null'),audit_json(json_object('deviceId',NEW.device_id,'mapId',NEW.map_id,'roomId',NEW.room_id,'areaId',NEW.area_id,'mapRevision',NEW.map_revision)));
END;
CREATE TRIGGER audit_cleaning_room_links_updated AFTER UPDATE ON cleaning_room_links BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_room_links',NEW.device_id||':'||NEW.map_id||':'||NEW.room_id||':'||NEW.area_id,NEW.device_id||':'||NEW.map_id||':'||NEW.room_id||':'||NEW.area_id,'updated',audit_json(json_object('deviceId',OLD.device_id,'mapId',OLD.map_id,'roomId',OLD.room_id,'areaId',OLD.area_id,'mapRevision',OLD.map_revision)),audit_json(json_object('deviceId',NEW.device_id,'mapId',NEW.map_id,'roomId',NEW.room_id,'areaId',NEW.area_id,'mapRevision',NEW.map_revision)));
END;
CREATE TRIGGER audit_cleaning_room_links_deleted AFTER DELETE ON cleaning_room_links BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_room_links',OLD.device_id||':'||OLD.map_id||':'||OLD.room_id||':'||OLD.area_id,OLD.device_id||':'||OLD.map_id||':'||OLD.room_id||':'||OLD.area_id,'deleted',audit_json(json_object('deviceId',OLD.device_id,'mapId',OLD.map_id,'roomId',OLD.room_id,'areaId',OLD.area_id,'mapRevision',OLD.map_revision)),audit_json('null'));
END;
CREATE TRIGGER audit_cleaning_calibrations_created AFTER INSERT ON cleaning_calibrations BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_calibrations',NEW.device_id||':'||NEW.map_id||':'||NEW.floorplan_id,NEW.device_id||':'||NEW.map_id||':'||NEW.floorplan_id,'created',audit_json('null'),audit_json(json_object('deviceId',NEW.device_id,'mapId',NEW.map_id,'floorplanId',NEW.floorplan_id,'mapRevision',NEW.map_revision,'floorplanRevision',NEW.floorplan_revision,'anchors',NEW.anchors)));
END;
CREATE TRIGGER audit_cleaning_calibrations_updated AFTER UPDATE ON cleaning_calibrations BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_calibrations',NEW.device_id||':'||NEW.map_id||':'||NEW.floorplan_id,NEW.device_id||':'||NEW.map_id||':'||NEW.floorplan_id,'updated',audit_json(json_object('deviceId',OLD.device_id,'mapId',OLD.map_id,'floorplanId',OLD.floorplan_id,'mapRevision',OLD.map_revision,'floorplanRevision',OLD.floorplan_revision,'anchors',OLD.anchors)),audit_json(json_object('deviceId',NEW.device_id,'mapId',NEW.map_id,'floorplanId',NEW.floorplan_id,'mapRevision',NEW.map_revision,'floorplanRevision',NEW.floorplan_revision,'anchors',NEW.anchors)));
END;
CREATE TRIGGER audit_cleaning_calibrations_deleted AFTER DELETE ON cleaning_calibrations BEGIN
 INSERT INTO audit_events(operation_id,entity_type,entity_id,entity_name,action,before_json,after_json)
 VALUES((SELECT operation_id FROM audit_write_context WHERE id=1),'cleaning_calibrations',OLD.device_id||':'||OLD.map_id||':'||OLD.floorplan_id,OLD.device_id||':'||OLD.map_id||':'||OLD.floorplan_id,'deleted',audit_json(json_object('deviceId',OLD.device_id,'mapId',OLD.map_id,'floorplanId',OLD.floorplan_id,'mapRevision',OLD.map_revision,'floorplanRevision',OLD.floorplan_revision,'anchors',OLD.anchors)),audit_json('null'));
END;
