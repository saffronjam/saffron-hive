package device

import "testing"

func TestMergeLightState_SingleField(t *testing.T) {
	current := LightState{Brightness: Ptr(200)}
	update := LightState{ColorTemp: Ptr(350)}

	result := MergeLightState(current, update)

	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", result.Brightness)
	}
	if result.ColorTemp == nil || *result.ColorTemp != 350 {
		t.Fatalf("expected color_temp 350, got %v", result.ColorTemp)
	}
}

func TestMergeLightState_OverwriteField(t *testing.T) {
	current := LightState{Brightness: Ptr(200)}
	update := LightState{Brightness: Ptr(100)}

	result := MergeLightState(current, update)

	if result.Brightness == nil || *result.Brightness != 100 {
		t.Fatalf("expected brightness 100, got %v", result.Brightness)
	}
}

func TestMergeLightState_NilUpdateNoChange(t *testing.T) {
	current := LightState{Brightness: Ptr(200), On: Ptr(true)}
	update := LightState{}

	result := MergeLightState(current, update)

	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", result.Brightness)
	}
	if result.On == nil || *result.On != true {
		t.Fatalf("expected on true, got %v", result.On)
	}
}

func TestMergeLightState_BothEmpty(t *testing.T) {
	result := MergeLightState(LightState{}, LightState{})

	if result.On != nil || result.Brightness != nil || result.ColorTemp != nil || result.Color != nil || result.Transition != nil {
		t.Fatal("expected all fields nil for merge of two zero-value states")
	}
}

func TestMergeLightState_ColorMerge(t *testing.T) {
	current := LightState{Brightness: Ptr(200)}
	color := Color{R: 255, G: 0, B: 0}
	update := LightState{Color: &color}

	result := MergeLightState(current, update)

	if result.Color == nil || result.Color.R != 255 {
		t.Fatalf("expected color R=255, got %v", result.Color)
	}
	if result.Brightness == nil || *result.Brightness != 200 {
		t.Fatalf("expected brightness preserved, got %v", result.Brightness)
	}
}

func TestMergeSensorState_SingleField(t *testing.T) {
	current := SensorState{Temperature: Ptr(22.5), Humidity: Ptr(45.0)}
	update := SensorState{Temperature: Ptr(23.0)}

	result := MergeSensorState(current, update)

	if result.Temperature == nil || *result.Temperature != 23.0 {
		t.Fatalf("expected temperature 23.0, got %v", result.Temperature)
	}
	if result.Humidity == nil || *result.Humidity != 45.0 {
		t.Fatalf("expected humidity preserved at 45.0, got %v", result.Humidity)
	}
}

func TestMergeSensorState_AllFields(t *testing.T) {
	current := SensorState{}
	update := SensorState{
		Temperature: Ptr(20.0),
		Humidity:    Ptr(50.0),
		Battery:     Ptr(95),
		Pressure:    Ptr(1013.0),
		Illuminance: Ptr(300.0),
	}

	result := MergeSensorState(current, update)

	if result.Temperature == nil || *result.Temperature != 20.0 {
		t.Fatal("temperature not set")
	}
	if result.Humidity == nil || *result.Humidity != 50.0 {
		t.Fatal("humidity not set")
	}
	if result.Battery == nil || *result.Battery != 95 {
		t.Fatal("battery not set")
	}
	if result.Pressure == nil || *result.Pressure != 1013.0 {
		t.Fatal("pressure not set")
	}
	if result.Illuminance == nil || *result.Illuminance != 300.0 {
		t.Fatal("illuminance not set")
	}
}
