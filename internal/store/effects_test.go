package store

import (
	"context"
	"database/sql"
	"errors"
	"reflect"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/effect"
)

var _ effect.EffectStore = (*DB)(nil)

func TestCreateEffectTimeline(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	icon := "sparkles"
	e, err := s.CreateEffect(ctx, CreateEffectParams{
		ID:   "eff-1",
		Name: "Sunrise",
		Icon: &icon,
		Kind: effect.KindTimeline,
		Loop: false,
		Steps: []EffectStepInput{
			{ID: "step-1", Index: 0, Kind: effect.StepSetOnOff, ConfigJSON: `{"value":true,"transition_ms":0}`},
			{ID: "step-2", Index: 1, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":500}`},
			{ID: "step-3", Index: 2, Kind: effect.StepSetBrightness, ConfigJSON: `{"value":200,"transition_ms":1000}`},
		},
	})
	if err != nil {
		t.Fatalf("create effect: %v", err)
	}
	if e.ID != "eff-1" || e.Name != "Sunrise" || e.Kind != effect.KindTimeline {
		t.Fatalf("unexpected effect row: %+v", e)
	}
	if e.Icon == nil || *e.Icon != "sparkles" {
		t.Fatalf("icon = %v, want sparkles", e.Icon)
	}
	if e.Loop {
		t.Fatalf("loop = true, want false")
	}
	if len(e.Steps) != 3 {
		t.Fatalf("steps len = %d, want 3", len(e.Steps))
	}
	for i, s := range e.Steps {
		if s.Index != i {
			t.Errorf("step %d index = %d, want %d", i, s.Index, i)
		}
	}
	if e.CreatedAt.IsZero() || e.UpdatedAt.IsZero() {
		t.Error("expected timestamps to be set")
	}
}

func TestCreateEffectNative(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	native := "candle"
	e, err := s.CreateEffect(ctx, CreateEffectParams{
		ID:         "eff-native",
		Name:       "Candle",
		Kind:       effect.KindNative,
		NativeName: &native,
		Loop:       true,
	})
	if err != nil {
		t.Fatalf("create native effect: %v", err)
	}
	if e.Kind != effect.KindNative {
		t.Fatalf("kind = %q, want native", e.Kind)
	}
	if e.NativeName == nil || *e.NativeName != "candle" {
		t.Fatalf("native_name = %v, want candle", e.NativeName)
	}
	if !e.Loop {
		t.Fatalf("loop = false, want true")
	}
	if len(e.Steps) != 0 {
		t.Fatalf("steps len = %d, want 0", len(e.Steps))
	}
}

func TestGetEffectNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.GetEffect(ctx, "missing")
	if err == nil {
		t.Fatal("expected error for missing effect")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}

func TestListEffects(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	for _, n := range []string{"a", "b", "c"} {
		if _, err := s.CreateEffect(ctx, CreateEffectParams{
			ID: "eff-" + n, Name: n, Kind: effect.KindTimeline,
		}); err != nil {
			t.Fatalf("create %s: %v", n, err)
		}
	}

	all, err := s.ListEffects(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(all) != 3 {
		t.Fatalf("len = %d, want 3", len(all))
	}
}

func TestUpdateEffectMutableFields(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	icon := "old"
	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "Original", Icon: &icon, Kind: effect.KindTimeline, Loop: false,
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	newName := "Renamed"
	newIcon := "new"
	loop := true
	updated, err := s.UpdateEffect(ctx, "eff-1", UpdateEffectParams{
		Name:    &newName,
		SetIcon: true,
		Icon:    &newIcon,
		Loop:    &loop,
	})
	if err != nil {
		t.Fatalf("update: %v", err)
	}
	if updated.Name != "Renamed" {
		t.Errorf("name = %q, want Renamed", updated.Name)
	}
	if updated.Icon == nil || *updated.Icon != "new" {
		t.Errorf("icon = %v, want new", updated.Icon)
	}
	if !updated.Loop {
		t.Error("loop = false, want true")
	}

	cleared, err := s.UpdateEffect(ctx, "eff-1", UpdateEffectParams{SetIcon: true, Icon: nil})
	if err != nil {
		t.Fatalf("clear icon: %v", err)
	}
	if cleared.Icon != nil {
		t.Errorf("icon = %v, want nil after clear", cleared.Icon)
	}
}

func TestUpdateEffectClearNativeName(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	native := "candle"
	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "Native", Kind: effect.KindNative, NativeName: &native,
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	cleared, err := s.UpdateEffect(ctx, "eff-1", UpdateEffectParams{
		SetNativeName: true,
		NativeName:    nil,
	})
	if err != nil {
		t.Fatalf("clear native_name: %v", err)
	}
	if cleared.NativeName != nil {
		t.Errorf("native_name = %v, want nil", cleared.NativeName)
	}
}

func TestSaveEffectStepsReplaces(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "Sunrise", Kind: effect.KindTimeline,
		Steps: []EffectStepInput{
			{ID: "s-1", Index: 0, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":100}`},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := s.SaveEffectSteps(ctx, "eff-1", []EffectStepInput{
		{ID: "s-2", Index: 0, Kind: effect.StepSetOnOff, ConfigJSON: `{"value":true,"transition_ms":0}`},
		{ID: "s-3", Index: 1, Kind: effect.StepSetBrightness, ConfigJSON: `{"value":255,"transition_ms":500}`},
	}); err != nil {
		t.Fatalf("save: %v", err)
	}

	got, err := s.ListEffectSteps(ctx, "eff-1")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("len = %d, want 2", len(got))
	}
	if got[0].ID != "s-2" || got[1].ID != "s-3" {
		t.Fatalf("ids = %q,%q want s-2,s-3", got[0].ID, got[1].ID)
	}
	if got[0].Index != 0 || got[1].Index != 1 {
		t.Fatalf("indices = %d,%d", got[0].Index, got[1].Index)
	}
}

func TestSaveEffectStepsAtomicOnConflict(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "x", Kind: effect.KindTimeline,
		Steps: []EffectStepInput{
			{ID: "seed", Index: 0, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":1}`},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	err := s.SaveEffectSteps(ctx, "eff-1", []EffectStepInput{
		{ID: "dup", Index: 0, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":1}`},
		{ID: "dup", Index: 1, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":2}`},
	})
	if err == nil {
		t.Fatal("expected duplicate primary-key failure")
	}

	got, err := s.ListEffectSteps(ctx, "eff-1")
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(got) != 1 || got[0].ID != "seed" {
		t.Fatalf("seed steps mutated by failed save: %+v", got)
	}
}

func TestDeleteEffectCascadesSteps(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "x", Kind: effect.KindTimeline,
		Steps: []EffectStepInput{
			{ID: "s-1", Index: 0, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":1}`},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := s.DeleteEffect(ctx, "eff-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	steps, err := s.ListEffectSteps(ctx, "eff-1")
	if err != nil {
		t.Fatalf("list after delete: %v", err)
	}
	if len(steps) != 0 {
		t.Errorf("len = %d, want 0", len(steps))
	}
}

func TestUpsertActiveEffectReplacesByTarget(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "eff-a", Name: "a", Kind: effect.KindTimeline}); err != nil {
		t.Fatalf("create eff-a: %v", err)
	}
	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "eff-b", Name: "b", Kind: effect.KindTimeline}); err != nil {
		t.Fatalf("create eff-b: %v", err)
	}

	now := time.Date(2026, 4, 24, 12, 0, 0, 0, time.UTC)
	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID:         "active-1",
		EffectID:   "eff-a",
		TargetType: "device",
		TargetID:   "dev-1",
		StartedAt:  now,
		Volatile:   true,
	}); err != nil {
		t.Fatalf("upsert 1: %v", err)
	}

	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID:         "active-2",
		EffectID:   "eff-b",
		TargetType: "device",
		TargetID:   "dev-1",
		StartedAt:  now.Add(time.Second),
		Volatile:   false,
	}); err != nil {
		t.Fatalf("upsert 2: %v", err)
	}

	all, err := s.ListActiveEffects(ctx)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	if len(all) != 1 {
		t.Fatalf("active rows = %d, want 1 (target uniqueness)", len(all))
	}
	got := all[0]
	if got.EffectID != "eff-b" {
		t.Errorf("effect_id = %q, want eff-b", got.EffectID)
	}
	if got.Volatile {
		t.Errorf("volatile = true, want false after second upsert")
	}
	if !got.StartedAt.Equal(now.Add(time.Second)) {
		t.Errorf("started_at = %v, want %v", got.StartedAt, now.Add(time.Second))
	}
}

