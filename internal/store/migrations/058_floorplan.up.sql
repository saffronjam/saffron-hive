-- The floor-plan map: a centerline wall graph plus derived room faces and
-- device placements. World units are meters. floorplan_rooms.room_id is the
-- Hive room link and carries no FK — an orphaned link is swept the same way
-- room_members sweeps dangling group refs. The runtime connection does not
-- enable PRAGMA foreign_keys, so no declared FK here fires: placements are
-- swept explicitly when the thing they point at is deleted, and a soft-removed
-- device keeps its spot.

CREATE TABLE floorplans (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE floorplan_vertices (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    x            REAL NOT NULL,
    y            REAL NOT NULL
);

CREATE INDEX idx_floorplan_vertices_floorplan_id ON floorplan_vertices(floorplan_id);

CREATE TABLE floorplan_walls (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    vertex_a     TEXT NOT NULL REFERENCES floorplan_vertices(id) ON DELETE CASCADE,
    vertex_b     TEXT NOT NULL REFERENCES floorplan_vertices(id) ON DELETE CASCADE,
    thickness    REAL NOT NULL DEFAULT 0.1,
    curve_x      REAL,
    curve_y      REAL
);

CREATE INDEX idx_floorplan_walls_floorplan_id ON floorplan_walls(floorplan_id);
CREATE INDEX idx_floorplan_walls_vertex_a ON floorplan_walls(vertex_a);
CREATE INDEX idx_floorplan_walls_vertex_b ON floorplan_walls(vertex_b);

CREATE TABLE floorplan_rooms (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    name         TEXT,
    room_id      TEXT UNIQUE,
    vertex_ids   TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_floorplan_rooms_floorplan_id ON floorplan_rooms(floorplan_id);

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

CREATE TABLE floorplan_placements (
    device_id    TEXT PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    x            REAL NOT NULL,
    y            REAL NOT NULL
);

CREATE INDEX idx_floorplan_placements_floorplan_id ON floorplan_placements(floorplan_id);
