package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateEffect inserts a new effect (and its initial steps, if any) atomically
// and returns the resulting row.
func (s *DB) CreateEffect(ctx context.Context, params CreateEffectParams) (Effect, error) {
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.CreateEffect(ctx, sqlite.CreateEffectParams{
			ID:         params.ID,
			Name:       params.Name,
			Icon:       params.Icon,
			Kind:       string(params.Kind),
			NativeName: params.NativeName,
			Loop:       boolToInt64(params.Loop),
			CreatedBy:  params.CreatedBy,
		}); err != nil {
			return fmt.Errorf("insert effect: %w", err)
		}
		for _, st := range params.Steps {
			if err := q.CreateEffectStep(ctx, sqlite.CreateEffectStepParams{
				ID:        st.ID,
				EffectID:  params.ID,
				StepIndex: int64(st.Index),
				Kind:      string(st.Kind),
				Config:    st.ConfigJSON,
			}); err != nil {
				return fmt.Errorf("insert effect step: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return Effect{}, fmt.Errorf("create effect: %w", err)
	}
	return s.GetEffect(ctx, params.ID)
}

// GetEffect retrieves an effect by its ID, including its ordered step list.
func (s *DB) GetEffect(ctx context.Context, id string) (Effect, error) {
	row, err := s.q.GetEffect(ctx, id)
	if err != nil {
		return Effect{}, fmt.Errorf("get effect: %w", err)
	}
	steps, err := s.listEffectSteps(ctx, id)
	if err != nil {
		return Effect{}, err
	}
	return Effect{
		ID:         row.ID,
		Name:       row.Name,
		Icon:       row.Icon,
		Kind:       effect.Kind(row.Kind),
		NativeName: row.NativeName,
		Loop:       row.Loop != 0,
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
		CreatedBy:  userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
		Steps:      steps,
	}, nil
}

// ListEffects returns all effects with their ordered step lists.
func (s *DB) ListEffects(ctx context.Context) ([]Effect, error) {
	rows, err := s.q.ListEffects(ctx)
	if err != nil {
		return nil, fmt.Errorf("list effects: %w", err)
	}
	if len(rows) == 0 {
		return nil, nil
	}
	out := make([]Effect, 0, len(rows))
	for _, r := range rows {
		steps, err := s.listEffectSteps(ctx, r.ID)
		if err != nil {
			return nil, err
		}
		out = append(out, Effect{
			ID:         r.ID,
			Name:       r.Name,
			Icon:       r.Icon,
			Kind:       effect.Kind(r.Kind),
			NativeName: r.NativeName,
			Loop:       r.Loop != 0,
			CreatedAt:  r.CreatedAt,
			UpdatedAt:  r.UpdatedAt,
			CreatedBy:  userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
			Steps:      steps,
		})
	}
	return out, nil
}

// UpdateEffect updates an effect's mutable fields. Steps are not touched here;
// use SaveEffectSteps to atomically replace the step list.
func (s *DB) UpdateEffect(ctx context.Context, id string, params UpdateEffectParams) (Effect, error) {
	clearIcon := params.SetIcon && params.Icon == nil
	clearNativeName := params.SetNativeName && params.NativeName == nil

	args := sqlite.UpdateEffectParams{
		Name: params.Name,
		ID:   id,
	}
	if params.SetIcon && params.Icon != nil {
		args.Icon = params.Icon
	}
	if params.Kind != nil {
		k := string(*params.Kind)
		args.Kind = &k
	}
	if params.SetNativeName && params.NativeName != nil {
		args.NativeName = params.NativeName
	}
	if params.Loop != nil {
		v := boolToInt64(*params.Loop)
		args.Loop = &v
	}
	if err := s.q.UpdateEffect(ctx, args); err != nil {
		return Effect{}, fmt.Errorf("update effect: %w", err)
	}
	if clearIcon {
		if err := s.q.ClearEffectIcon(ctx, id); err != nil {
			return Effect{}, fmt.Errorf("clear effect icon: %w", err)
		}
	}
	if clearNativeName {
		if err := s.q.ClearEffectNativeName(ctx, id); err != nil {
			return Effect{}, fmt.Errorf("clear effect native_name: %w", err)
		}
	}
	return s.GetEffect(ctx, id)
}

// DeleteEffect deletes an effect by its ID. Cascading deletes remove the
// associated steps and any active_effects rows pointing at the effect.
func (s *DB) DeleteEffect(ctx context.Context, id string) error {
	if err := s.q.DeleteEffect(ctx, id); err != nil {
		return fmt.Errorf("delete effect: %w", err)
	}
	return nil
}

// SaveEffectSteps atomically replaces the step list of an effect with the
// given input set. Existing steps are deleted in the same transaction so
// concurrent readers never observe a half-written timeline.
func (s *DB) SaveEffectSteps(ctx context.Context, effectID string, steps []EffectStepInput) error {
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.DeleteEffectStepsByEffect(ctx, effectID); err != nil {
			return fmt.Errorf("delete effect steps: %w", err)
		}
		for _, st := range steps {
			if err := q.CreateEffectStep(ctx, sqlite.CreateEffectStepParams{
				ID:        st.ID,
				EffectID:  effectID,
				StepIndex: int64(st.Index),
				Kind:      string(st.Kind),
				Config:    st.ConfigJSON,
			}); err != nil {
				return fmt.Errorf("create effect step: %w", err)
			}
		}
		return nil
	})
}

