-- Furniture and obstacles placed on a floor plan. x/y is the piece's centre,
-- width/height its unrotated footprint in meters, rotation degrees clockwise.
-- An occluder blocks light in the map's light model.
CREATE TABLE floorplan_furniture (
    id           TEXT PRIMARY KEY,
    floorplan_id TEXT NOT NULL REFERENCES floorplans(id) ON DELETE CASCADE,
    kind         TEXT NOT NULL,
    x            REAL NOT NULL,
    y            REAL NOT NULL,
    width        REAL NOT NULL,
    height       REAL NOT NULL,
    rotation     REAL NOT NULL DEFAULT 0,
    occluder     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_floorplan_furniture_floorplan_id ON floorplan_furniture(floorplan_id);
