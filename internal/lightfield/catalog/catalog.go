// Package catalog loads Hive's immutable embedded Vibe templates.
package catalog

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

//go:embed presets.json
var embeddedPresets []byte

var (
	loadOnce sync.Once
	loaded   []lightfield.Preset
	loadErr  error
)

type rawPreset struct {
	ID           string            `json:"id"`
	Category     string            `json:"category"`
	Domain       lightfield.Domain `json:"domain"`
	Seed         int64             `json:"seed"`
	Brightness   float64           `json:"brightness"`
	Movement     float64           `json:"movement"`
	CycleSeconds float64           `json:"cycleSeconds"`
	Field        lightfield.Field  `json:"field"`
}

// Entries returns catalogue entries in their explicit presentation order.
func Entries() ([]lightfield.Preset, error) {
	load()
	if loadErr != nil {
		return nil, loadErr
	}
	entries := make([]lightfield.Preset, len(loaded))
	for i := range loaded {
		entries[i] = clonePreset(loaded[i])
	}
	return entries, nil
}

// Lookup returns a detached copy of one embedded preset.
func Lookup(id string) (lightfield.Preset, bool) {
	load()
	if loadErr != nil {
		return lightfield.Preset{}, false
	}
	for _, entry := range loaded {
		if entry.ID == id {
			return clonePreset(entry), true
		}
	}
	return lightfield.Preset{}, false
}

func load() {
	loadOnce.Do(func() {
		loaded, loadErr = Parse(embeddedPresets)
	})
}

func clonePreset(preset lightfield.Preset) lightfield.Preset {
	cloned := preset
	cloned.Field.Samples = make([]lightfield.Sample, len(preset.Field.Samples))
	for i, sample := range preset.Field.Samples {
		cloned.Field.Samples[i] = sample
		if sample.Color != nil {
			value := *sample.Color
			cloned.Field.Samples[i].Color = &value
		}
		if sample.White != nil {
			value := *sample.White
			cloned.Field.Samples[i].White = &value
		}
	}
	return cloned
}

// Parse validates catalogue JSON and returns detached canonical templates.
func Parse(data []byte) ([]lightfield.Preset, error) {
	var raw []rawPreset
	if err := json.Unmarshal(data, &raw); err != nil {
		return nil, fmt.Errorf("decode Vibe catalogue: %w", err)
	}
	if len(raw) == 0 {
		return nil, errors.New("Vibe catalogue is empty")
	}
	seen := map[string]bool{}
	domains := map[lightfield.Domain]bool{}
	entries := make([]lightfield.Preset, len(raw))
	for i, item := range raw {
		if item.ID == "" || item.Category == "" {
			return nil, fmt.Errorf("catalogue entry %d is missing identity metadata", i)
		}
		if seen[item.ID] {
			return nil, fmt.Errorf("duplicate catalogue ID %q", item.ID)
		}
		seen[item.ID] = true
		if item.Domain != item.Field.Domain {
			return nil, fmt.Errorf("catalogue entry %q domain does not match its field", item.ID)
		}
		if err := item.Field.Validate(); err != nil {
			return nil, fmt.Errorf("catalogue entry %q: %w", item.ID, err)
		}
		if !bounded(item.Brightness) || !bounded(item.Movement) || !finitePositive(item.CycleSeconds) {
			return nil, fmt.Errorf("catalogue entry %q has invalid defaults", item.ID)
		}
		domains[item.Domain] = true
		entries[i] = lightfield.Preset{
			ID:       item.ID,
			Category: item.Category,
			Field:    item.Field,
			Seed:     item.Seed,
			Defaults: lightfield.Recommendations{
				Brightness: item.Brightness,
				Movement:   item.Movement,
				Cycle:      time.Duration(item.CycleSeconds * float64(time.Second)),
			},
		}
	}
	if !domains[lightfield.DomainFullColor] || !domains[lightfield.DomainWhiteAmbience] {
		return nil, errors.New("Vibe catalogue must contain both field domains")
	}
	return entries, nil
}

func bounded(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0) && value >= 0 && value <= 1
}

func finitePositive(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0) && value > 0
}
