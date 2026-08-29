package lightfield

import (
	"math"
	"reflect"
	"testing"
)

func guidedRecipeChoosingFirst(t *testing.T, domain Domain, seed int64, rounds int) GuidedRecipe {
	t.Helper()
	recipe := GuidedRecipe{Domain: domain, Seed: seed}
	for range rounds {
		options, err := GuidedOptions(recipe)
		if err != nil {
			t.Fatal(err)
		}
		recipe.SelectedIDs = append(recipe.SelectedIDs, options[0].ID)
	}
	return recipe
}

func TestGuidedOptionsReproducibleDistinctAndExploratory(t *testing.T) {
	recipe := GuidedRecipe{Domain: DomainFullColor, Seed: 812}
	first, err := GuidedOptions(recipe)
	if err != nil {
		t.Fatal(err)
	}
	second, _ := GuidedOptions(recipe)
	if !reflect.DeepEqual(first, second) {
		t.Fatal("guided options are not reproducible")
	}
	ids := map[string]bool{}
	titles := map[string]bool{}
	for _, option := range first {
		if ids[option.ID] || titles[option.Title] || option.Color == nil || option.White != nil {
			t.Fatalf("invalid option %#v", option)
		}
		ids[option.ID] = true
		titles[option.Title] = true
	}
	if len(first) != guidedOptionCount {
		t.Fatalf("guided option count = %d, want %d", len(first), guidedOptionCount)
	}
	recipe.SelectedIDs = append(recipe.SelectedIDs, first[0].ID)
	next, err := GuidedOptions(recipe)
	if err != nil {
		t.Fatal(err)
	}
	near, contrasting := 0, 0
	for _, option := range next {
		delta := hueDistance(first[0].Color.Hue, option.Color.Hue)
		if delta < 70 {
			near++
		}
		if delta > 100 {
			contrasting++
		}
	}
	if near < 2 || contrasting < 1 {
		t.Fatalf("next round does not balance convergence and contrast: %#v", next)
	}
}

func TestGuidedWhiteOptionsAreDistinct(t *testing.T) {
	for rounds := 0; rounds < guidedMaxRounds; rounds++ {
		recipe := guidedRecipeChoosingFirst(t, DomainWhiteAmbience, 812, rounds)
		options, err := GuidedOptions(recipe)
		if err != nil {
			t.Fatal(err)
		}
		titles := map[string]bool{}
		for _, option := range options {
			if titles[option.Title] || option.White == nil || option.Color != nil {
				t.Fatalf("round %d has invalid option %#v", rounds+1, option)
			}
			titles[option.Title] = true
		}
		if len(options) != guidedOptionCount {
			t.Fatalf("round %d option count = %d, want %d", rounds+1, len(options), guidedOptionCount)
		}
	}
}

func TestGuidedColorOptionTitlesStayDistinct(t *testing.T) {
	for _, seed := range []int64{-31, 0, 1, 73, 812, math.MaxInt64} {
		recipe := GuidedRecipe{Domain: DomainFullColor, Seed: seed}
		for round := range guidedMaxRounds {
			options, err := GuidedOptions(recipe)
			if err != nil {
				t.Fatal(err)
			}
			titles := map[string]bool{}
			for _, option := range options {
				if titles[option.Title] {
					t.Fatalf("seed %d round %d repeats title %q", seed, round+1, option.Title)
				}
				titles[option.Title] = true
			}
			recipe.SelectedIDs = append(recipe.SelectedIDs, options[round%len(options)].ID)
		}
	}
}

