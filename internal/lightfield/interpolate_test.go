package lightfield

import (
	"math"
	"testing"
)

func TestSampleSpatialCornersAndHueWrap(t *testing.T) {
	field := NewFullColor(2, 2, []ColorSample{
		{Lightness: 0.2, Chroma: 0.1, Hue: 350},
		{Lightness: 0.4, Chroma: 0.1, Hue: 10},
		{Lightness: 0.6, Chroma: 0.1, Hue: 350},
		{Lightness: 0.8, Chroma: 0.1, Hue: 10},
	})
	corner, err := SampleSpatial(field, Point{})
	if err != nil {
		t.Fatal(err)
	}
	if *corner.Color != *field.Samples[0].Color {
		t.Fatalf("corner = %#v, want %#v", corner.Color, field.Samples[0].Color)
	}
	center, err := SampleSpatial(field, Point{X: 0.5, Y: 0.5})
	if err != nil {
		t.Fatal(err)
	}
	if math.Abs(center.Color.Lightness-0.5) > 1e-12 {
		t.Fatalf("center lightness = %v", center.Color.Lightness)
	}
	if center.Color.Hue > 1e-9 && math.Abs(center.Color.Hue-360) > 1e-9 {
		t.Fatalf("hue took long route: %v", center.Color.Hue)
	}
}

func TestSampleSpatialContinuousAcrossCellBoundary(t *testing.T) {
	field := NewWhiteAmbience(3, 2, []WhiteSample{
		{Brightness: 0.1, Mireds: 150}, {Brightness: 0.5, Mireds: 300}, {Brightness: 0.9, Mireds: 500},
		{Brightness: 0.2, Mireds: 160}, {Brightness: 0.6, Mireds: 310}, {Brightness: 1, Mireds: 510},
	})
	left, _ := SampleSpatial(field, Point{X: 0.5 - 1e-7, Y: 0.37})
	right, _ := SampleSpatial(field, Point{X: 0.5 + 1e-7, Y: 0.37})
	if math.Abs(left.White.Brightness-right.White.Brightness) > 1e-9 || math.Abs(left.White.Mireds-right.White.Mireds) > 1e-6 {
		t.Fatalf("cell boundary discontinuity: %#v %#v", left.White, right.White)
	}
}

func TestAchromaticInterpolationKeepsChromaticHue(t *testing.T) {
	left := ColorSample{Lightness: 0.5, Chroma: 0, Hue: 0}
	right := ColorSample{Lightness: 0.5, Chroma: 0.2, Hue: 210}
	got := mixColor(left, right, 0.25)
	if got.Hue != 210 {
		t.Fatalf("hue = %v", got.Hue)
	}
}

func TestColourConversionGoldenVectorsAndGamut(t *testing.T) {
	white := OKLCHToSRGB(ColorSample{Lightness: 1})
	if math.Abs(white.R-1) > 1e-6 || math.Abs(white.G-1) > 1e-6 || math.Abs(white.B-1) > 1e-6 {
		t.Fatalf("white = %#v", white)
	}
	red := SRGBToOKLCH(RGB{R: 1})
	if math.Abs(red.Lightness-0.62796) > 0.001 || math.Abs(red.Chroma-0.25768) > 0.001 || math.Abs(red.Hue-29.23) > 0.1 {
		t.Fatalf("red OKLCH = %#v", red)
	}
	for _, sample := range []ColorSample{
		{Lightness: 0.5, Chroma: 0.4, Hue: 20},
		{Lightness: 0.8, Chroma: 0.4, Hue: 145},
		{Lightness: 0.3, Chroma: 0.4, Hue: 280},
	} {
		if rgb := OKLCHToSRGB(sample); !inGamut(rgb) {
			t.Errorf("out of gamut: %#v -> %#v", sample, rgb)
		}
	}
	cool, warm := MiredsToSRGB(153), MiredsToSRGB(500)
	if cool.B <= warm.B || warm.R < cool.R {
		t.Fatalf("black-body ordering: cool=%#v warm=%#v", cool, warm)
	}
}
