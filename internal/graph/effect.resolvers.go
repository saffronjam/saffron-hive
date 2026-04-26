package graph

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// nativeEffectTerminators are the effect-cap values that exist purely to
// stop a running native effect. They are filtered out of the user-facing
// nativeEffectOptions list so the editor only offers playable programs.
var nativeEffectTerminators = []string{
	"stop_effect",
	"finish_effect",
	"stop_hue_effect",
}

// validateEffectInput rejects effect inputs whose step kinds carry malformed
// JSON for their declared kind, and enforces the kind-vs-payload invariants:
// native effects need a non-empty nativeName and no steps; timeline effects
// must not set nativeName. Empty timeline step lists are allowed so the
// create flow can persist a fresh effect that the user fills in afterwards.
func validateEffectInput(kind model.EffectKind, nativeName *string, steps []*model.EffectStepInput) error {
	switch kind {
	case model.EffectKindNative:
		if nativeName == nil || strings.TrimSpace(*nativeName) == "" {
			return fmt.Errorf("native effect requires a non-empty nativeName")
		}
		if len(steps) > 0 {
			return fmt.Errorf("native effect must not have steps")
		}
	case model.EffectKindTimeline:
		if nativeName != nil && strings.TrimSpace(*nativeName) != "" {
			return fmt.Errorf("timeline effect must not set nativeName")
		}
	default:
		return fmt.Errorf("unknown effect kind %q", kind)
	}
	for i, s := range steps {
		stepKind := stepKindFromModel(s.Kind)
		if _, err := effect.UnmarshalConfig(stepKind, []byte(s.Config)); err != nil {
			return fmt.Errorf("step %d (%s): %w", i, s.Kind, err)
		}
	}
	return nil
}

// buildEffectStepInputs assigns IDs and indices to step inputs and validates
// each config payload by parsing and re-marshalling it. The re-marshalled JSON
// is the canonical disk shape — extraneous fields in user-supplied JSON are
// dropped at this point.
func buildEffectStepInputs(steps []*model.EffectStepInput) ([]store.EffectStepInput, error) {
	out := make([]store.EffectStepInput, len(steps))
	for i, s := range steps {
		stepKind := stepKindFromModel(s.Kind)
		cfg, err := effect.UnmarshalConfig(stepKind, []byte(s.Config))
		if err != nil {
			return nil, fmt.Errorf("step %d (%s): %w", i, s.Kind, err)
		}
		raw, err := effect.MarshalConfig(stepKind, cfg)
		if err != nil {
			return nil, fmt.Errorf("step %d (%s): re-marshal: %w", i, s.Kind, err)
		}
		out[i] = store.EffectStepInput{
			ID:         uuid.New().String(),
			Index:      i,
			Kind:       stepKind,
			ConfigJSON: string(raw),
		}
	}
	return out, nil
}

func mapEffect(row store.Effect) *model.Effect {
	domainSteps := make([]effect.Step, 0, len(row.Steps))
	modelSteps := make([]*model.EffectStep, 0, len(row.Steps))
	for _, s := range row.Steps {
		domainSteps = append(domainSteps, effect.Step{
			ID:    s.ID,
			Index: s.Index,
			Kind:  s.Kind,
		})
		modelSteps = append(modelSteps, &model.EffectStep{
			ID:     s.ID,
			Index:  s.Index,
			Kind:   stepKindToModel(s.Kind),
			Config: s.ConfigJSON,
		})
	}
	domain := effect.Effect{Kind: row.Kind, Steps: domainSteps}
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
		Steps:                modelSteps,
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

func stepKindFromModel(k model.EffectStepKind) effect.StepKind {
	switch k {
	case model.EffectStepKindWait:
		return effect.StepWait
	case model.EffectStepKindSetOnOff:
		return effect.StepSetOnOff
	case model.EffectStepKindSetBrightness:
		return effect.StepSetBrightness
	case model.EffectStepKindSetColorRgb:
		return effect.StepSetColorRGB
	case model.EffectStepKindSetColorTemp:
		return effect.StepSetColorTemp
	}
	return effect.StepKind("")
}

func stepKindToModel(k effect.StepKind) model.EffectStepKind {
	switch k {
	case effect.StepWait:
		return model.EffectStepKindWait
	case effect.StepSetOnOff:
		return model.EffectStepKindSetOnOff
	case effect.StepSetBrightness:
		return model.EffectStepKindSetBrightness
	case effect.StepSetColorRGB:
		return model.EffectStepKindSetColorRgb
	case effect.StepSetColorTemp:
		return model.EffectStepKindSetColorTemp
	}
	return model.EffectStepKindWait
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
