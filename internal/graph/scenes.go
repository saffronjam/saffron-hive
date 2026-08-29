package graph

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"math"
	"strconv"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
	"github.com/saffronjam/saffron-hive/internal/lightfield/catalog"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	photoSampleMaxSide    = 512
	photoSampleMaxPixels  = 512 * 512
	previewWidth          = 24
	previewHeight         = 16
	previewSwatches       = 5
	guidedPreviewWidth    = 12
	guidedPreviewHeight   = 8
	guidedPreviewSwatches = 3
)

var (
	vibePresetOnce   sync.Once
	vibePresetModels []*model.VibePreset
	vibePresetErr    error
)

func cachedVibePresets() ([]*model.VibePreset, error) {
	vibePresetOnce.Do(func() {
		entries, err := catalog.Entries()
		if err != nil {
			vibePresetErr = err
			return
		}
		vibePresetModels = make([]*model.VibePreset, len(entries))
		for i, entry := range entries {
			preview, err := lightfield.Preview(entry.Field, lightfield.Motion{
				Seed: entry.Seed, Cycle: entry.Defaults.Cycle,
			}, time.Unix(0, 0).UTC(), previewWidth, previewHeight, previewSwatches)
			if err != nil {
				vibePresetErr = err
				vibePresetModels = nil
				return
			}
			vibePresetModels[i] = &model.VibePreset{
				ID: entry.ID, Title: entry.Title, Category: entry.Category,
				Domain: model.VibeFieldDomain(entry.Field.Domain), Seed: strconv.FormatInt(entry.Seed, 10),
				Brightness: entry.Defaults.Brightness, Movement: entry.Defaults.Movement,
				CycleSeconds: entry.Defaults.Cycle.Seconds(), Preview: mapPreview(preview),
			}
		}
	})
	return vibePresetModels, vibePresetErr
}

func sceneDefinitionFromInput(input *model.SceneDefinitionInput, existing *store.SceneDefinition) (store.SceneDefinition, error) {
	if input == nil {
		return store.SceneDefinition{}, errors.New("scene definition is required")
	}
	if input.Lighting == nil {
		return store.SceneDefinition{}, errors.New("scene lighting is required")
	}
	overrides, err := sceneLightOverridesFromInput(input.Lighting.Overrides)
	if err != nil {
		return store.SceneDefinition{}, err
	}
	supporting, err := sceneSupportingStatesFromInput(input.SupportingStates)
	if err != nil {
		return store.SceneDefinition{}, err
	}
	definition := store.SceneDefinition{
		Targets: sceneTargetsFromInput(input.Targets),
		Lighting: store.SceneLighting{
			Overrides: overrides,
		},
		Supporting: supporting,
	}
	if dynamicInput := input.Lighting.DynamicSource.Value(); dynamicInput != nil {
		var existingDynamic *store.DynamicLighting
		if existing != nil {
			existingDynamic = existing.Lighting.Dynamic
		}
		dynamic, err := dynamicLightingFromInput(dynamicInput, existingDynamic)
		if err != nil {
			return store.SceneDefinition{}, err
		}
		definition.Lighting.Dynamic = &dynamic
	}
	if err := store.ValidateSceneDefinition(definition); err != nil {
		return store.SceneDefinition{}, err
	}
	return definition, nil
}

func dynamicLightingFromInput(input *model.DynamicSceneSourceInput, existing *store.DynamicLighting) (store.DynamicLighting, error) {
	if input == nil {
		return store.DynamicLighting{}, errors.New("dynamic source is required")
	}
	var dynamic store.DynamicLighting
	if input.Source.IsSet() {
		if input.Source.Value() == nil {
			return store.DynamicLighting{}, errors.New("dynamic source recipe cannot be null")
		}
		compiled, err := compileVibeSource(input.Source.Value())
		if err != nil {
			return store.DynamicLighting{}, err
		}
		dynamic = store.DynamicLighting{
			Field:      compiled.Field,
			Seed:       compiled.Seed,
			Brightness: compiled.Defaults.Brightness,
			Movement:   compiled.Defaults.Movement,
			Cycle:      compiled.Defaults.Cycle,
			Provenance: compiled.Provenance,
		}
	} else {
		if existing == nil {
			return store.DynamicLighting{}, errors.New("dynamic source recipe is required")
		}
		dynamic = *existing
	}
	if value := input.Brightness.Value(); value != nil {
		dynamic.Brightness = *value
	}
	if value := input.Movement.Value(); value != nil {
		dynamic.Movement = *value
	}
	if value := input.CycleSeconds.Value(); value != nil {
		if math.IsNaN(*value) || math.IsInf(*value, 0) || *value <= 0 || *value > float64((24*time.Hour)/time.Second) {
			return store.DynamicLighting{}, errors.New("Vibe cycleSeconds must be finite and between 0 and 86400")
		}
		dynamic.Cycle = time.Duration(*value * float64(time.Second))
	}
	if value := input.Seed.Value(); value != nil {
		seed, err := parseSceneSeed(*value)
		if err != nil {
			return store.DynamicLighting{}, err
		}
		dynamic.Seed = seed
	}
	return dynamic, nil
}

