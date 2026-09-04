package lightfield

import (
	"reflect"
	"testing"
	"time"
)

func TestCompileSourcesShareCanonicalOutput(t *testing.T) {
	presetField := NewFullColor(2, 2, []ColorSample{
		{Lightness: 0.5, Chroma: 0.1, Hue: 20}, {Lightness: 0.6, Chroma: 0.1, Hue: 40},
		{Lightness: 0.7, Chroma: 0.1, Hue: 60}, {Lightness: 0.8, Chroma: 0.1, Hue: 80},
	})
	lookup := func(id string) (Preset, bool) {
		return Preset{ID: id, Category: "tests", Field: presetField, Seed: 19, Defaults: Recommendations{Brightness: 0.7, Movement: 0.2, Cycle: time.Minute}}, id == "test"
	}
	raster := generatedRaster(4, 4, func(x, y int) RasterPixel {
		return RasterPixel{R: uint8(x * 80), G: uint8(y * 80), B: 120, A: 255}
	})
	guided := guidedRecipeChoosingFirst(t, DomainFullColor, 8, 3)
	recipes := []SourceRecipe{
		{Kind: SourcePreset, Preset: &PresetRecipe{ID: "test"}},
		{Kind: SourcePhoto, Seed: 2, Photo: &PhotoRecipe{Domain: DomainFullColor, Raster: raster}},
		{Kind: SourceGuided, Guided: &guided},
	}
	for _, recipe := range recipes {
		compiled, err := Compile(recipe, lookup)
		if err != nil {
			t.Fatalf("%s: %v", recipe.Kind, err)
		}
		if compiled.Field.Validate() != nil || compiled.Provenance.Kind != recipe.Kind {
			t.Fatalf("%s output = %#v", recipe.Kind, compiled)
		}
		if _, err := Preview(compiled.Field, Motion{Seed: compiled.Seed, Movement: compiled.Defaults.Movement, Cycle: compiled.Defaults.Cycle}, time.Time{}, 4, 4, 3); err != nil {
			t.Fatalf("%s preview: %v", recipe.Kind, err)
		}
	}
}

func TestPhotoAndGuidedProvenanceIsCompact(t *testing.T) {
	raster := generatedRaster(2, 2, func(_, _ int) RasterPixel { return RasterPixel{R: 20, G: 30, B: 40, A: 255} })
	photo, err := Compile(SourceRecipe{Kind: SourcePhoto, Seed: 2, Photo: &PhotoRecipe{Domain: DomainWhiteAmbience, Raster: raster}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(photo.Provenance, Provenance{Kind: SourcePhoto}) {
		t.Fatalf("photo provenance = %#v", photo.Provenance)
	}
	guidedRecipe := guidedRecipeChoosingFirst(t, DomainWhiteAmbience, 4, 3)
	guided, err := Compile(SourceRecipe{Kind: SourceGuided, Guided: &guidedRecipe}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if guided.Provenance.GuidedDomain != DomainWhiteAmbience || !reflect.DeepEqual(guided.Provenance.GuidedSelectedIDs, guidedRecipe.SelectedIDs) {
		t.Fatalf("guided provenance = %#v", guided.Provenance)
	}
}

func TestShuffleChangesOnlySeedInterpretation(t *testing.T) {
	source := CompiledSource{
		Field: NewFullColor(2, 2, []ColorSample{
			{Lightness: 0.3, Chroma: 0.1, Hue: 10}, {Lightness: 0.5, Chroma: 0.12, Hue: 80},
			{Lightness: 0.7, Chroma: 0.14, Hue: 190}, {Lightness: 0.8, Chroma: 0.16, Hue: 300},
		}),
		Seed:       50,
		Defaults:   Recommendations{Brightness: 0.7, Movement: 0.4, Cycle: time.Minute},
		Provenance: Provenance{Kind: SourcePhoto},
	}
	shuffled := Shuffle(source, 1)
	if shuffled.Seed == source.Seed || !reflect.DeepEqual(shuffled.Field, source.Field) || shuffled.Defaults != source.Defaults || shuffled.Provenance.Kind != source.Provenance.Kind {
		t.Fatalf("shuffle changed source semantics: %#v %#v", source, shuffled)
	}
	point := Point{X: 0.2, Y: 0.7}
	changedTransform := false
	for variation := uint64(1); variation < 24; variation++ {
		candidate := Shuffle(source, variation)
		if TransformPoint(point, candidate.Seed) != TransformPoint(point, source.Seed) {
			changedTransform = true
			break
		}
	}
	if !changedTransform {
		t.Fatal("seed variations did not alter spatial transform")
	}
	at := time.Unix(1_700_000_000, 0)
	originalSample, _ := SampleAt(source.Field, point, Motion{Seed: source.Seed, Movement: source.Defaults.Movement, Cycle: source.Defaults.Cycle}, at)
	shuffledSample, _ := SampleAt(shuffled.Field, point, Motion{Seed: shuffled.Seed, Movement: shuffled.Defaults.Movement, Cycle: shuffled.Defaults.Cycle}, at)
	if reflect.DeepEqual(originalSample, shuffledSample) {
		t.Fatal("shuffle did not change temporal phase")
	}
}
