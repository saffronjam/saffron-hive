package lightfield

import (
	"math"
	"reflect"
	"testing"
	"time"
)

func motionFixture() Field {
	return NewFullColor(3, 3, []ColorSample{
		{Lightness: 0.2, Chroma: 0.12, Hue: 350}, {Lightness: 0.4, Chroma: 0.14, Hue: 20}, {Lightness: 0.7, Chroma: 0.1, Hue: 80},
		{Lightness: 0.3, Chroma: 0.16, Hue: 280}, {Lightness: 0.6, Chroma: 0.2, Hue: 140}, {Lightness: 0.8, Chroma: 0.13, Hue: 190},
		{Lightness: 0.5, Chroma: 0.1, Hue: 240}, {Lightness: 0.75, Chroma: 0.18, Hue: 310}, {Lightness: 0.9, Chroma: 0.08, Hue: 30},
	})
}

func TestSampleAtStaticIsBitStable(t *testing.T) {
	field := motionFixture()
	motion := Motion{Seed: -82, Movement: 0, Cycle: 47 * time.Second}
	point := Point{X: 0.42, Y: 0.61}
	first, err := SampleAt(field, point, motion, time.Unix(0, 0))
	if err != nil {
		t.Fatal(err)
	}
	second, err := SampleAt(field, point, motion, time.Unix(2_000_000_000, 123))
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(first, second) {
		t.Fatalf("static sample moved: %#v %#v", first, second)
	}
}

func TestSampleAtTemporalContinuityPeriodicityAndSeed(t *testing.T) {
	field := motionFixture()
	point := Point{X: 0.42, Y: 0.61}
	motion := Motion{Seed: 12, Movement: 0.8, Cycle: 10 * time.Second}
	at := time.Unix(1_700_000_000, 123_456_789)
	first, err := SampleAt(field, point, motion, at)
	if err != nil {
		t.Fatal(err)
	}
	adjacent, _ := SampleAt(field, point, motion, at.Add(time.Millisecond))
	if colourSampleDistance(*first.Color, *adjacent.Color) > 0.01 {
		t.Fatalf("millisecond discontinuity: %#v %#v", first.Color, adjacent.Color)
	}
	periodic, _ := SampleAt(field, point, motion, at.Add(motion.Cycle))
	if !reflect.DeepEqual(first, periodic) {
		t.Fatalf("cycle is not exact: %#v %#v", first.Color, periodic.Color)
	}
	repeated, _ := SampleAt(field, point, motion, at)
	if !reflect.DeepEqual(first, repeated) {
		t.Fatalf("same engine inputs differ: %#v %#v", first.Color, repeated.Color)
	}
	motion.Seed++
	different, _ := SampleAt(field, point, motion, at)
	if reflect.DeepEqual(first, different) {
		t.Fatalf("different seeds produced identical sample: %#v", first.Color)
	}
}

func TestSampleAtCadenceFiltersUnrepresentableMotion(t *testing.T) {
	field := motionFixture()
	point := Point{X: 0.42, Y: 0.61}
	motion := Motion{Seed: 12, Movement: 1, Cycle: 5 * time.Second}
	at := time.Unix(1_700_000_000, 0)

	still, err := SampleAtCadence(field, point, motion, at, 1800*time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	later, err := SampleAtCadence(field, point, motion, at.Add(2*time.Second), 1800*time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(still, later) {
		t.Fatalf("under-sampled motion changed: %#v %#v", still, later)
	}

	first, err := SampleAtCadence(field, point, motion, at, 900*time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	next, err := SampleAtCadence(field, point, motion, at.Add(900*time.Millisecond), 900*time.Millisecond)
	if err != nil {
		t.Fatal(err)
	}
	if reflect.DeepEqual(first, next) {
		t.Fatalf("representable fundamental motion stayed still: %#v", first)
	}
}

func TestSampleAtAliveMotionKeepsChangingAcrossCycle(t *testing.T) {
	field := NewFullColor(2, 2, []ColorSample{
		{Lightness: 0.62, Chroma: 0.16, Hue: 155},
		{Lightness: 0.7, Chroma: 0.17, Hue: 290},
		{Lightness: 0.5, Chroma: 0.15, Hue: 220},
		{Lightness: 0.76, Chroma: 0.14, Hue: 335},
	})
	point := Point{X: 0.375, Y: 0.625}
	motion := Motion{Seed: 6606, Movement: 1, Cycle: time.Minute}
	var samples []ColorSample
	for step := range 60 {
		sample, err := SampleAt(field, point, motion, time.Unix(int64(step), 0))
		if err != nil {
			t.Fatal(err)
		}
		samples = append(samples, *sample.Color)
	}
	maximum := 0.0
	minimumWindow := 1.0
	for i, left := range samples {
		for _, right := range samples[i+1:] {
			maximum = max(maximum, colourSampleDistance(left, right))
		}
		windowMaximum := 0.0
		for offset := range 10 {
			windowMaximum = max(windowMaximum, colourSampleDistance(left, samples[(i+offset)%len(samples)]))
		}
		minimumWindow = min(minimumWindow, windowMaximum)
	}
	if maximum < 0.3 {
		t.Fatalf("full-cycle perceptual range = %.4f, want at least 0.3", maximum)
	}
	if minimumWindow < 0.05 {
		t.Fatalf("minimum ten-second perceptual range = %.4f, want at least 0.05", minimumWindow)
	}
}

func colourSampleDistance(left, right ColorSample) float64 {
	return colorDistance(OKLCHToSRGB(left), OKLCHToSRGB(right))
}

func FuzzSampleAt(f *testing.F) {
	f.Add(0.2, 0.8, 0.5, int64(1), int64(123))
	f.Add(-1.0, math.NaN(), 2.0, int64(-9), int64(-5))
	f.Fuzz(func(t *testing.T, x, y, movement float64, seed, nanos int64) {
		if !finite(x) || !finite(y) || !finite(movement) {
			return
		}
		point := Point{X: clamp(x, 0, 1), Y: clamp(y, 0, 1)}
		motion := Motion{Seed: seed, Movement: clamp(movement, 0, 1), Cycle: 17 * time.Second}
		sample, err := SampleAt(motionFixture(), point, motion, time.Unix(0, nanos))
		if err != nil {
			t.Fatal(err)
		}
		if sample.Color == nil || sample.Color.validate() != nil {
			t.Fatalf("invalid sampled colour: %#v", sample)
		}
	})
}