func compileVibeSource(input *model.VibeSourceInput) (lightfield.CompiledSource, error) {
	if input == nil {
		return lightfield.CompiledSource{}, errors.New("Vibe source is required")
	}
	count := boolInt(input.Preset.IsSet() && input.Preset.Value() != nil) +
		boolInt(input.Photo.IsSet() && input.Photo.Value() != nil) +
		boolInt(input.Guided.IsSet() && input.Guided.Value() != nil)
	if count != 1 {
		return lightfield.CompiledSource{}, errors.New("Vibe source requires exactly one preset, photo, or guided recipe")
	}
	var recipe lightfield.SourceRecipe
	switch {
	case input.Preset.IsSet() && input.Preset.Value() != nil:
		preset := input.Preset.Value()
		seed := int64(0)
		if value := preset.Seed.Value(); value != nil {
			parsed, err := parseSceneSeed(*value)
			if err != nil {
				return lightfield.CompiledSource{}, err
			}
			seed = parsed
		}
		recipe = lightfield.SourceRecipe{Kind: lightfield.SourcePreset, Seed: seed, Preset: &lightfield.PresetRecipe{ID: preset.PresetID}}
	case input.Photo.IsSet() && input.Photo.Value() != nil:
		photo := input.Photo.Value()
		seed, err := parseSceneSeed(photo.Seed)
		if err != nil {
			return lightfield.CompiledSource{}, err
		}
		raster, err := normalizedPhotoRaster(photo)
		if err != nil {
			return lightfield.CompiledSource{}, err
		}
		recipe = lightfield.SourceRecipe{Kind: lightfield.SourcePhoto, Seed: seed, Photo: &lightfield.PhotoRecipe{Domain: lightfield.Domain(photo.Domain), Raster: raster}}
	case input.Guided.IsSet() && input.Guided.Value() != nil:
		guided := input.Guided.Value()
		seed, err := parseSceneSeed(guided.Seed)
		if err != nil {
			return lightfield.CompiledSource{}, err
		}
		recipe = lightfield.SourceRecipe{Kind: lightfield.SourceGuided, Seed: seed, Guided: &lightfield.GuidedRecipe{Domain: lightfield.Domain(guided.Domain), Seed: seed, SelectedIDs: append([]string(nil), guided.SelectedIds...)}}
	}
	compiled, err := lightfield.Compile(recipe, catalog.Lookup)
	if err != nil {
		return lightfield.CompiledSource{}, fmt.Errorf("compile Vibe: %w", err)
	}
	return compiled, nil
}

func normalizedPhotoRaster(input *model.PhotoSampleInput) (lightfield.Raster, error) {
	if input.Width < 1 || input.Height < 1 || input.Width > photoSampleMaxSide || input.Height > photoSampleMaxSide ||
		input.Width > photoSampleMaxPixels/input.Height {
		return lightfield.Raster{}, errors.New("photo sample dimensions are invalid")
	}
	expected := input.Width * input.Height * 3
	maximumEncoded := base64.StdEncoding.EncodedLen(expected)
	if len(input.RgbBase64) != maximumEncoded {
		return lightfield.Raster{}, errors.New("photo sample byte length does not match its dimensions")
	}
	bytes, err := base64.StdEncoding.DecodeString(input.RgbBase64)
	if err != nil || len(bytes) != expected {
		return lightfield.Raster{}, errors.New("photo sample is not valid base64 RGB data")
	}
	pixels := make([]lightfield.RasterPixel, input.Width*input.Height)
	for i := range pixels {
		pixels[i] = lightfield.RasterPixel{R: bytes[i*3], G: bytes[i*3+1], B: bytes[i*3+2], A: 255}
	}
	return lightfield.Raster{Width: input.Width, Height: input.Height, Pixels: pixels}, nil
}

