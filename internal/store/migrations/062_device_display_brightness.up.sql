-- How bright a device shows on the floor plan when it reports no brightness of
-- its own, on the 0-254 scale device state uses. NULL means full strength.
ALTER TABLE devices ADD COLUMN display_brightness INTEGER;
