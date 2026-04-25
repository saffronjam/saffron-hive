package effect

import "time"

// ActiveEffectRecord is one (target, effect) row marking that an effect is
// currently running on the target. Volatile rows are wiped at process startup
// so a previous lifetime's transient runs do not look active. Non-volatile
// rows survive a restart so the runner can resume them.
type ActiveEffectRecord struct {
	ID         string
	EffectID   string
	TargetType string
	TargetID   string
	StartedAt  time.Time
	Volatile   bool
}

// UpsertActiveEffectParams parameterises an upsert into active_effects. The
// (TargetType, TargetID) tuple is unique; an existing row for the target is
// overwritten so a target can only have one effect active at a time.
type UpsertActiveEffectParams struct {
	ID         string
	EffectID   string
	TargetType string
	TargetID   string
	StartedAt  time.Time
	Volatile   bool
}
