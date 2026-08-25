-- name: GetNativeEffectObservation :one
SELECT device_id, effect_name, result, evidence_fingerprint, observed_at
FROM native_effect_observations
WHERE device_id = ? AND effect_name = ?;

-- name: ListNativeEffectObservations :many
SELECT device_id, effect_name, result, evidence_fingerprint, observed_at
FROM native_effect_observations
ORDER BY device_id, effect_name;

-- name: UpsertNativeEffectObservation :one
INSERT INTO native_effect_observations (
    device_id, effect_name, result, evidence_fingerprint
) VALUES (?, ?, ?, ?)
ON CONFLICT(device_id, effect_name) DO UPDATE SET
    result = excluded.result,
    evidence_fingerprint = excluded.evidence_fingerprint,
    observed_at = CURRENT_TIMESTAMP
WHERE native_effect_observations.result != excluded.result
   OR native_effect_observations.evidence_fingerprint != excluded.evidence_fingerprint
RETURNING device_id, effect_name, result, evidence_fingerprint, observed_at;

-- name: DeleteNativeEffectObservation :exec
DELETE FROM native_effect_observations
WHERE device_id = ? AND effect_name = ?;
