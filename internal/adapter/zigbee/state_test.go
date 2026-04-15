package zigbee

import (
	"encoding/json"
	"testing"
)

func TestMapLightState_Full(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","brightness":200,"color_temp":350,"color":{"r":255,"g":100,"b":0}}`)
	state, err := mapLightState(raw)
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

func TestMapLightState_Partial(t *testing.T) {
	raw := json.RawMessage(`{"brightness":100}`)
	state, err := mapLightState(raw)
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

func TestMapLightState_OnOff(t *testing.T) {
	onRaw := json.RawMessage(`{"state":"ON"}`)
	onState, err := mapLightState(onRaw)
	if err != nil {
		t.Fatal(err)
	}
	if onState.On == nil || !*onState.On {
		t.Fatal("expected On=true for state ON")
	}

	offRaw := json.RawMessage(`{"state":"OFF"}`)
	offState, err := mapLightState(offRaw)
	if err != nil {
		t.Fatal(err)
	}
	if offState.On == nil || *offState.On {
		t.Fatal("expected On=false for state OFF")
	}
}

func TestMapSensorState(t *testing.T) {
	raw := json.RawMessage(`{"temperature":22.5,"humidity":45.0,"battery":87}`)
	state, err := mapSensorState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.Temperature == nil || *state.Temperature != 22.5 {
		t.Fatalf("expected Temperature=22.5, got %v", state.Temperature)
	}
	if state.Humidity == nil || *state.Humidity != 45.0 {
		t.Fatalf("expected Humidity=45.0, got %v", state.Humidity)
	}
	if state.Battery == nil || *state.Battery != 87 {
		t.Fatalf("expected Battery=87, got %v", state.Battery)
	}
}

func TestMapSwitchState(t *testing.T) {
	raw := json.RawMessage(`{"action":"single"}`)
	state, err := mapSwitchState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if state.Action == nil || *state.Action != "single" {
		t.Fatalf("expected Action=single, got %v", state.Action)
	}
}

func TestMapState_EmptyPayload(t *testing.T) {
	raw := json.RawMessage(`{}`)

	ls, err := mapLightState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if ls.On != nil || ls.Brightness != nil || ls.ColorTemp != nil || ls.Color != nil {
		t.Fatal("expected all nil for empty payload")
	}

	ss, err := mapSensorState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if ss.Temperature != nil || ss.Humidity != nil || ss.Battery != nil {
		t.Fatal("expected all nil for empty payload")
	}

	sw, err := mapSwitchState(raw)
	if err != nil {
		t.Fatal(err)
	}
	if sw.Action != nil {
		t.Fatal("expected Action=nil for empty payload")
	}
}

func TestMapState_UnknownFields(t *testing.T) {
	raw := json.RawMessage(`{"state":"ON","brightness":100,"unknown_field":"value","another":42}`)
	state, err := mapLightState(raw)
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
