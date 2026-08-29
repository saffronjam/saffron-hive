package lightfield

import (
	"reflect"
	"testing"
	"time"
)

func TestPreviewDimensionsDeterminismAndDiversity(t *testing.T) {
	field := motionFixture()
	motion := Motion{Seed: 52, Movement: 0.6, Cycle: time.Minute}
	at := time.Unix(1_700_000_000, 0)
	first, err := Preview(field, motion, at, 12, 8, 5)
	if err != nil {
		t.Fatal(err)
	}
	second, err := Preview(field, motion, at, 12, 8, 5)
	if err != nil {
		t.Fatal(err)
	}
	if first.Width != 12 || first.Height != 8 || len(first.Pixels) != 96 || len(first.Swatches) != 5 {
		t.Fatalf("preview shape = %#v", first)
	}
	if !reflect.DeepEqual(first, second) {
		t.Fatal("preview or swatch order is nondeterministic")
	}
	seen := map[Point]bool{}
	for _, swatch := range first.Swatches {
		if seen[swatch.Point] {
			t.Fatalf("duplicate swatch point %#v", swatch.Point)
		}
		seen[swatch.Point] = true
	}
}

func TestPreviewUniformAndWhiteAmbience(t *testing.T) {
	uniform := NewFullColor(2, 2, []ColorSample{
		{Lightness: 0.6, Chroma: 0.1, Hue: 30}, {Lightness: 0.6, Chroma: 0.1, Hue: 30},
		{Lightness: 0.6, Chroma: 0.1, Hue: 30}, {Lightness: 0.6, Chroma: 0.1, Hue: 30},
	})
	motion := Motion{Cycle: time.Minute}
	preview, err := Preview(uniform, motion, time.Time{}, 4, 4, 4)
	if err != nil {
		t.Fatal(err)
	}
	for _, pixel := range preview.Pixels[1:] {
		if pixel != preview.Pixels[0] {
			t.Fatalf("uniform field produced %#v and %#v", preview.Pixels[0], pixel)
		}
	}
	if len(preview.Swatches) != 4 {
		t.Fatalf("uniform swatches = %d", len(preview.Swatches))
	}

	white := NewWhiteAmbience(2, 2, []WhiteSample{
		{Brightness: 0.8, Mireds: 153}, {Brightness: 0.8, Mireds: 153},
		{Brightness: 0.8, Mireds: 500}, {Brightness: 0.8, Mireds: 500},
	})
	whitePreview, err := Preview(white, motion, time.Time{}, 2, 2, 2)
	if err != nil {
		t.Fatal(err)
	}
	if whitePreview.Pixels[0].B <= whitePreview.Pixels[2].B || whitePreview.Pixels[2].R < whitePreview.Pixels[0].R {
		t.Fatalf("white locus ordering = %#v", whitePreview.Pixels)
	}
}

func TestPreviewRejectsUnboundedOutput(t *testing.T) {
	_, err := Preview(motionFixture(), Motion{Cycle: time.Second}, time.Time{}, 257, 1, 0)
	if err == nil {
		t.Fatal("oversized preview accepted")
	}
}
