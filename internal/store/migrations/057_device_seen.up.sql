-- Marks whether a device has been surfaced to the user since it was discovered.
-- New rows default to unseen, so an adapter inserting a device needs no extra
-- code to flag it. Devices that already exist are not new to anyone, so they are
-- all marked seen.

ALTER TABLE devices ADD COLUMN seen BOOLEAN NOT NULL DEFAULT false;
UPDATE devices SET seen = true;
