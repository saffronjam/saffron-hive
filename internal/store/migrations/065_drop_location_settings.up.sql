-- Removes the stored map location. Nothing reads these keys: the map draws
-- lamp light only, so a latitude, longitude, or plan bearing has no consumer.
DELETE FROM settings
WHERE key IN ('location.latitude', 'location.longitude', 'location.plan_north_deg');
