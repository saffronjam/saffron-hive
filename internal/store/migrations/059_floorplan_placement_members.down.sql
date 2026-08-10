-- Narrows placements back to devices only. Group placements have no
-- representation in the device-keyed table, so their rows are dropped.

CREATE TABLE floorplan_placements_old (
    device_id    TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    x            REAL NOT NULL,
    y            REAL NOT NULL
);

INSERT INTO floorplan_placements_old (device_id, floorplan_id, x, y)
SELECT member_id, floorplan_id, x, y FROM floorplan_placements WHERE member_type = 'device';

DROP TABLE floorplan_placements;

ALTER TABLE floorplan_placements_old RENAME TO floorplan_placements;

CREATE INDEX idx_floorplan_placements_floorplan_id ON floorplan_placements(floorplan_id);
