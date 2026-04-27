package zigbee

import (
	"encoding/json"
	"testing"
)

func TestMapDeviceState_LightFull(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","brightness":200,"color_temp":350,"color":{"r":255,"g":100,"b":0}}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.On == nil || !*state.On {
		t.Fatal("expected On=true")
	}
	if state.Brightness == nil || *state.Brightness != 200 {
		t.Fatalf("expected Brightness=200, got %v", state.Brightness)
	}
	if state.ColorTemp == nil || *state.ColorTemp != 350 {
		t.Fatalf("expected ColorTemp=350, got %v", state.ColorTemp)
	}
	if state.Color == nil {
		t.Fatal("expected Color to be set")
	}
	if state.Color.R != 255 || state.Color.G != 100 || state.Color.B != 0 {
		t.Fatalf("expected Color RGB 255,100,0 got %d,%d,%d", state.Color.R, state.Color.G, state.Color.B)
	}
}

func TestMapDeviceState_ColorXYOnly(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","brightness":198,"color":{"x":0.5934,"y":0.3298}}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.Color == nil {
		t.Fatal("expected Color to be set")
	}
	if state.Color.X != 0.5934 || state.Color.Y != 0.3298 {
		t.Fatalf("expected xy 0.5934,0.3298 got %v,%v", state.Color.X, state.Color.Y)
	}
	if state.Color.R == 0 && state.Color.G == 0 && state.Color.B == 0 {
		t.Fatalf("expected RGB derived from xy, got all zero")
	}
	if state.Color.R < state.Color.G || state.Color.R < state.Color.B {
		t.Fatalf("expected red-dominant RGB for xy 0.5934,0.3298, got %d,%d,%d", state.Color.R, state.Color.G, state.Color.B)
	}
}

func TestMapDeviceState_ColorRGBPreserved(t *testing.T) {
	raw := json.RawMessage(`{"color":{"r":12,"g":34,"b":56,"x":0.5,"y":0.5}}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.Color == nil {
		t.Fatal("expected Color to be set")
	}
	if state.Color.R != 12 || state.Color.G != 34 || state.Color.B != 56 {
		t.Fatalf("explicit RGB should be preserved, got %d,%d,%d", state.Color.R, state.Color.G, state.Color.B)
	}
}

func TestXYToRGB_KnownChromaticities(t *testing.T) {
	cases := []struct {
		name                string
		x, y                float64
		wantR, wantG, wantB int
	}{
		{"red", 0.64, 0.33, 255, 0, 0},
		{"green", 0.3, 0.6, 0, 255, 0},
		{"blue", 0.15, 0.06, 0, 0, 255},
		{"white D65", 0.3127, 0.329, 255, 255, 255},
	}
	for _, c := range cases {
		r, g, b := xyToRGB(c.x, c.y)
		if absDiff(r, c.wantR) > 3 || absDiff(g, c.wantG) > 3 || absDiff(b, c.wantB) > 3 {
			t.Fatalf("%s: xy(%v,%v) got rgb(%d,%d,%d) want rgb(%d,%d,%d)", c.name, c.x, c.y, r, g, b, c.wantR, c.wantG, c.wantB)
		}
	}
}

func absDiff(a, b int) int {
	if a > b {
		return a - b
	}
	return b - a
}

func TestMapDeviceState_Partial(t *testing.T) {
	raw := json.RawMessage(`{"brightness":100}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.On != nil {
		t.Fatal("expected On=nil for partial update")
	}
	if state.Brightness == nil || *state.Brightness != 100 {
		t.Fatalf("expected Brightness=100, got %v", state.Brightness)
	}
	if state.ColorTemp != nil {
		t.Fatal("expected ColorTemp=nil for partial update")
	}
	if state.Color != nil {
		t.Fatal("expected Color=nil for partial update")
	}
}

func TestMapDeviceState_OnOff(t *testing.T) {
	onRaw := json.RawMessage(`{"state":"ON"}`)
	onState, err := mapDeviceState(onRaw)
	if err != nil {
		t.Fatal(err)
	}
	if onState.On == nil || !*onState.On {
		t.Fatal("expected On=true for state ON")
	}

	offRaw := json.RawMessage(`{"state":"OFF"}`)
	offState, err := mapDeviceState(offRaw)
	if err != nil {
		t.Fatal(err)
	}
	if offState.On == nil || *offState.On {
		t.Fatal("expected On=false for state OFF")
	}
}

func TestMapDeviceState_SensorFields(t *testing.T) {
	raw := json.RawMessage(`{"temperature":22.5,"humidity":45.0,"battery":91.5}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.Temperature == nil || *state.Temperature != 22.5 {
		t.Fatalf("expected Temperature=22.5, got %v", state.Temperature)
	}
	if state.Humidity == nil || *state.Humidity != 45.0 {
		t.Fatalf("expected Humidity=45.0, got %v", state.Humidity)
	}
	if state.Battery == nil || *state.Battery != 91.5 {
		t.Fatalf("expected Battery=91.5, got %v", state.Battery)
	}
}

func TestMapDeviceState_PlugMetering(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","power":42.5,"voltage":230.1,"current":0.18,"energy":12.3}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.On == nil || !*state.On {
		t.Fatal("expected On=true")
	}
	if state.Power == nil || *state.Power != 42.5 {
		t.Fatalf("expected Power=42.5, got %v", state.Power)
	}
	if state.Voltage == nil || *state.Voltage != 230.1 {
		t.Fatalf("expected Voltage=230.1, got %v", state.Voltage)
	}
	if state.Current == nil || *state.Current != 0.18 {
		t.Fatalf("expected Current=0.18, got %v", state.Current)
	}
	if state.Energy == nil || *state.Energy != 12.3 {
		t.Fatalf("expected Energy=12.3, got %v", state.Energy)
	}
}

func TestMapAction_Present(t *testing.T) {
	raw := json.RawMessage(`{"action":"single"}`)
	action, ok := mapAction(raw)
	if !ok {
		t.Fatal("expected action to be present")
	}
	if action != "single" {
		t.Fatalf("expected single, got %s", action)
	}
}

func TestMapAction_Absent(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","power":10}`)
	_, ok := mapAction(raw)
	if ok {
		t.Fatal("expected no action")
	}
}

func TestMapDeviceState_EmptyPayload(t *testing.T) {
	raw := json.RawMessage(`{}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.On != nil || state.Brightness != nil || state.ColorTemp != nil || state.Color != nil {
		t.Fatal("expected all light fields nil for empty payload")
	}
	if state.Temperature != nil || state.Humidity != nil || state.Battery != nil {
		t.Fatal("expected all sensor fields nil for empty payload")
	}
	if state.Power != nil || state.Voltage != nil || state.Current != nil || state.Energy != nil {
		t.Fatal("expected all metering fields nil for empty payload")
	}

	if _, ok := mapAction(raw); ok {
		t.Fatal("expected no action for empty payload")
	}
}

func TestMapDeviceState_UnknownFields(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","brightness":100,"unknown_field":"value","another":42}`)
	state, err := mapDeviceState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.On == nil || !*state.On {
		t.Fatal("expected On=true")
	}
	if state.Brightness == nil || *state.Brightness != 100 {
		t.Fatalf("expected Brightness=100, got %v", state.Brightness)
	}
}
