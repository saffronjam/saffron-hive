DROP TABLE IF EXISTS floorplan_openings;

CREATE TABLE floorplan_openings (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    wall_id      TEXT NOT NULL REFERENCES floorplan_walls(id) ON DELETE CASCADE,
    t            REAL NOT NULL,
    width        REAL NOT NULL,
    kind         TEXT NOT NULL
);

CREATE INDEX idx_floorplan_openings_floorplan_id ON floorplan_openings(floorplan_id);
CREATE INDEX idx_floorplan_openings_wall_id ON floorplan_openings(wall_id);
