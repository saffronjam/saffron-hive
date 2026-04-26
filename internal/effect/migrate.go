package effect

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

// stepMigrationDB is the narrow store contract used for the v1 -> v2 data
// migration. It exposes a raw *sql.DB so the helper can detect whether the
// pre-v2 effect_steps table still exists and read its rows directly. *store.DB
// satisfies this via its DB() accessor wired from the wiring layer.
type stepMigrationDB interface {
	RawDB() *sql.DB
}

// stepLoopTailMs is added to a migrated effect's duration_ms when loop=true so
// the inter-loop gap matches the v2 default End-line offset from the rightmost
// clip end.
const stepLoopTailMs = 200

type legacyStep struct {
	ID        string
	EffectID  string
	StepIndex int
	Kind      string
	Config    string
}

type legacyEffectMeta struct {
	ID   string
	Loop bool
}

// MigrateEffectStepsToTracks converts every v1 effect_steps row into the v2
// effect_tracks / effect_clips schema. Wait steps are absorbed as gaps; their
// duration accumulates into subsequent clips' StartMs (including a leading
// wait, which becomes a non-zero StartMs on the first clip). Each effect ends
// up with a single track containing one clip per non-wait step. The effect's
// duration_ms is set to the rightmost clip's end plus a 200 ms loop tail when
// loop=1, otherwise the rightmost clip end.
//
// Safe to run repeatedly: when the effect_steps table no longer exists (e.g.
// migration 034 has dropped it) the helper returns immediately with no error.
// Effects that already have any rows in effect_tracks are skipped so a
// retried migration does not duplicate work.
func MigrateEffectStepsToTracks(ctx context.Context, st stepMigrationDB) error {
	db := st.RawDB()
	exists, err := tableExists(ctx, db, "effect_steps")
	if err != nil {
		return fmt.Errorf("check effect_steps existence: %w", err)
	}
	if !exists {
		logger.Info("effect_steps migration skipped", "reason", "table absent")
		return nil
	}

	effects, err := loadLegacyEffects(ctx, db)
	if err != nil {
		return err
	}
	if len(effects) == 0 {
		logger.Info("effect_steps migration: no v1 effects to migrate")
		return nil
	}

	migrated := 0
	for _, eff := range effects {
		hasTracks, err := effectHasTracks(ctx, db, eff.ID)
		if err != nil {
			return fmt.Errorf("check existing tracks for effect %q: %w", eff.ID, err)
		}
		if hasTracks {
			continue
		}
		steps, err := loadLegacySteps(ctx, db, eff.ID)
		if err != nil {
			return fmt.Errorf("load steps for effect %q: %w", eff.ID, err)
		}
		if len(steps) == 0 {
			continue
		}
		if err := migrateEffect(ctx, db, eff, steps); err != nil {
			return fmt.Errorf("migrate effect %q: %w", eff.ID, err)
		}
		migrated++
	}
	logger.Info("effect_steps migration complete", "effects_migrated", migrated)
	return nil
}

