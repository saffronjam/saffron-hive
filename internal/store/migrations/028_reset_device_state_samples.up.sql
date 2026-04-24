-- Wipe accumulated samples so the recorder starts writing RFC3339Nano UTC
-- text into recorded_at. Earlier rows used Go's time.Time.String() form
-- (locale-timezone label plus monotonic-clock suffix), which is not
-- lexicographically comparable with portable ISO bounds.
DELETE FROM device_state_samples;
