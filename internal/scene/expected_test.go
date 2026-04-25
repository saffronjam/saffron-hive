package scene

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestBuildExpected_UsesCommandWhenSet(t *testing.T) {
	cmd := device.Command{
		DeviceID:   "dev-1",
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(370),
		Color:      &device.Color{R: 10, G: 20, B: 30},
	}
	current := &device.DeviceState{
		On:         device.Ptr(false),
		Brightness: device.Ptr(50),
		ColorTemp:  device.Ptr(100),
		Color:      &device.Color{R: 1, G: 2, B: 3},
	}
	exp := BuildExpected("scene-1", cmd, current)

	if exp.On == nil || *exp.On != true {
		t.Errorf("On: want true, got %v", exp.On)
	}
	if exp.Brightness == nil || *exp.Brightness != 200 {
		t.Errorf("Brightness: want 200, got %v", exp.Brightness)
	}
	if exp.ColorTemp == nil || *exp.ColorTemp != 370 {
		t.Errorf("ColorTemp: want 370, got %v", exp.ColorTemp)
	}
	if derefInt(exp.ColorR) != 10 || derefInt(exp.ColorG) != 20 || derefInt(exp.ColorB) != 30 {
		t.Errorf("Color: want (10,20,30), got (%d,%d,%d)", derefInt(exp.ColorR), derefInt(exp.ColorG), derefInt(exp.ColorB))
	}
}

func TestBuildExpected_FallsBackToCurrentWhenCommandUnset(t *testing.T) {
	cmd := device.Command{
		DeviceID: "dev-1",
		On:       device.Ptr(true),
	}
	current := &device.DeviceState{
		Brightness: device.Ptr(50),
		ColorTemp:  device.Ptr(100),
		Color:      &device.Color{R: 1, G: 2, B: 3},
	}
	exp := BuildExpected("scene-1", cmd, current)

	if exp.On == nil || *exp.On != true {
		t.Errorf("On should come from cmd: %v", exp.On)
	}
	if exp.Brightness == nil || *exp.Brightness != 50 {
		t.Errorf("Brightness should fall back to current: got %v", exp.Brightness)
	}
	if exp.ColorTemp == nil || *exp.ColorTemp != 100 {
		t.Errorf("ColorTemp should fall back to current: got %v", exp.ColorTemp)
	}
	if derefInt(exp.ColorR) != 1 {
		t.Errorf("Color should fall back to current: R = %d", derefInt(exp.ColorR))
	}
}

func TestBuildExpected_NilWhenNeitherSet(t *testing.T) {
	cmd := device.Command{DeviceID: "dev-1", On: device.Ptr(true)}
	current := &device.DeviceState{}
	exp := BuildExpected("scene-1", cmd, current)

	if exp.Brightness != nil {
		t.Errorf("Brightness: want nil, got %v", *exp.Brightness)
	}
	if exp.ColorTemp != nil {
		t.Errorf("ColorTemp: want nil, got %v", *exp.ColorTemp)
	}
	if exp.ColorR != nil || exp.ColorG != nil || exp.ColorB != nil {
		t.Errorf("Color: want all nil, got (%v,%v,%v)", exp.ColorR, exp.ColorG, exp.ColorB)
	}
}

func TestBuildExpected_NilCurrentStateIsSafe(t *testing.T) {
	cmd := device.Command{DeviceID: "dev-1", On: device.Ptr(true), Brightness: device.Ptr(200)}
	exp := BuildExpected("scene-1", cmd, nil)

	if exp.On == nil || *exp.On != true {
		t.Errorf("On: want true, got %v", exp.On)
	}
	if exp.Brightness == nil || *exp.Brightness != 200 {
		t.Errorf("Brightness: want 200, got %v", exp.Brightness)
	}
	if exp.ColorTemp != nil {
		t.Errorf("ColorTemp: want nil (current was nil), got %v", *exp.ColorTemp)
	}
}