func tableExists(ctx context.Context, db *sql.DB, name string) (bool, error) {
	row := db.QueryRowContext(ctx, `SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`, name)
	var n int
	err := row.Scan(&n)
	if err == sql.ErrNoRows {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return n == 1, nil
}

func loadLegacyEffects(ctx context.Context, db *sql.DB) ([]legacyEffectMeta, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, loop FROM effects`)
	if err != nil {
		return nil, fmt.Errorf("query effects: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var out []legacyEffectMeta
	for rows.Next() {
		var (
			id   string
			loop int64
		)
		if err := rows.Scan(&id, &loop); err != nil {
			return nil, fmt.Errorf("scan effect: %w", err)
		}
		out = append(out, legacyEffectMeta{ID: id, Loop: loop != 0})
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func effectHasTracks(ctx context.Context, db *sql.DB, effectID string) (bool, error) {
	row := db.QueryRowContext(ctx, `SELECT COUNT(*) FROM effect_tracks WHERE effect_id = ?`, effectID)
	var n int
	if err := row.Scan(&n); err != nil {
		return false, err
	}
	return n > 0, nil
}

func loadLegacySteps(ctx context.Context, db *sql.DB, effectID string) ([]legacyStep, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, effect_id, step_index, kind, config FROM effect_steps WHERE effect_id = ? ORDER BY step_index`, effectID)
	if err != nil {
		return nil, fmt.Errorf("query effect_steps: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var out []legacyStep
	for rows.Next() {
		var s legacyStep
		if err := rows.Scan(&s.ID, &s.EffectID, &s.StepIndex, &s.Kind, &s.Config); err != nil {
			return nil, fmt.Errorf("scan effect_step: %w", err)
		}
		out = append(out, s)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func migrateEffect(ctx context.Context, db *sql.DB, eff legacyEffectMeta, steps []legacyStep) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	trackID := uuid.New().String()
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO effect_tracks (id, effect_id, track_index) VALUES (?, ?, 0)`,
		trackID, eff.ID); err != nil {
		return fmt.Errorf("insert track: %w", err)
	}

	cumulative := 0
	maxEnd := 0
	for _, s := range steps {
		switch s.Kind {
		case "wait":
			d, err := waitDurationFromLegacyConfig(s.Config)
			if err != nil {
				return fmt.Errorf("step %s: %w", s.ID, err)
			}
			cumulative += d
		case "set_on_off", "set_brightness", "set_color_rgb", "set_color_temp":
			transitionMs, valueCfg, err := decodeLegacyClipConfig(s.Kind, s.Config)
			if err != nil {
				return fmt.Errorf("step %s: %w", s.ID, err)
			}
			rawCfg, err := json.Marshal(valueCfg)
			if err != nil {
				return fmt.Errorf("step %s: marshal value config: %w", s.ID, err)
			}
			startMs := cumulative
			if _, err := tx.ExecContext(ctx,
				`INSERT INTO effect_clips
                    (id, track_id, start_ms, transition_min_ms, transition_max_ms, kind, config)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
				uuid.New().String(), trackID,
				startMs, transitionMs, transitionMs,
				s.Kind, string(rawCfg)); err != nil {
				return fmt.Errorf("insert clip: %w", err)
			}
			cumulative += transitionMs
			if cumulative > maxEnd {
				maxEnd = cumulative
			}
		default:
			return fmt.Errorf("step %s: unknown kind %q", s.ID, s.Kind)
		}
	}

	durationMs := maxEnd
	if eff.Loop {
		durationMs += stepLoopTailMs
	}
	if _, err := tx.ExecContext(ctx,
		`UPDATE effects SET duration_ms = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		durationMs, eff.ID); err != nil {
		return fmt.Errorf("update duration: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}
	committed = true
	return nil
}

func waitDurationFromLegacyConfig(raw string) (int, error) {
	var v struct {
		DurationMS int `json:"duration_ms"`
	}
	if err := json.Unmarshal([]byte(raw), &v); err != nil {
		return 0, fmt.Errorf("unmarshal wait config: %w", err)
	}
	if v.DurationMS < 0 {
		return 0, nil
	}
	return v.DurationMS, nil
}

func decodeLegacyClipConfig(kind, raw string) (int, any, error) {
	switch kind {
	case "set_on_off":
		var v struct {
			Value        bool `json:"value"`
			TransitionMS int  `json:"transition_ms"`
		}
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			return 0, nil, fmt.Errorf("unmarshal set_on_off config: %w", err)
		}
		return clampNonNegative(v.TransitionMS), SetOnOffClipConfig{Value: v.Value}, nil
	case "set_brightness":
		var v struct {
			Value        int `json:"value"`
			TransitionMS int `json:"transition_ms"`
		}
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			return 0, nil, fmt.Errorf("unmarshal set_brightness config: %w", err)
		}
		return clampNonNegative(v.TransitionMS), SetBrightnessClipConfig{Value: v.Value}, nil
	case "set_color_rgb":
		var v struct {
			R            int `json:"r"`
			G            int `json:"g"`
			B            int `json:"b"`
			TransitionMS int `json:"transition_ms"`
		}
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			return 0, nil, fmt.Errorf("unmarshal set_color_rgb config: %w", err)
		}
		return clampNonNegative(v.TransitionMS), SetColorRGBClipConfig{R: v.R, G: v.G, B: v.B}, nil
	case "set_color_temp":
		var v struct {
			Mireds       int `json:"mireds"`
			TransitionMS int `json:"transition_ms"`
		}
		if err := json.Unmarshal([]byte(raw), &v); err != nil {
			return 0, nil, fmt.Errorf("unmarshal set_color_temp config: %w", err)
		}
		return clampNonNegative(v.TransitionMS), SetColorTempClipConfig{Mireds: v.Mireds}, nil
	}
	return 0, nil, fmt.Errorf("unsupported legacy clip kind %q", kind)
}

func clampNonNegative(n int) int {
	if n < 0 {
		return 0
	}
	return n
}
