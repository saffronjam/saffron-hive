package lightfield

import (
	"errors"
	"time"
)

// SourceKind records how a canonical field was authored.
type SourceKind string

const (
	SourcePreset SourceKind = "preset"
	SourcePhoto  SourceKind = "photo"
	SourceGuided SourceKind = "guided"
)

// Recommendations are creation-time defaults carried into the saved Vibe.
type Recommendations struct {
	Brightness float64
	Movement   float64
	Cycle      time.Duration
}

// Preset is an immutable catalogue template.
type Preset struct {
	ID       string
	Title    string
	Category string
	Field    Field
	Seed     int64
	Defaults Recommendations
}

// PresetRecipe selects one catalogue item.
type PresetRecipe struct {
	ID string
}

// PhotoRecipe supplies an ephemeral raster and the requested field domain.
type PhotoRecipe struct {
	Domain Domain
	Raster Raster
}

// SourceRecipe contains exactly one source-specific recipe.
type SourceRecipe struct {
	Kind   SourceKind
	Seed   int64
	Preset *PresetRecipe
	Photo  *PhotoRecipe
	Guided *GuidedRecipe
}

// Provenance is compact descriptive metadata. It never contains photo bytes,
// filenames, image metadata, or filesystem paths.
type Provenance struct {
	Kind              SourceKind
	PresetID          string
	PresetTitle       string
	GuidedDomain      Domain
	GuidedSelectedIDs []string
}

// CompiledSource is the source-independent value persisted by a Vibe.
type CompiledSource struct {
	Field      Field
	Seed       int64
	Defaults   Recommendations
	Provenance Provenance
}

// PresetLookup resolves an embedded catalogue item without coupling the field
// package to a catalogue implementation.
type PresetLookup func(id string) (Preset, bool)

// Compile turns preset, photo, and guided recipes into the same canonical
// field representation.
func Compile(recipe SourceRecipe, lookup PresetLookup) (CompiledSource, error) {
	switch recipe.Kind {
	case SourcePreset:
		if lookup == nil || recipe.Preset == nil || recipe.Preset.ID == "" || recipe.Photo != nil || recipe.Guided != nil {
			return CompiledSource{}, errors.New("preset compilation requires only a preset ID and lookup")
		}
		preset, ok := lookup(recipe.Preset.ID)
		if !ok {
			return CompiledSource{}, errors.New("unknown Vibe preset")
		}
		if err := preset.Field.Validate(); err != nil {
			return CompiledSource{}, err
		}
		seed := recipe.Seed
		if seed == 0 {
			seed = preset.Seed
		}
		return CompiledSource{
			Field:      cloneField(preset.Field),
			Seed:       seed,
			Defaults:   preset.Defaults,
			Provenance: Provenance{Kind: SourcePreset, PresetID: preset.ID, PresetTitle: preset.Title},
		}, nil
	case SourcePhoto:
		if recipe.Photo == nil || recipe.Preset != nil || recipe.Guided != nil {
			return CompiledSource{}, errors.New("photo compilation requires only a raster")
		}
		field, err := CompilePhoto(recipe.Photo.Raster, recipe.Photo.Domain)
		if err != nil {
			return CompiledSource{}, err
		}
		return CompiledSource{
			Field:      field,
			Seed:       recipe.Seed,
			Defaults:   Recommendations{Brightness: 0.8, Movement: 0.3, Cycle: 12 * time.Minute},
			Provenance: Provenance{Kind: SourcePhoto},
		}, nil
	case SourceGuided:
		if recipe.Guided == nil || recipe.Preset != nil || recipe.Photo != nil {
			return CompiledSource{}, errors.New("guided compilation requires only a guided recipe")
		}
		field, err := CompileGuided(*recipe.Guided)
		if err != nil {
			return CompiledSource{}, err
		}
		return CompiledSource{
			Field:    field,
			Seed:     recipe.Guided.Seed,
			Defaults: Recommendations{Brightness: 0.8, Movement: 0.25, Cycle: 15 * time.Minute},
			Provenance: Provenance{
				Kind:              SourceGuided,
				GuidedDomain:      recipe.Guided.Domain,
				GuidedSelectedIDs: append([]string(nil), recipe.Guided.SelectedIDs...),
			},
		}, nil
	default:
		return CompiledSource{}, errors.New("unknown Vibe source kind")
	}
}

// DeriveSeed deterministically creates a fresh signed seed for a variation.
func DeriveSeed(seed int64, variation uint64) int64 {
	derived := int64(splitmix64(uint64(seed) ^ splitmix64(variation+0x9e3779b97f4a7c15)))
	if derived == seed {
		derived = int64(splitmix64(uint64(derived) + 1))
	}
	return derived
}

// Shuffle changes only seed-dependent spatial and temporal interpretation.
func Shuffle(source CompiledSource, variation uint64) CompiledSource {
	source.Field = cloneField(source.Field)
	source.Provenance.GuidedSelectedIDs = append([]string(nil), source.Provenance.GuidedSelectedIDs...)
	source.Seed = DeriveSeed(source.Seed, variation)
	return source
}

// TransformPoint applies one of eight seed-selected square symmetries without
// modifying field samples or bounds.
func TransformPoint(point Point, seed int64) Point {
	switch splitmix64(uint64(seed)) % 8 {
	case 0:
		return point
	case 1:
		return Point{X: 1 - point.X, Y: point.Y}
	case 2:
		return Point{X: point.X, Y: 1 - point.Y}
	case 3:
		return Point{X: 1 - point.X, Y: 1 - point.Y}
	case 4:
		return Point{X: point.Y, Y: point.X}
	case 5:
		return Point{X: 1 - point.Y, Y: point.X}
	case 6:
		return Point{X: point.Y, Y: 1 - point.X}
	default:
		return Point{X: 1 - point.Y, Y: 1 - point.X}
	}
}

func cloneField(field Field) Field {
	cloned := field
	cloned.Samples = make([]Sample, len(field.Samples))
	for i, sample := range field.Samples {
		if sample.Color != nil {
			value := *sample.Color
			cloned.Samples[i].Color = &value
		}
		if sample.White != nil {
			value := *sample.White
			cloned.Samples[i].White = &value
		}
	}
	return cloned
}
