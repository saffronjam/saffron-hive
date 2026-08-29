package lightfield

import (
	"errors"
	"fmt"
	"math"
)

const (
	guidedMinRounds   = 3
	guidedMaxRounds   = 5
	guidedOptionCount = 5
	guidedGridSize    = 6
)

// GuidedRecipe is the complete portable state of a guided preference session.
type GuidedRecipe struct {
	Domain      Domain   `json:"domain"`
	Seed        int64    `json:"seed"`
	SelectedIDs []string `json:"selectedIds"`
}

// GuidedOption is one accessible choice presented in a guided round.
type GuidedOption struct {
	ID    string
	Title string
	Color *ColorSample
	White *WhiteSample
}

// GuidedOptions returns the next deterministic choices. Existing
// selections are validated against the choices that were available in their
// rounds, so edited or invented option IDs cannot enter a compiled recipe.
func GuidedOptions(recipe GuidedRecipe) ([]GuidedOption, error) {
	if recipe.Domain != DomainFullColor && recipe.Domain != DomainWhiteAmbience {
		return nil, errors.New("guided domain must be full_color or white_ambience")
	}
	if len(recipe.SelectedIDs) >= guidedMaxRounds {
		return nil, errors.New("guided session already has five selections")
	}
	selected, err := resolveGuidedSelections(recipe)
	if err != nil {
		return nil, err
	}
	return guidedRoundOptions(recipe.Domain, recipe.Seed, len(selected), selected), nil
}

// CompileGuided turns three to five validated preferences into a harmonious,
// low-frequency canonical field.
func CompileGuided(recipe GuidedRecipe) (Field, error) {
	if len(recipe.SelectedIDs) < guidedMinRounds || len(recipe.SelectedIDs) > guidedMaxRounds {
		return Field{}, errors.New("guided compilation requires three to five selections")
	}
	selected, err := resolveGuidedSelections(recipe)
	if err != nil {
		return Field{}, err
	}
	if recipe.Domain == DomainFullColor {
		field := compileGuidedColor(recipe.Seed, selected)
		return field, field.Validate()
	}
	if recipe.Domain == DomainWhiteAmbience {
		field := compileGuidedWhite(recipe.Seed, selected)
		return field, field.Validate()
	}
	return Field{}, errors.New("guided domain must be full_color or white_ambience")
}

func resolveGuidedSelections(recipe GuidedRecipe) ([]GuidedOption, error) {
	selected := make([]GuidedOption, 0, len(recipe.SelectedIDs))
	for round, id := range recipe.SelectedIDs {
		options := guidedRoundOptions(recipe.Domain, recipe.Seed, round, selected)
		matched := false
		for _, option := range options {
			if option.ID == id {
				selected = append(selected, option)
				matched = true
				break
			}
		}
		if !matched {
			return nil, fmt.Errorf("guided selection %d has invalid option ID %q", round+1, id)
		}
	}
	return selected, nil
}

func guidedRoundOptions(domain Domain, seed int64, round int, selected []GuidedOption) []GuidedOption {
	if domain == DomainWhiteAmbience {
		return guidedWhiteOptions(seed, round, selected)
	}
	return guidedColorOptions(seed, round, selected)
}

func guidedColorOptions(seed int64, round int, selected []GuidedOption) []GuidedOption {
	baseHue, baseLightness := guidedColorPreference(selected)
	var hues []float64
	if round == 0 {
		offset := hashUnit(uint64(seed)) * 72
		hues = []float64{offset, offset + 72, offset + 144, offset + 216, offset + 288}
	} else {
		spread := max(32, 52-float64(round)*5)
		hues = []float64{baseHue - 2*spread, baseHue - spread, baseHue, baseHue + spread, baseHue + 150}
	}
	lightnessOffsets := []float64{-0.08, 0.04, 0, 0.1, -0.04}
	options := make([]GuidedOption, guidedOptionCount)
	for i := range options {
		hue := math.Mod(hues[i]+360, 360)
		lightness := clamp(baseLightness+lightnessOffsets[i], 0.46, 0.82)
		colour := ColorSample{Lightness: lightness, Chroma: 0.13 + 0.015*float64((round+i)%3), Hue: hue}
		options[i] = GuidedOption{
			ID:    guidedOptionID(DomainFullColor, seed, round, i, selected),
			Title: guidedColorTitle(hue),
			Color: &colour,
		}
	}
	return permuteGuidedOptions(options, seed, round)
}