func TestDeleteActiveEffect(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "eff-1", Name: "x", Kind: effect.KindTimeline}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID:         "active-1",
		EffectID:   "eff-1",
		TargetType: "device",
		TargetID:   "dev-1",
		StartedAt:  time.Now(),
		Volatile:   true,
	}); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if err := s.DeleteActiveEffect(ctx, "device", "dev-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	all, _ := s.ListActiveEffects(ctx)
	if len(all) != 0 {
		t.Errorf("len = %d, want 0", len(all))
	}
}

func TestDeleteVolatileActiveEffects(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "eff-1", Name: "x", Kind: effect.KindTimeline}); err != nil {
		t.Fatalf("create: %v", err)
	}

	now := time.Now()
	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID: "v-1", EffectID: "eff-1", TargetType: "device", TargetID: "dev-1",
		StartedAt: now, Volatile: true,
	}); err != nil {
		t.Fatalf("upsert volatile: %v", err)
	}
	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID: "p-1", EffectID: "eff-1", TargetType: "device", TargetID: "dev-2",
		StartedAt: now, Volatile: false,
	}); err != nil {
		t.Fatalf("upsert persistent: %v", err)
	}

	n, err := s.DeleteVolatileActiveEffects(ctx)
	if err != nil {
		t.Fatalf("delete volatile: %v", err)
	}
	if n != 1 {
		t.Errorf("n = %d, want 1", n)
	}

	all, _ := s.ListActiveEffects(ctx)
	if len(all) != 1 || all[0].ID != "p-1" {
		t.Errorf("remaining = %+v, want only p-1", all)
	}
}

