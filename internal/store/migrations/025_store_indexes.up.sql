CREATE INDEX idx_scene_actions_scene_id ON scene_actions(scene_id);
CREATE INDEX idx_automation_nodes_automation_id ON automation_nodes(automation_id);
CREATE INDEX idx_automation_edges_automation_id ON automation_edges(automation_id);
CREATE INDEX idx_automation_edges_from_node_id ON automation_edges(from_node_id);
CREATE INDEX idx_automation_edges_to_node_id ON automation_edges(to_node_id);
CREATE INDEX idx_room_devices_device_id ON room_devices(device_id);
CREATE INDEX idx_group_members_member ON group_members(member_type, member_id);