// ListEffectSteps returns the ordered step list for a single effect.
func (s *DB) ListEffectSteps(ctx context.Context, effectID string) ([]EffectStep, error) {
	return s.listEffectSteps(ctx, effectID)
}

func (s *DB) listEffectSteps(ctx context.Context, effectID string) ([]EffectStep, error) {
	rows, err := s.q.ListEffectSteps(ctx, effectID)
	if err != nil {
		return nil, fmt.Errorf("list effect steps: %w", err)
	}
	out := make([]EffectStep, 0, len(rows))
	for _, r := range rows {
		out = append(out, EffectStep{
			ID:         r.ID,
			EffectID:   r.EffectID,
			Index:      int(r.StepIndex),
			Kind:       effect.StepKind(r.Kind),
			ConfigJSON: r.Config,
		})
	}
	return out, nil
}

// UpsertActiveEffect marks (target_type, target_id) as currently running an
// effect. An existing row for the target is overwritten so a target can only
// have one effect active at a time.
func (s *DB) UpsertActiveEffect(ctx context.Context, params UpsertActiveEffectParams) error {
	if err := s.q.UpsertActiveEffect(ctx, sqlite.UpsertActiveEffectParams{
		ID:         params.ID,
		EffectID:   params.EffectID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
		StartedAt:  params.StartedAt,
		Volatile:   boolToInt64(params.Volatile),
	}); err != nil {
		return fmt.Errorf("upsert active effect: %w", err)
	}
	return nil
}

// DeleteActiveEffect removes a single active-effect row by its ID.
func (s *DB) DeleteActiveEffect(ctx context.Context, id string) error {
	if err := s.q.DeleteActiveEffect(ctx, id); err != nil {
		return fmt.Errorf("delete active effect: %w", err)
	}
	return nil
}

// GetActiveEffectByTarget returns the active-effect row for a target, if any.
// Returns sql.ErrNoRows wrapped in an error when no row exists.
func (s *DB) GetActiveEffectByTarget(ctx context.Context, targetType, targetID string) (ActiveEffect, error) {
	row, err := s.q.GetActiveEffectByTarget(ctx, sqlite.GetActiveEffectByTargetParams{
		TargetType: targetType,
		TargetID:   targetID,
	})
	if err != nil {
		return ActiveEffect{}, fmt.Errorf("get active effect by target: %w", err)
	}
	return activeEffectFromRow(row.ID, row.EffectID, row.TargetType, row.TargetID, row.StartedAt, row.Volatile), nil
}

// ListActiveEffects returns every active-effect row.
func (s *DB) ListActiveEffects(ctx context.Context) ([]ActiveEffect, error) {
	rows, err := s.q.ListActiveEffects(ctx)
	if err != nil {
		return nil, fmt.Errorf("list active effects: %w", err)
	}
	out := make([]ActiveEffect, 0, len(rows))
	for _, r := range rows {
		out = append(out, activeEffectFromRow(r.ID, r.EffectID, r.TargetType, r.TargetID, r.StartedAt, r.Volatile))
	}
	return out, nil
}

// DeleteVolatileActiveEffects wipes every active-effect row whose volatile
// flag is set. Called at process startup so transient runner state from a
// previous lifetime does not look like still-active effects.
func (s *DB) DeleteVolatileActiveEffects(ctx context.Context) (int64, error) {
	n, err := s.q.DeleteVolatileActiveEffects(ctx)
	if err != nil {
		return 0, fmt.Errorf("delete volatile active effects: %w", err)
	}
	return n, nil
}

func activeEffectFromRow(id, effectID, targetType, targetID string, startedAt time.Time, volatile int64) ActiveEffect {
	return ActiveEffect{
		ID:         id,
		EffectID:   effectID,
		TargetType: targetType,
		TargetID:   targetID,
		StartedAt:  startedAt,
		Volatile:   volatile != 0,
	}
}

func boolToInt64(b bool) int64 {
	if b {
		return 1
	}
	return 0
}
