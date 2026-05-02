ALTER TABLE users ADD COLUMN time_format TEXT NOT NULL DEFAULT '24h'
    CHECK (time_format IN ('12h', '24h'));
ALTER TABLE users ADD COLUMN temperature_unit TEXT NOT NULL DEFAULT 'celsius'
    CHECK (temperature_unit IN ('celsius', 'fahrenheit'));
