CREATE TABLE floorplan_door_bindings (
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    opening_id   TEXT PRIMARY KEY REFERENCES floorplan_openings(id) ON DELETE CASCADE,
    device_id    TEXT NOT NULL UNIQUE REFERENCES devices(id) ON DELETE CASCADE,
    hinge_side   TEXT NOT NULL CHECK (hinge_side IN ('start', 'end')),
    swing_side   TEXT NOT NULL CHECK (swing_side IN ('left', 'right'))
);

CREATE INDEX idx_floorplan_door_bindings_floorplan_id
ON floorplan_door_bindings(floorplan_id);