func guidedWhiteOptions(seed int64, round int, selected []GuidedOption) []GuidedOption {
	baseMireds, baseBrightness := guidedWhitePreference(selected)
	var mireds []float64
	var brightnesses []float64
	var titles []string
	if round == 0 {
		mireds = []float64{165, 240, 310, 400, 490}
		brightnesses = []float64{0.82, 0.72, 0.65, 0.58, 0.48}
		titles = []string{"Daylight", "Cool", "Neutral", "Warm", "Candlelight"}
	} else {
		spread := max(48, 80-float64(round)*8)
		mireds = []float64{baseMireds - 2*spread, baseMireds, baseMireds, baseMireds, baseMireds + 2*spread}
		brightnesses = []float64{baseBrightness + 0.06, baseBrightness + 0.16, baseBrightness, baseBrightness - 0.16, baseBrightness - 0.06}
		titles = []string{"Cooler", "Brighter", "Balanced", "Softer", "Warmer"}
	}
	options := make([]GuidedOption, guidedOptionCount)
	for i := range options {
		white := WhiteSample{
			Brightness: clamp(brightnesses[i], 0.3, 0.95),
			Mireds:     clamp(mireds[i], 160, 500),
		}
		options[i] = GuidedOption{
			ID:    guidedOptionID(DomainWhiteAmbience, seed, round, i, selected),
			Title: titles[i],
			White: &white,
		}
	}
	return permuteGuidedOptions(options, seed, round)
}

func compileGuidedColor(seed int64, selected []GuidedOption) Field {
	anchors := guidedColorAnchors(seed, selected)
	samples := make([]ColorSample, guidedGridSize*guidedGridSize)
	for y := range guidedGridSize {
		for x := range guidedGridSize {
			nx := float64(x) / float64(guidedGridSize-1)
			ny := float64(y) / float64(guidedGridSize-1)
			samples[y*guidedGridSize+x] = blendGuidedColors(nx, ny, anchors)
		}
	}
	return NewFullColor(guidedGridSize, guidedGridSize, samples)
}

type guidedColorAnchor struct {
	point Point
	color ColorSample
}

func guidedColorAnchors(seed int64, selected []GuidedOption) []guidedColorAnchor {
	points := []Point{
		{X: 0, Y: 0},
		{X: 1, Y: 1},
		{X: 1, Y: 0},
		{X: 0, Y: 1},
		{X: 0.4, Y: 0.6},
	}
	state := splitmix64(uint64(seed) ^ 0x9e3779b97f4a7c15)
	for i := len(points) - 1; i > 0; i-- {
		state = splitmix64(state)
		j := int(state % uint64(i+1))
		points[i], points[j] = points[j], points[i]
	}
	anchors := make([]guidedColorAnchor, len(selected))
	for i, option := range selected {
		anchors[i] = guidedColorAnchor{point: points[i], color: *option.Color}
	}
	return anchors
}

func blendGuidedColors(x, y float64, anchors []guidedColorAnchor) ColorSample {
	const influence = 0.18
	var lightness, chroma, hueX, hueY, total float64
	for _, anchor := range anchors {
		dx := x - anchor.point.X
		dy := y - anchor.point.Y
		distanceSquared := dx*dx + dy*dy
		if distanceSquared < 1e-12 {
			return anchor.color
		}
		weight := math.Exp(-distanceSquared / influence)
		hue := anchor.color.Hue * math.Pi / 180
		lightness += anchor.color.Lightness * weight
		chroma += anchor.color.Chroma * weight
		hueX += math.Cos(hue) * anchor.color.Chroma * weight
		hueY += math.Sin(hue) * anchor.color.Chroma * weight
		total += weight
	}
	hue := math.Atan2(hueY, hueX) * 180 / math.Pi
	if hue < 0 {
		hue += 360
	}
	return ColorSample{
		Lightness: clamp(lightness/total, 0.3, 0.9),
		Chroma:    clamp(chroma/total, 0.06, 0.2),
		Hue:       hue,
	}
}

func compileGuidedWhite(seed int64, selected []GuidedOption) Field {
	mireds, brightness := guidedWhitePreference(selected)
	samples := make([]WhiteSample, guidedGridSize*guidedGridSize)
	for y := range guidedGridSize {
		for x := range guidedGridSize {
			nx := float64(x) / float64(guidedGridSize-1)
			ny := float64(y) / float64(guidedGridSize-1)
			wave := periodicNoise(seed, nx*0.35, ny*0.35, 0, 9)
			samples[y*guidedGridSize+x] = WhiteSample{
				Brightness: clamp(brightness+0.16*wave, 0.2, 0.95),
				Mireds:     clamp(mireds+65*wave, 160, 500),
			}
		}
	}
	return NewWhiteAmbience(guidedGridSize, guidedGridSize, samples)
}

