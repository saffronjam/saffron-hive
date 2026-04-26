package store

import (
	"context"
	"database/sql"
	"errors"
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
		ID:         "eff-1",
		Name:       "Sunrise",
		Icon:       &icon,
		Kind:       effect.KindTimeline,
		Loop:       false,
		DurationMs: 1500,
		Tracks: []EffectTrackInput{
			{
				ID:    "track-1",
				Index: 0,
				Clips: []EffectClipInput{
					{ID: "clip-1", StartMs: 0, TransitionMinMs: 0, TransitionMaxMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
					{ID: "clip-2", StartMs: 500, TransitionMinMs: 1000, TransitionMaxMs: 1000, Kind: effect.ClipSetBrightness, ConfigJSON: `{"value":200}`},
				},
			},
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
	if e.DurationMs != 1500 {
		t.Fatalf("durationMs = %d, want 1500", e.DurationMs)
	}
	if len(e.Tracks) != 1 || len(e.Tracks[0].Clips) != 2 {
		t.Fatalf("expected 1 track with 2 clips, got %+v", e.Tracks)
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
	if len(e.Tracks) != 0 {
		t.Fatalf("tracks len = %d, want 0", len(e.Tracks))
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
	dur := 2000
	updated, err := s.UpdateEffect(ctx, "eff-1", UpdateEffectParams{
		Name:       &newName,
		SetIcon:    true,
		Icon:       &newIcon,
		Loop:       &loop,
		DurationMs: &dur,
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
	if updated.DurationMs != 2000 {
		t.Errorf("durationMs = %d, want 2000", updated.DurationMs)
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

func TestSaveEffectTracksReplaces(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "Sunrise", Kind: effect.KindTimeline,
		Tracks: []EffectTrackInput{
			{ID: "t-seed", Index: 0, Clips: []EffectClipInput{
				{ID: "c-seed", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
			}},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := s.SaveEffectTracks(ctx, "eff-1", []EffectTrackInput{
		{ID: "t-2", Index: 0, Clips: []EffectClipInput{
			{ID: "c-a", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
		}},
		{ID: "t-3", Index: 1, Clips: []EffectClipInput{
			{ID: "c-b", StartMs: 0, TransitionMaxMs: 500, Kind: effect.ClipSetBrightness, ConfigJSON: `{"value":255}`},
		}},
	}); err != nil {
		t.Fatalf("save: %v", err)
	}

	got, err := s.GetEffect(ctx, "eff-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if len(got.Tracks) != 2 {
		t.Fatalf("len = %d, want 2", len(got.Tracks))
	}
	if got.Tracks[0].ID != "t-2" || got.Tracks[1].ID != "t-3" {
		t.Fatalf("ids = %q,%q want t-2,t-3", got.Tracks[0].ID, got.Tracks[1].ID)
	}
	if got.Tracks[0].Clips[0].ID != "c-a" || got.Tracks[1].Clips[0].ID != "c-b" {
		t.Fatalf("clip ids = %q,%q want c-a,c-b", got.Tracks[0].Clips[0].ID, got.Tracks[1].Clips[0].ID)
	}
}

func TestSaveEffectTracksAtomicOnConflict(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "x", Kind: effect.KindTimeline,
		Tracks: []EffectTrackInput{
			{ID: "seed-track", Index: 0, Clips: []EffectClipInput{
				{ID: "seed-clip", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
			}},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}

	err := s.SaveEffectTracks(ctx, "eff-1", []EffectTrackInput{
		{ID: "dup", Index: 0, Clips: []EffectClipInput{
			{ID: "ca", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
		}},
		{ID: "dup", Index: 1, Clips: []EffectClipInput{
			{ID: "cb", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":false}`},
		}},
	})
	if err == nil {
		t.Fatal("expected duplicate primary-key failure")
	}

	got, err := s.GetEffect(ctx, "eff-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if len(got.Tracks) != 1 || got.Tracks[0].ID != "seed-track" {
		t.Fatalf("seed tracks mutated by failed save: %+v", got.Tracks)
	}
}

func TestDeleteEffectCascadesTracksAndClips(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "x", Kind: effect.KindTimeline,
		Tracks: []EffectTrackInput{
			{ID: "t-1", Index: 0, Clips: []EffectClipInput{
				{ID: "c-1", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
			}},
		},
	}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := s.DeleteEffect(ctx, "eff-1"); err != nil {
		t.Fatalf("delete: %v", err)
	}
	row := s.RawDB().QueryRowContext(ctx, `SELECT COUNT(*) FROM effect_tracks WHERE effect_id = ?`, "eff-1")
	var n int
	if err := row.Scan(&n); err != nil {
		t.Fatalf("count tracks: %v", err)
	}
	if n != 0 {
		t.Errorf("tracks remaining after delete = %d, want 0", n)
	}
}

func TestUpdateEffectDuration(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateEffect(ctx, CreateEffectParams{
		ID: "eff-1", Name: "x", Kind: effect.KindTimeline, DurationMs: 100,
	}); err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := s.UpdateEffectDuration(ctx, "eff-1", 750); err != nil {
		t.Fatalf("UpdateEffectDuration: %v", err)
	}
	got, err := s.GetEffect(ctx, "eff-1")
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if got.DurationMs != 750 {
		t.Errorf("durationMs = %d, want 750", got.DurationMs)
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
		ID:         "eff-load",
		Name:       "Sunrise",
		Icon:       &icon,
		Kind:       effect.KindTimeline,
		Loop:       false,
		DurationMs: 800,
		Tracks: []EffectTrackInput{
			{ID: "t-1", Index: 0, Clips: []EffectClipInput{
				{ID: "c-1", StartMs: 0, Kind: effect.ClipSetOnOff, ConfigJSON: `{"value":true}`},
				{ID: "c-2", StartMs: 500, TransitionMinMs: 200, TransitionMaxMs: 200, Kind: effect.ClipSetColorRGB, ConfigJSON: `{"r":244,"g":42,"b":23}`},
			}},
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
	if got.DurationMs != 800 {
		t.Fatalf("duration_ms = %d, want 800", got.DurationMs)
	}
	if len(got.Tracks) != 1 || len(got.Tracks[0].Clips) != 2 {
		t.Fatalf("expected 1 track with 2 clips, got %+v", got.Tracks)
	}
	clip := got.Tracks[0].Clips[1]
	if clip.Kind != effect.ClipSetColorRGB {
		t.Fatalf("clip kind = %q", clip.Kind)
	}
	if clip.Config.SetColorRGB == nil ||
		clip.Config.SetColorRGB.R != 244 ||
		clip.Config.SetColorRGB.G != 42 ||
		clip.Config.SetColorRGB.B != 23 {
		t.Fatalf("clip color = %+v", clip.Config.SetColorRGB)
	}
	if clip.TransitionMinMs != 200 || clip.TransitionMaxMs != 200 {
		t.Fatalf("transition = (%d,%d)", clip.TransitionMinMs, clip.TransitionMaxMs)
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
	if len(got.Tracks) != 0 {
		t.Fatalf("tracks len = %d, want 0", len(got.Tracks))
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