func TestExpectedMatchesCurrent_AllMatch(t *testing.T) {
	exp := store.SceneExpectedState{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(370),
		ColorR:     device.Ptr(10),
		ColorG:     device.Ptr(20),
		ColorB:     device.Ptr(30),
	}
	current := &device.DeviceState{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(370),
		Color:      &device.Color{R: 10, G: 20, B: 30, X: 0.4, Y: 0.3},
	}
	if !ExpectedMatchesCurrent(exp, current) {
		t.Fatal("want match, got mismatch")
	}
}

func TestExpectedMatchesCurrent_AnyFieldDiffers(t *testing.T) {
	base := store.SceneExpectedState{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(370),
		ColorR:     device.Ptr(10),
		ColorG:     device.Ptr(20),
		ColorB:     device.Ptr(30),
	}
	matching := &device.DeviceState{
		On:         device.Ptr(true),
		Brightness: device.Ptr(200),
		ColorTemp:  device.Ptr(370),
		Color:      &device.Color{R: 10, G: 20, B: 30},
	}

	t.Run("on flipped", func(t *testing.T) {
		c := *matching
		c.On = device.Ptr(false)
		if ExpectedMatchesCurrent(base, &c) {
			t.Fatal("on change should not match")
		}
	})
	t.Run("brightness differs", func(t *testing.T) {
		c := *matching
		c.Brightness = device.Ptr(100)
		if ExpectedMatchesCurrent(base, &c) {
			t.Fatal("brightness change should not match")
		}
	})
	t.Run("color_temp differs", func(t *testing.T) {
		c := *matching
		c.ColorTemp = device.Ptr(300)
		if ExpectedMatchesCurrent(base, &c) {
			t.Fatal("color_temp change should not match")
		}
	})
	t.Run("color differs", func(t *testing.T) {
		c := *matching
		c.Color = &device.Color{R: 99, G: 20, B: 30}
		if ExpectedMatchesCurrent(base, &c) {
			t.Fatal("color change should not match")
		}
	})
}

// TestExpectedMatchesCurrent_TolerateBulbRoundtripDrift covers the regression
// behind the "Living room Flower" scene immediately deactivating: a Hue bulb
// commanded with color {243,0,255} reports back {243,1,255} due to the
// xy → RGB roundtrip rounding by ±1. The watcher must treat that as a match
// or every colour-only scene flips inactive on the first state echo.
func TestExpectedMatchesCurrent_TolerateBulbRoundtripDrift(t *testing.T) {
	exp := store.SceneExpectedState{
		On:     device.Ptr(true),
		ColorR: device.Ptr(243),
		ColorG: device.Ptr(0),
		ColorB: device.Ptr(255),
	}
	current := &device.DeviceState{
		On:    device.Ptr(true),
		Color: &device.Color{R: 243, G: 1, B: 255},
	}
	if !ExpectedMatchesCurrent(exp, current) {
		t.Fatal("1-unit RGB drift should still match (bulb roundtrip noise)")
	}
}

// TestExpectedMatchesCurrent_DeliberateColourChange ensures the tolerance
// doesn't swallow real changes — a hue shift from purple to red is well above
// the ΔE threshold and must invalidate.
func TestExpectedMatchesCurrent_DeliberateColourChange(t *testing.T) {
	exp := store.SceneExpectedState{
		On:     device.Ptr(true),
		ColorR: device.Ptr(243),
		ColorG: device.Ptr(0),
		ColorB: device.Ptr(255),
	}
	current := &device.DeviceState{
		On:    device.Ptr(true),
		Color: &device.Color{R: 255, G: 0, B: 0},
	}
	if ExpectedMatchesCurrent(exp, current) {
		t.Fatal("a deliberate hue change must fail the match")
	}
}

