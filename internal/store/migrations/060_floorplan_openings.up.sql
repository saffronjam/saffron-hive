-- Openings are gaps cut out of a wall body: doors, windows and cased openings.
-- `t` is the gap's centre in the wall's own parameterisation (0 at vertex_a,
-- 1 at vertex_b) and `width` is in meters, so splitting a wall at a T-junction
-- rescales `t` while `width` carries across untouched. Openings never affect
-- the centerline graph, so a door between two rooms cannot merge their faces.
-- The runtime connection does not enable PRAGMA foreign_keys, so the declared
-- references document intent only: ReplaceFloorplan deletes openings before
-- walls inside its transaction.

DROP TABLE IF EXISTS floorplan_openings;

CREATE TABLE floorplan_openings (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    wall_id      TEXT NOT NULL REFERENCES floorplan_walls(id) ON DELETE CASCADE,
    t            REAL NOT NULL CHECK (t >= 0 AND t <= 1),
    width        REAL NOT NULL CHECK (width > 0),
    kind         TEXT NOT NULL CHECK (kind IN ('door', 'window', 'opening'))
);

CREATE INDEX idx_floorplan_openings_floorplan_id ON floorplan_openings(floorplan_id);
CREATE INDEX idx_floorplan_openings_wall_id ON floorplan_openings(wall_id);
