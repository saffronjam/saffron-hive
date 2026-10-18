package graph

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
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

func deviceAdvertisesNativeEffect(dev device.Device, name string) bool {
	for _, capability := range dev.Capabilities {
		if capability.Name != device.CapEffect || !capability.CanSet() {
			continue
		}
		for _, value := range capability.Values {
			if value == name {
				return true
			}
		}
	}
	return false
}

func (r *Resolver) nativeEffectStatus(ctx context.Context, dev device.Device, name string) (device.NativeEffectSupportStatus, error) {
	if r.NativeEffectSupport == nil {
		return device.NativeEffectSupportUntested, nil
	}
	return r.NativeEffectSupport.Status(ctx, dev, name)
}

func (r *Resolver) nativeEffectTargetDevices(ctx context.Context, targetType device.TargetType, targetID, name string) []device.Device {
	ids := r.TargetResolver.ResolveTargetDeviceIDs(ctx, targetType, targetID)
	out := make([]device.Device, 0, len(ids))
	seen := make(map[device.DeviceID]struct{}, len(ids))
	for _, id := range ids {
		if _, duplicate := seen[id]; duplicate {
			continue
		}
		seen[id] = struct{}{}
		dev, ok := r.StateReader.GetDevice(id)
		if !ok || dev.RuntimeDisabled() || dev.Removed || !deviceAdvertisesNativeEffect(dev, name) {
			continue
		}
		out = append(out, dev)
	}
	return out
}

func nativeEffectSupportStatusToModel(status device.NativeEffectSupportStatus) model.NativeEffectSupportStatus {
	switch status {
	case device.NativeEffectSupportConfirmed:
		return model.NativeEffectSupportStatusConfirmed
	case device.NativeEffectSupportUnsupported:
		return model.NativeEffectSupportStatusUnsupported
	default:
		return model.NativeEffectSupportStatusUntested
	}
}

func nativeEffectRunStatusToModel(status device.NativeEffectRunStatus) model.NativeEffectRunStatus {
	switch status {
	case device.NativeEffectRunConfirmed:
		return model.NativeEffectRunStatusConfirmed
	case device.NativeEffectRunUnsupported:
		return model.NativeEffectRunStatusUnsupported
	default:
		return model.NativeEffectRunStatusUnconfirmed
	}
}

func validateEffectInput(kind model.EffectKind, nativeName *string, loop bool, durationMs int, tracks []*model.EffectTrackInput) error {
	e := effect.Effect{Kind: effectKindFromModel(kind), Loop: loop, DurationMs: durationMs}
	if nativeName != nil {
		e.NativeName = *nativeName
	}
	for _, t := range tracks {
		track := effect.Track{Name: t.Name}
		if t.ID.Value() != nil {
			track.ID = *t.ID.Value()
		}
		for _, c := range t.Clips {
			clipKind := clipKindFromModel(c.Kind)
			config := *c.Config
			clip := effect.Clip{Kind: clipKind, Config: config, StartMs: c.StartMs, TransitionMinMs: c.TransitionMinMs, TransitionMaxMs: c.TransitionMaxMs}
			if id := c.ID.Value(); id != nil {
				clip.ID = *id
			}
			track.Clips = append(track.Clips, clip)
		}
		e.Tracks = append(e.Tracks, track)
	}
	return effect.Validate(e)
}

// buildEffectTrackInputs assigns IDs to track + clip inputs and validates each
// config payload by parsing and re-marshalling it. The re-marshalled JSON is
// the canonical disk shape.
func buildEffectTrackInputs(tracks []*model.EffectTrackInput) ([]store.EffectTrackInput, error) {
	out := make([]store.EffectTrackInput, len(tracks))
	for ti, t := range tracks {
		clips := make([]store.EffectClipInput, len(t.Clips))
		for ci, c := range t.Clips {
			clipKind := clipKindFromModel(c.Kind)
			cfg := *c.Config
			raw, err := effect.EncodeClipConfig(clipKind, cfg)
			if err != nil {
				return nil, fmt.Errorf("track %d clip %d (%s): re-marshal: %w", ti, ci, c.Kind, err)
			}
			clipID := uuid.New().String()
			if id := c.ID.Value(); id != nil && *id != "" {
				clipID = *id
			}
			clips[ci] = store.EffectClipInput{
				ID:              clipID,
				StartMs:         c.StartMs,
				TransitionMinMs: c.TransitionMinMs,
				TransitionMaxMs: c.TransitionMaxMs,
				Kind:            clipKind,
				ConfigJSON:      string(raw),
			}
		}
		trackID := uuid.New().String()
		if id := t.ID.Value(); id != nil && *id != "" {
			trackID = *id
		}
		out[ti] = store.EffectTrackInput{
			ID:    trackID,
			Index: ti,
			Name:  t.Name,
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
			cfg, _ := effect.DecodeClipConfig(cl.Kind, []byte(cl.ConfigJSON))
			domainClips = append(domainClips, effect.Clip{
				ID:              cl.ID,
				StartMs:         cl.StartMs,
				TransitionMinMs: cl.TransitionMinMs,
				TransitionMaxMs: cl.TransitionMaxMs,
				Kind:            cl.Kind,
				Config:          cfg,
			})
			modelClips = append(modelClips, &model.EffectClip{
				ID:              cl.ID,
				StartMs:         cl.StartMs,
				TransitionMinMs: cl.TransitionMinMs,
				TransitionMaxMs: cl.TransitionMaxMs,
				Kind:            clipKindToModel(cl.Kind),
				Config:          &cfg,
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
			Name:  tr.Name,
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
		Revision:             int(row.Revision),
		Name:                 row.Name,
		Source:               "hive",
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
	case model.EffectClipKindSetColor:
		return effect.ClipSetColor
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
	case effect.ClipSetColor:
		return model.EffectClipKindSetColor
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
