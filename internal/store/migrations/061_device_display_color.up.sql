-- The colour a device shows on the floor plan when it reports none of its own,
-- as a #rrggbb string. NULL leaves it to the map's default.
ALTER TABLE devices ADD COLUMN display_color TEXT;
