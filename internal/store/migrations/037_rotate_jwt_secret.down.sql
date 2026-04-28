-- No-op. The forward migration deletes the JWT secret to force rotation;
-- there is nothing meaningful to "restore" — the previous value is gone, and
-- the new one (regenerated on first boot after the up-migration ran) lives in
-- the settings table already. This down-migration exists only so the
-- migration tool's up/down pairing remains consistent.
SELECT 1;