func TestCompileGuidedEarlyAndFiveRoundFinish(t *testing.T) {
	for _, domain := range []Domain{DomainFullColor, DomainWhiteAmbience} {
		for _, rounds := range []int{3, 5} {
			recipe := guidedRecipeChoosingFirst(t, domain, 31, rounds)
			field, err := CompileGuided(recipe)
			if err != nil {
				t.Fatalf("%s %d rounds: %v", domain, rounds, err)
			}
			if field.Domain != domain || field.Validate() != nil {
				t.Fatalf("compiled field = %#v", field)
			}
		}
	}
	tooShort := guidedRecipeChoosingFirst(t, DomainFullColor, 3, 2)
	if _, err := CompileGuided(tooShort); err == nil {
		t.Fatal("two-round session compiled")
	}
	tampered := guidedRecipeChoosingFirst(t, DomainFullColor, 3, 3)
	tampered.SelectedIDs[1] = "invented"
	if _, err := CompileGuided(tampered); err == nil {
		t.Fatal("tampered option ID compiled")
	}
}

func TestGuidedColorsKeepSelectionsVisibleAndDomainsStaySeparate(t *testing.T) {
	recipe := guidedRecipeChoosingFirst(t, DomainFullColor, 99, 5)
	selected, err := resolveGuidedSelections(recipe)
	if err != nil {
		t.Fatal(err)
	}
	field, _ := CompileGuided(recipe)
	for _, option := range selected {
		visible := false
		for _, sample := range field.Samples {
			if *sample.Color == *option.Color {
				visible = true
				break
			}
		}
		if !visible {
			t.Fatalf("selected colour is absent from field: %#v", option.Color)
		}
	}
	whiteRecipe := guidedRecipeChoosingFirst(t, DomainWhiteAmbience, 99, 3)
	white, _ := CompileGuided(whiteRecipe)
	for _, sample := range white.Samples {
		if sample.White == nil || sample.Color != nil {
			t.Fatalf("white session emitted colour: %#v", sample)
		}
	}
}

func TestGuidedColorSelectionsOwnDistinctFieldRegions(t *testing.T) {
	selected := []GuidedOption{
		{Color: &ColorSample{Lightness: 0.66, Chroma: 0.15, Hue: 35}},
		{Color: &ColorSample{Lightness: 0.62, Chroma: 0.15, Hue: 145}},
		{Color: &ColorSample{Lightness: 0.68, Chroma: 0.15, Hue: 315}},
	}
	field := compileGuidedColor(42, selected)
	for _, option := range selected {
		nearby := 0
		for _, sample := range field.Samples {
			if hueDistance(option.Color.Hue, sample.Color.Hue) <= 30 {
				nearby++
			}
		}
		if nearby < 3 {
			t.Fatalf("selected hue %.0f owns only %d field samples", option.Color.Hue, nearby)
		}
	}
}

func TestGuidedOptionFieldsAreDeterministicDomainPreviews(t *testing.T) {
	for _, domain := range []Domain{DomainFullColor, DomainWhiteAmbience} {
		options, err := GuidedOptions(GuidedRecipe{Domain: domain, Seed: 73})
		if err != nil {
			t.Fatal(err)
		}
		first, err := GuidedOptionField(options[0], 73)
		if err != nil {
			t.Fatal(err)
		}
		second, err := GuidedOptionField(options[0], 73)
		if err != nil {
			t.Fatal(err)
		}
		if first.Domain != domain || first.Width != 4 || first.Height != 4 || first.Validate() != nil {
			t.Fatalf("%s option field = %#v", domain, first)
		}
		if !reflect.DeepEqual(first, second) {
			t.Fatalf("%s option field is not deterministic", domain)
		}
		if reflect.DeepEqual(first.Samples[0], first.Samples[len(first.Samples)-1]) {
			t.Fatalf("%s option field is flat", domain)
		}
	}
}

func hueDistance(left, right float64) float64 {
	delta := math.Abs(left - right)
	return min(delta, 360-delta)
}

func FuzzGuidedRecipe(f *testing.F) {
	f.Add(int64(1), "invented", 3)
	f.Add(int64(-8), "", 5)
	f.Fuzz(func(t *testing.T, seed int64, selected string, rounds int) {
		if rounds < 0 || rounds > 8 {
			return
		}
		recipe := GuidedRecipe{Domain: DomainFullColor, Seed: seed}
		for range rounds {
			recipe.SelectedIDs = append(recipe.SelectedIDs, selected)
		}
		_, _ = CompileGuided(recipe)
	})
}
