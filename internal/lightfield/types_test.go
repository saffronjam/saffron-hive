package lightfield

import (
	"math"
	"testing"
	"time"
)

func TestFieldValidate(t *testing.T) {
	colour := NewFullColor(2, 2, []ColorSample{
		{Lightness: 0.2, Chroma: 0.1, Hue: 10},
		{Lightness: 0.4, Chroma: 0.2, Hue: 90},
		{Lightness: 0.6, Chroma: 0.3, Hue: 180},
		{Lightness: 0.8, Chroma: 0.1, Hue: 270},
	})
	if err := colour.Validate(); err != nil {
		t.Fatalf("valid colour field: %v", err)
	}
	white := NewWhiteAmbience(2, 2, []WhiteSample{
		{Brightness: 0.2, Mireds: 153},
		{Brightness: 0.4, Mireds: 250},
		{Brightness: 0.6, Mireds: 370},
		{Brightness: 0.8, Mireds: 500},
	})
	if err := white.Validate(); err != nil {
		t.Fatalf("valid white field: %v", err)
	}

	bad := []Field{
		{},
		NewFullColor(1, 2, make([]ColorSample, 2)),
		NewFullColor(65, 2, make([]ColorSample, 130)),
		NewFullColor(2, 2, make([]ColorSample, 3)),
		NewFullColor(2, 2, []ColorSample{{Lightness: math.NaN()}, {}, {}, {}}),
		NewFullColor(2, 2, []ColorSample{{Lightness: 1.1}, {}, {}, {}}),
		NewFullColor(2, 2, []ColorSample{{Chroma: 0.41}, {}, {}, {}}),
		NewFullColor(2, 2, []ColorSample{{Hue: 360}, {}, {}, {}}),
		NewWhiteAmbience(2, 2, []WhiteSample{{Brightness: -0.1, Mireds: 200}, {}, {}, {}}),
		NewWhiteAmbience(2, 2, []WhiteSample{{Brightness: 0.5, Mireds: 99}, {}, {}, {}}),
	}
	mismatch := colour
	mismatch.Samples[0].White = &WhiteSample{Brightness: 1, Mireds: 200}
	bad = append(bad, mismatch)
	for i, field := range bad {
		if err := field.Validate(); err == nil {
			t.Errorf("bad field %d accepted", i)
		}
	}
}

func TestMotionValidate(t *testing.T) {
	if err := (Motion{Movement: 0, Cycle: time.Minute}).Validate(); err != nil {
		t.Fatal(err)
	}
	for _, motion := range []Motion{
		{Movement: -0.1, Cycle: time.Second},
		{Movement: 1.1, Cycle: time.Second},
		{Movement: math.NaN(), Cycle: time.Second},
		{Movement: 0.5},
	} {
		if err := motion.Validate(); err == nil {
			t.Errorf("bad motion accepted: %#v", motion)
		}
	}
}

func FuzzFieldValidate(f *testing.F) {
	f.Add(2, 2, 0.5, 0.1, 20.0)
	f.Add(65, 2, math.NaN(), -1.0, 360.0)
	f.Fuzz(func(t *testing.T, width, height int, lightness, chroma, hue float64) {
		field := NewFullColor(width, height, []ColorSample{
			{Lightness: lightness, Chroma: chroma, Hue: hue}, {}, {}, {},
		})
		_ = field.Validate()
	})
}
