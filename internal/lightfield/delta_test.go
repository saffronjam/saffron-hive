package lightfield

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestSignificantDeltaThresholdsAndRepresentations(t *testing.T) {
	base := LightIntent{
		On:         device.Ptr(true),
		Brightness: device.Ptr(100),
		ColorTemp:  device.Ptr(300),
	}
	if SignificantDelta(base, base, DefaultDeltaThresholds) {
		t.Fatal("identical intents differ")
	}
	near := base
	near.Brightness = device.Ptr(101)
	near.ColorTemp = device.Ptr(302)
	if SignificantDelta(base, near, DefaultDeltaThresholds) {
		t.Fatal("sub-threshold intent differs")
	}
	atBoundary := base
	atBoundary.Brightness = device.Ptr(102)
	if !SignificantDelta(base, atBoundary, DefaultDeltaThresholds) {
		t.Fatal("brightness boundary suppressed")
	}
	atBoundary = base
	atBoundary.ColorTemp = device.Ptr(303)
	if !SignificantDelta(base, atBoundary, DefaultDeltaThresholds) {
		t.Fatal("mired boundary suppressed")
	}
	rgb := base
	rgb.ColorTemp = nil
	rgb.Color = &device.Color{R: 255, G: 120, B: 30}
	if !SignificantDelta(base, rgb, DefaultDeltaThresholds) {
		t.Fatal("representation switch suppressed")
	}
	changedRGB := rgb
	changedRGB.Color = &device.Color{R: 30, G: 120, B: 255}
	if !SignificantDelta(rgb, changedRGB, DefaultDeltaThresholds) {
		t.Fatal("perceptual colour change suppressed")
	}
}

func TestTransitionDuration(t *testing.T) {
	if got := TransitionDuration(time.Second, 2*time.Second); got != 900*time.Millisecond {
		t.Fatalf("transition = %v", got)
	}
	if got := TransitionDuration(time.Second, 400*time.Millisecond); got != 400*time.Millisecond {
		t.Fatalf("capped transition = %v", got)
	}
	for _, got := range []time.Duration{
		TransitionDuration(0, time.Second),
		TransitionDuration(time.Second, 0),
		TransitionDuration(-time.Second, time.Second),
	} {
		if got != 0 {
			t.Fatalf("non-positive transition = %v", got)
		}
	}
}