// GuidedOptionField turns one choice into a subtle field for visual selection.
// The variation communicates atmosphere without changing the preference that
// the option records.
func GuidedOptionField(option GuidedOption, seed int64) (Field, error) {
	const size = 4
	optionSeed := uint64(seed)
	for i := range option.ID {
		optionSeed = splitmix64(optionSeed ^ uint64(option.ID[i]))
	}

	if option.Color != nil && option.White == nil {
		samples := make([]ColorSample, size*size)
		for y := range size {
			for x := range size {
				nx := float64(x) / float64(size-1)
				ny := float64(y) / float64(size-1)
				wave := periodicNoise(int64(optionSeed), nx*0.45, ny*0.45, 0, 13)
				samples[y*size+x] = ColorSample{
					Lightness: clamp(option.Color.Lightness+0.10*wave, 0.28, 0.92),
					Chroma:    clamp(option.Color.Chroma+0.02*wave, 0.04, 0.22),
					Hue:       math.Mod(option.Color.Hue+20*wave+360, 360),
				}
			}
		}
		field := NewFullColor(size, size, samples)
		return field, field.Validate()
	}

	if option.White != nil && option.Color == nil {
		samples := make([]WhiteSample, size*size)
		for y := range size {
			for x := range size {
				nx := float64(x) / float64(size-1)
				ny := float64(y) / float64(size-1)
				wave := periodicNoise(int64(optionSeed), nx*0.45, ny*0.45, 0, 15)
				samples[y*size+x] = WhiteSample{
					Brightness: clamp(option.White.Brightness+0.12*wave, 0.18, 0.98),
					Mireds:     clamp(option.White.Mireds+50*wave, 160, 500),
				}
			}
		}
		field := NewWhiteAmbience(size, size, samples)
		return field, field.Validate()
	}

	return Field{}, errors.New("guided option must contain exactly one preview value")
}

func guidedColorPreference(selected []GuidedOption) (float64, float64) {
	if len(selected) == 0 {
		return 25, 0.64
	}
	var a, b, lightness, weight float64
	for i, option := range selected {
		w := float64(i + 1)
		hue := option.Color.Hue * math.Pi / 180
		a += math.Cos(hue) * w
		b += math.Sin(hue) * w
		lightness += option.Color.Lightness * w
		weight += w
	}
	hue := math.Atan2(b, a) * 180 / math.Pi
	if hue < 0 {
		hue += 360
	}
	return hue, lightness / weight
}

func guidedWhitePreference(selected []GuidedOption) (float64, float64) {
	if len(selected) == 0 {
		return 310, 0.65
	}
	var mireds, brightness, weight float64
	for i, option := range selected {
		w := float64(i + 1)
		mireds += option.White.Mireds * w
		brightness += option.White.Brightness * w
		weight += w
	}
	return mireds / weight, brightness / weight
}

func guidedOptionID(domain Domain, seed int64, round, index int, selected []GuidedOption) string {
	value := uint64(seed) ^ uint64(round+1)*0x9e3779b97f4a7c15 ^ uint64(index+1)*0xbf58476d1ce4e5b9
	for _, option := range selected {
		for i := range option.ID {
			value = splitmix64(value ^ uint64(option.ID[i]))
		}
	}
	return fmt.Sprintf("g%d-%016x", round+1, splitmix64(value^uint64(len(domain))))
}

func permuteGuidedOptions(options []GuidedOption, seed int64, round int) []GuidedOption {
	result := append([]GuidedOption(nil), options...)
	state := splitmix64(uint64(seed) ^ uint64(round+1))
	for i := len(result) - 1; i > 0; i-- {
		state = splitmix64(state)
		j := int(state % uint64(i+1))
		result[i], result[j] = result[j], result[i]
	}
	return result
}

func guidedColorTitle(hue float64) string {
	names := []string{"Ember", "Amber", "Gold", "Meadow", "Leaf", "Mint", "Lagoon", "Sky", "Indigo", "Violet", "Orchid", "Rose"}
	return names[int(math.Mod(hue+15, 360)/30)%len(names)]
}