func TestExpectedMatchesCurrent_NilExpectedIsDontCare(t *testing.T) {
	exp := store.SceneExpectedState{On: device.Ptr(true)}

	if !ExpectedMatchesCurrent(exp, &device.DeviceState{On: device.Ptr(true)}) {
		t.Fatal("want match when only on is expected and current has only on")
	}
	// brightness is nil in expected → don't care; any current brightness
	// should still match. The alternative strict rule caused scenes that
	// set color_temp to deactivate themselves from the device's derived
	// colour echo, which was the wrong behaviour.
	if !ExpectedMatchesCurrent(exp, &device.DeviceState{On: device.Ptr(true), Brightness: device.Ptr(50)}) {
		t.Fatal("expected-nil + current-non-nil should match (don't-care)")
	}
}

func TestBuildExpected_ColorTempOnlyDoesNotTrackColor(t *testing.T) {
	cmd := device.Command{
		DeviceID:  "dev-1",
		On:        device.Ptr(true),
		ColorTemp: device.Ptr(500),
	}
	// Device was on colour X before apply; applying color_temp makes the
	// device derive a different colour. We must NOT record the pre-apply
	// colour as expected, or the echo would invalidate us.
	current := &device.DeviceState{
		On:        device.Ptr(true),
		ColorTemp: device.Ptr(300),
		Color:     &device.Color{R: 1, G: 2, B: 3},
	}
	exp := BuildExpected("scene-1", cmd, current)
	if exp.ColorTemp == nil || *exp.ColorTemp != 500 {
		t.Fatalf("ColorTemp: want 500, got %v", exp.ColorTemp)
	}
	if exp.ColorR != nil || exp.ColorG != nil || exp.ColorB != nil {
		t.Fatalf("Color must be nil (don't-care) when scene drives color_temp; got (%v,%v,%v)", exp.ColorR, exp.ColorG, exp.ColorB)
	}

	// Post-apply echo: device reports the new derived colour. Must still match.
	echo := &device.DeviceState{
		On:        device.Ptr(true),
		ColorTemp: device.Ptr(500),
		Color:     &device.Color{R: 255, G: 180, B: 90},
	}
	if !ExpectedMatchesCurrent(exp, echo) {
		t.Fatal("color_temp scene must not invalidate on derived colour echo")
	}
}

func TestBuildExpected_ColorOnlyDoesNotTrackColorTemp(t *testing.T) {
	cmd := device.Command{
		DeviceID: "dev-1",
		On:       device.Ptr(true),
		Color:    &device.Color{R: 10, G: 20, B: 30},
	}
	current := &device.DeviceState{
		On:        device.Ptr(true),
		ColorTemp: device.Ptr(300),
		Color:     &device.Color{R: 1, G: 2, B: 3},
	}
	exp := BuildExpected("scene-1", cmd, current)
	if exp.ColorTemp != nil {
		t.Fatalf("ColorTemp must be nil when scene drives colour; got %v", *exp.ColorTemp)
	}
	if derefInt(exp.ColorR) != 10 || derefInt(exp.ColorG) != 20 || derefInt(exp.ColorB) != 30 {
		t.Fatalf("Color: want (10,20,30), got (%d,%d,%d)", derefInt(exp.ColorR), derefInt(exp.ColorG), derefInt(exp.ColorB))
	}
}

func TestExpectedMatchesCurrent_CurrentNilCountsAsMismatch(t *testing.T) {
	exp := store.SceneExpectedState{On: device.Ptr(true), Brightness: device.Ptr(200)}
	if ExpectedMatchesCurrent(exp, &device.DeviceState{On: device.Ptr(true)}) {
		t.Fatal("current dropping brightness should mismatch")
	}
}

func TestExpectedMatchesCurrent_NilCurrentStateMismatches(t *testing.T) {
	exp := store.SceneExpectedState{On: device.Ptr(true)}
	if ExpectedMatchesCurrent(exp, nil) {
		t.Fatal("nil current state cannot satisfy a non-nil expectation")
	}
}

func TestExpectedMatchesCurrent_BothEmptyMatches(t *testing.T) {
	exp := store.SceneExpectedState{}
	if !ExpectedMatchesCurrent(exp, &device.DeviceState{}) {
		t.Fatal("empty expected + empty current should match")
	}
}
