package lightfield

import (
	"encoding/json"
	"os"
	"testing"
)

type compilerSummaries struct {
	Gradient struct {
		MinimumPerceptualDiversity float64 `json:"minimumPerceptualDiversity"`
		MaximumNeighbourDelta      float64 `json:"maximumNeighbourDelta"`
		MinimumLightness           float64 `json:"minimumLightness"`
		MaximumLightness           float64 `json:"maximumLightness"`
	} `json:"gradient"`
	WhiteAmbience struct {
		MinimumMireds     float64 `json:"minimumMireds"`
		MaximumMireds     float64 `json:"maximumMireds"`
		MinimumBrightness float64 `json:"minimumBrightness"`
		MaximumBrightness float64 `json:"maximumBrightness"`
	} `json:"whiteAmbience"`
	SalientSubject struct {
		MinimumChromaLift float64 `json:"minimumChromaLift"`
	} `json:"salientSubject"`
}

func TestCompilerQualitySummaries(t *testing.T) {
	data, err := os.ReadFile("testdata/compiler_summaries.json")
	if err != nil {
		t.Fatal(err)
	}
	var golden compilerSummaries
	if err := json.Unmarshal(data, &golden); err != nil {
		t.Fatal(err)
	}
	gradient := generatedRaster(48, 24, func(x, y int) RasterPixel {
		return RasterPixel{R: uint8(x * 255 / 47), G: uint8(y * 255 / 23), B: uint8((47 - x) * 255 / 47), A: 255}
	})
	colour, err := CompilePhoto(gradient, DomainFullColor)
	if err != nil {
		t.Fatal(err)
	}
	if fieldColorDiversity(colour) < golden.Gradient.MinimumPerceptualDiversity || maximumNeighbourDelta(colour) > golden.Gradient.MaximumNeighbourDelta {
		t.Fatalf("colour summary outside golden bounds: diversity=%v neighbour=%v", fieldColorDiversity(colour), maximumNeighbourDelta(colour))
	}
	for _, sample := range colour.Samples {
		if sample.Color.Lightness < golden.Gradient.MinimumLightness || sample.Color.Lightness > golden.Gradient.MaximumLightness {
			t.Fatalf("lightness outside golden bounds: %v", sample.Color.Lightness)
		}
	}
	white, err := CompilePhoto(gradient, DomainWhiteAmbience)
	if err != nil {
		t.Fatal(err)
	}
	for _, sample := range white.Samples {
		if sample.White.Mireds < golden.WhiteAmbience.MinimumMireds || sample.White.Mireds > golden.WhiteAmbience.MaximumMireds ||
			sample.White.Brightness < golden.WhiteAmbience.MinimumBrightness || sample.White.Brightness > golden.WhiteAmbience.MaximumBrightness {
			t.Fatalf("white sample outside golden bounds: %#v", sample.White)
		}
	}
	subject := generatedRaster(40, 40, func(x, y int) RasterPixel {
		if x >= 27 && x <= 32 && y >= 8 && y <= 13 {
			return RasterPixel{R: 255, G: 20, B: 20, A: 255}
		}
		return RasterPixel{R: 145, G: 145, B: 145, A: 255}
	})
	salient, err := CompilePhoto(subject, DomainFullColor)
	if err != nil {
		t.Fatal(err)
	}
	lift := salient.Samples[1*photoGridSize+4].Color.Chroma - salient.Samples[4*photoGridSize+1].Color.Chroma
	if lift < golden.SalientSubject.MinimumChromaLift {
		t.Fatalf("saliency lift = %v", lift)
	}
}