func TestActiveEffectCascadesOnEffectDelete(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{ID: "eff-1", Name: "x", Kind: effect.KindTimeline}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := s.UpsertActiveEffect(ctx, effect.UpsertActiveEffectParams{
		ID:         "active-1",
		EffectID:   "eff-1",
		TargetType: "device",
		TargetID:   "dev-1",
		StartedAt:  time.Now(),
		Volatile:   true,
	}); err != nil {
		t.Fatalf("upsert: %v", err)
	}
	if err := s.DeleteEffect(ctx, "eff-1"); err != nil {
		t.Fatalf("delete effect: %v", err)
	}
	all, _ := s.ListActiveEffects(ctx)
	if len(all) != 0 {
		t.Errorf("len = %d, want 0 after parent effect deleted", len(all))
	}
}

func TestLoadEffectRoundTrip(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	icon := "sparkles"
	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID:   "eff-load",
		Name: "Sunrise",
		Icon: &icon,
		Kind: effect.KindTimeline,
		Loop: false,
		Steps: []EffectStepInput{
			{ID: "step-1", Index: 0, Kind: effect.StepSetOnOff, ConfigJSON: `{"value":true,"transition_ms":0}`},
			{ID: "step-2", Index: 1, Kind: effect.StepWait, ConfigJSON: `{"duration_ms":500}`},
			{ID: "step-3", Index: 2, Kind: effect.StepSetColorRGB, ConfigJSON: `{"r":244,"g":42,"b":23,"transition_ms":200}`},
		},
	}); err != nil {
		t.Fatalf("create effect: %v", err)
	}

	got, err := s.LoadEffect(ctx, "eff-load")
	if err != nil {
		t.Fatalf("load effect: %v", err)
	}
	if got.ID != "eff-load" || got.Name != "Sunrise" || got.Icon != "sparkles" {
		t.Fatalf("unexpected scalar fields: %+v", got)
	}
	if got.Kind != effect.KindTimeline {
		t.Fatalf("kind = %q, want timeline", got.Kind)
	}
	if got.Loop {
		t.Fatal("loop = true, want false")
	}
	if len(got.Steps) != 3 {
		t.Fatalf("steps len = %d, want 3", len(got.Steps))
	}

	wantSteps := []effect.Step{
		{ID: "step-1", Index: 0, Kind: effect.StepSetOnOff, Config: effect.StepConfig{SetOnOff: &effect.SetOnOffConfig{Value: true}}},
		{ID: "step-2", Index: 1, Kind: effect.StepWait, Config: effect.StepConfig{Wait: &effect.WaitConfig{DurationMS: 500}}},
		{ID: "step-3", Index: 2, Kind: effect.StepSetColorRGB, Config: effect.StepConfig{SetColorRGB: &effect.SetColorRGBConfig{R: 244, G: 42, B: 23, TransitionMS: 200}}},
	}
	if !reflect.DeepEqual(got.Steps, wantSteps) {
		t.Fatalf("steps mismatch:\n got %+v\nwant %+v", got.Steps, wantSteps)
	}
}

func TestLoadEffectNative(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	native := "candle"
	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID:         "eff-native",
		Name:       "Candle",
		Kind:       effect.KindNative,
		NativeName: &native,
		Loop:       true,
	}); err != nil {
		t.Fatalf("create native effect: %v", err)
	}

	got, err := s.LoadEffect(ctx, "eff-native")
	if err != nil {
		t.Fatalf("load native effect: %v", err)
	}
	if got.Kind != effect.KindNative {
		t.Fatalf("kind = %q, want native", got.Kind)
	}
	if got.NativeName != "candle" {
		t.Fatalf("native_name = %q, want candle", got.NativeName)
	}
	if !got.Loop {
		t.Fatal("loop = false, want true")
	}
	if len(got.Steps) != 0 {
		t.Fatalf("steps len = %d, want 0", len(got.Steps))
	}
}

func TestLoadEffectNotFound(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.LoadEffect(ctx, "missing")
	if err == nil {
		t.Fatal("expected error for missing effect")
	}
	if !errors.Is(err, sql.ErrNoRows) {
		t.Errorf("expected sql.ErrNoRows, got %v", err)
	}
}
