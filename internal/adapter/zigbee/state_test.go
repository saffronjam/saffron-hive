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
	raw := json.RawMessage(`{"temperature":22.5,"humidity":45.0,"battery":87}`)
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
	if state.Battery == nil || *state.Battery != 87 {
		t.Fatalf("expected Battery=87, got %v", state.Battery)
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
