package graph

import (
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// nativeEffectTerminators are the effect-cap values that exist purely to stop
// a running native effect. They are filtered out of the user-facing
// nativeEffectOptions list so the editor only offers playable programs.
var nativeEffectTerminators = []string{
	"stop_effect",
	"finish_effect",
	"stop_hue_effect",
}

// validateEffectInput rejects effect inputs whose clip kinds carry malformed
// JSON, and enforces the kind-vs-payload invariants:
//   - native effects require a non-empty nativeName and no tracks
//   - timeline effects must not set nativeName
//   - durationMs must be non-negative
//   - within a track, clips must not overlap
//   - when loop=true, no clip may extend past durationMs
func validateEffectInput(kind model.EffectKind, nativeName *string, loop bool, durationMs int, tracks []*model.EffectTrackInput) error {
	switch kind {
	case model.EffectKindNative:
		if nativeName == nil || strings.TrimSpace(*nativeName) == "" {
			return fmt.Errorf("native effect requires a non-empty nativeName")
		}
		if len(tracks) > 0 {
			return fmt.Errorf("native effect must not have tracks")
		}
	case model.EffectKindTimeline:
		if nativeName != nil && strings.TrimSpace(*nativeName) != "" {
			return fmt.Errorf("timeline effect must not set nativeName")
		}
	default:
		return fmt.Errorf("unknown effect kind %q", kind)
	}
	if durationMs < 0 {
		return fmt.Errorf("durationMs must be non-negative (got %d)", durationMs)
	}
	for ti, t := range tracks {
		if err := validateClips(loop, durationMs, ti, t.Clips); err != nil {
			return err
		}
	}
	return nil
}

// validateClips enforces per-track clip invariants: each clip's config parses,
// transition bounds are well-formed, clips do not overlap each other, and
// (when loop=true) no clip extends past durationMs.
func validateClips(loop bool, durationMs, trackIndex int, clips []*model.EffectClipInput) error {
	type interval struct {
		start, end int
	}
	intervals := make([]interval, 0, len(clips))
	for ci, c := range clips {
		clipKind := clipKindFromModel(c.Kind)
		if _, err := effect.UnmarshalClipConfig(clipKind, []byte(c.Config)); err != nil {
			return fmt.Errorf("track %d clip %d (%s): %w", trackIndex, ci, c.Kind, err)
		}
		if c.StartMs < 0 {
			return fmt.Errorf("track %d clip %d: startMs must be non-negative", trackIndex, ci)
		}
		if c.TransitionMinMs < 0 {
			return fmt.Errorf("track %d clip %d: transitionMinMs must be non-negative", trackIndex, ci)
		}
		if c.TransitionMaxMs < c.TransitionMinMs {
			return fmt.Errorf("track %d clip %d: transitionMaxMs must be >= transitionMinMs", trackIndex, ci)
		}
		end := c.StartMs + c.TransitionMaxMs
		if loop && durationMs > 0 && end > durationMs {
			return fmt.Errorf("track %d clip %d extends past durationMs (%d > %d)", trackIndex, ci, end, durationMs)
		}
		intervals = append(intervals, interval{start: c.StartMs, end: end})
	}
	sort.Slice(intervals, func(i, j int) bool { return intervals[i].start < intervals[j].start })
	for i := 1; i < len(intervals); i++ {
		if intervals[i].start < intervals[i-1].end {
			return fmt.Errorf("track %d clips overlap: %d-%d and %d-%d",
				trackIndex,
				intervals[i-1].start, intervals[i-1].end,
				intervals[i].start, intervals[i].end)
		}
	}
	return nil
}

// buildEffectTrackInputs assigns IDs to track + clip inputs and validates each
// config payload by parsing and re-marshalling it. The re-marshalled JSON is
// the canonical disk shape — extraneous fields in user-supplied JSON are
// dropped at this point.
func buildEffectTrackInputs(tracks []*model.EffectTrackInput) ([]store.EffectTrackInput, error) {
	out := make([]store.EffectTrackInput, len(tracks))
	for ti, t := range tracks {
		clips := make([]store.EffectClipInput, len(t.Clips))
		for ci, c := range t.Clips {
			clipKind := clipKindFromModel(c.Kind)
			cfg, err := effect.UnmarshalClipConfig(clipKind, []byte(c.Config))
			if err != nil {
				return nil, fmt.Errorf("track %d clip %d (%s): %w", ti, ci, c.Kind, err)
			}
			raw, err := effect.MarshalClipConfig(clipKind, cfg)
			if err != nil {
				return nil, fmt.Errorf("track %d clip %d (%s): re-marshal: %w", ti, ci, c.Kind, err)
			}
			clips[ci] = store.EffectClipInput{
				ID:              uuid.New().String(),
				StartMs:         c.StartMs,
				TransitionMinMs: c.TransitionMinMs,
				TransitionMaxMs: c.TransitionMaxMs,
				Kind:            clipKind,
				ConfigJSON:      string(raw),
			}
		}
		out[ti] = store.EffectTrackInput{
			ID:    uuid.New().String(),
			Index: ti,
			Clips: clips,
		}
	}
	return out, nil
}

func mapEffect(row store.Effect) *model.Effect {
	domainTracks := make([]effect.Track, 0, len(row.Tracks))
	modelTracks := make([]*model.EffectTrack, 0, len(row.Tracks))
	for _, tr := range row.Tracks {
		domainClips := make([]effect.Clip, 0, len(tr.Clips))
		modelClips := make([]*model.EffectClip, 0, len(tr.Clips))
		for _, cl := range tr.Clips {
			domainClips = append(domainClips, effect.Clip{
				ID:              cl.ID,
				StartMs:         cl.StartMs,
				TransitionMinMs: cl.TransitionMinMs,
				TransitionMaxMs: cl.TransitionMaxMs,
				Kind:            cl.Kind,
			})
			modelClips = append(modelClips, &model.EffectClip{
				ID:              cl.ID,
				StartMs:         cl.StartMs,
				TransitionMinMs: cl.TransitionMinMs,
				TransitionMaxMs: cl.TransitionMaxMs,
				Kind:            clipKindToModel(cl.Kind),
				Config:          cl.ConfigJSON,
			})
		}
		domainTracks = append(domainTracks, effect.Track{
			ID:    tr.ID,
			Index: tr.Index,
			Clips: domainClips,
		})
		modelTracks = append(modelTracks, &model.EffectTrack{
			ID:    tr.ID,
			Index: tr.Index,
			Clips: modelClips,
		})
	}
	domain := effect.Effect{Kind: row.Kind, Tracks: domainTracks}
	caps := domain.RequiredCapabilities()
	if caps == nil {
		caps = []string{}
	}
	out := &model.Effect{
		ID:                   row.ID,
		Name:                 row.Name,
		Icon:                 row.Icon,
		Kind:                 modelKindFromStore(row.Kind),
		NativeName:           row.NativeName,
		Loop:                 row.Loop,
		DurationMs:           row.DurationMs,
		Tracks:               modelTracks,
		RequiredCapabilities: caps,
		CreatedBy:            mapUserRef(row.CreatedBy),
		CreatedAt:            row.CreatedAt,
		UpdatedAt:            row.UpdatedAt,
	}
	return out
}

func mapActiveEffect(row effect.ActiveEffectRecord, eff store.Effect) *model.ActiveEffect {
	return &model.ActiveEffect{
		ID:         row.ID,
		Effect:     mapEffect(eff),
		TargetType: row.TargetType,
		TargetID:   row.TargetID,
		StartedAt:  row.StartedAt,
		Volatile:   row.Volatile,
	}
}

func effectKindFromModel(k model.EffectKind) effect.Kind {
	switch k {
	case model.EffectKindNative:
		return effect.KindNative
	case model.EffectKindTimeline:
		return effect.KindTimeline
	}
	return effect.KindTimeline
}

func modelKindFromStore(k effect.Kind) model.EffectKind {
	switch k {
	case effect.KindNative:
		return model.EffectKindNative
	case effect.KindTimeline:
		return model.EffectKindTimeline
	}
	return model.EffectKindTimeline
}

func clipKindFromModel(k model.EffectClipKind) effect.ClipKind {
	switch k {
	case model.EffectClipKindSetOnOff:
		return effect.ClipSetOnOff
	case model.EffectClipKindSetBrightness:
		return effect.ClipSetBrightness
	case model.EffectClipKindSetColorRgb:
		return effect.ClipSetColorRGB
	case model.EffectClipKindSetColorTemp:
		return effect.ClipSetColorTemp
	case model.EffectClipKindNativeEffect:
		return effect.ClipNativeEffect
	}
	return effect.ClipKind("")
}

func clipKindToModel(k effect.ClipKind) model.EffectClipKind {
	switch k {
	case effect.ClipSetOnOff:
		return model.EffectClipKindSetOnOff
	case effect.ClipSetBrightness:
		return model.EffectClipKindSetBrightness
	case effect.ClipSetColorRGB:
		return model.EffectClipKindSetColorRgb
	case effect.ClipSetColorTemp:
		return model.EffectClipKindSetColorTemp
	case effect.ClipNativeEffect:
		return model.EffectClipKindNativeEffect
	}
	return model.EffectClipKindSetOnOff
}

// sentenceCase converts a snake_case identifier into a sentence-cased display
// name: "stop_hue_effect" -> "Stop hue effect".
func sentenceCase(name string) string {
	parts := strings.Split(strings.ReplaceAll(name, "-", "_"), "_")
	if len(parts) == 0 {
		return name
	}
	parts[0] = capitalize(parts[0])
	for i := 1; i < len(parts); i++ {
		parts[i] = strings.ToLower(parts[i])
	}
	return strings.Join(parts, " ")
}

func capitalize(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + strings.ToLower(s[1:])
}