func parseSceneSeed(value string) (int64, error) {
	seed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return 0, errors.New("Vibe seed must be a signed 64-bit decimal string")
	}
	return seed, nil
}

func boolInt(value bool) int {
	if value {
		return 1
	}
	return 0
}

func validateSceneReferences(ctx context.Context, resolver *Resolver, definition store.SceneDefinition) error {
	for _, override := range definition.Lighting.Overrides {
		target, err := resolver.Store.GetDevice(ctx, override.DeviceID)
		if err != nil {
			return fmt.Errorf("scene light override device %q: %w", override.DeviceID, err)
		}
		if !device.IsLightControlDevice(target) {
			return fmt.Errorf("scene light override device %q is not a light", override.DeviceID)
		}
		switch override.Kind {
		case store.SceneLightOverrideEffect:
			if _, err := resolver.Store.GetEffect(ctx, override.EffectID); err != nil {
				return fmt.Errorf("scene effect %q: %w", override.EffectID, err)
			}
		case store.SceneLightOverrideNativeEffect:
			if resolver.NativeEffectSupport != nil {
				status, err := resolver.NativeEffectSupport.Status(ctx, target, override.NativeEffectName)
				if err != nil {
					return err
				}
				if status == device.NativeEffectSupportUnsupported {
					return fmt.Errorf("native effect %q is unsupported by device %q", override.NativeEffectName, override.DeviceID)
				}
			}
		}
	}
	for _, supporting := range definition.Supporting {
		target, err := resolver.Store.GetDevice(ctx, supporting.DeviceID)
		if err != nil {
			return fmt.Errorf("scene supporting device %q: %w", supporting.DeviceID, err)
		}
		if device.IsLightControlDevice(target) {
			return fmt.Errorf("scene supporting device %q is a light", supporting.DeviceID)
		}
		if target.Type == device.Sensor {
			return fmt.Errorf("scene supporting device %q is a sensor", supporting.DeviceID)
		}
	}
	return nil
}

func compilePreview(input *model.PreviewVibeInput) (lightfield.CompiledSource, store.DynamicLighting, error) {
	if input == nil || input.Source == nil {
		return lightfield.CompiledSource{}, store.DynamicLighting{}, errors.New("Vibe preview source is required")
	}
	compiled, err := compileVibeSource(input.Source)
	if err != nil {
		return lightfield.CompiledSource{}, store.DynamicLighting{}, err
	}
	dynamic := store.DynamicLighting{
		Field: compiled.Field, Seed: compiled.Seed, Brightness: compiled.Defaults.Brightness,
		Movement: compiled.Defaults.Movement, Cycle: compiled.Defaults.Cycle, Provenance: compiled.Provenance,
	}
	if value := input.Brightness.Value(); value != nil {
		dynamic.Brightness = *value
	}
	if value := input.Movement.Value(); value != nil {
		dynamic.Movement = *value
	}
	if value := input.CycleSeconds.Value(); value != nil {
		dynamic.Cycle = time.Duration(*value * float64(time.Second))
	}
	test := store.SceneDefinition{
		Targets:  []store.SceneTarget{{Type: device.TargetDevice, ID: "preview"}},
		Lighting: store.SceneLighting{Dynamic: &dynamic},
	}
	if err := store.ValidateSceneDefinition(test); err != nil {
		return lightfield.CompiledSource{}, store.DynamicLighting{}, err
	}
	return compiled, dynamic, nil
}

func fieldLightnessBounds(field lightfield.Field) (float64, float64) {
	minimum, maximum := 1.0, 0.0
	for _, sample := range field.Samples {
		value := 0.0
		if sample.Color != nil {
			value = sample.Color.Lightness
		} else if sample.White != nil {
			value = sample.White.Brightness
		}
		minimum = min(minimum, value)
		maximum = max(maximum, value)
	}
	return minimum, maximum
}
