-- Placements become polymorphic target refs: a placement pins either a device
-- or a group to a point on the plan, using the member_type/member_id vocabulary
-- room_members and scene_actions already speak. The primary key keeps each ref
-- on the map at most once, so a device appears once and so does a group.
-- Existing rows carry real coordinates and are copied across as device
-- placements.

CREATE TABLE floorplan_placements_new (
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    member_type  TEXT NOT NULL CHECK (member_type IN ('device','group')),
    member_id    TEXT NOT NULL,
    x            REAL NOT NULL,
    y            REAL NOT NULL,
    PRIMARY KEY (member_type, member_id)
);

INSERT INTO floorplan_placements_new (floorplan_id, member_type, member_id, x, y)
SELECT floorplan_id, 'device', device_id, x, y FROM floorplan_placements;

DROP TABLE floorplan_placements;

ALTER TABLE floorplan_placements_new RENAME TO floorplan_placements;

CREATE INDEX idx_floorplan_placements_floorplan_id ON floorplan_placements(floorplan_id);
