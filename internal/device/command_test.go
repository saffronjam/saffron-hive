package device

import "testing"

func TestDeviceCommandWithLightCommand(t *testing.T) {
	cmd := DeviceCommand{
		DeviceID: DeviceID("light-1"),
		Payload: LightCommand{
			On:         Ptr(true),
			Brightness: Ptr(75),
		},
	}
	if cmd.DeviceID != "light-1" {
		t.Fatalf("expected light-1, got %s", cmd.DeviceID)
	}
	lc, ok := cmd.Payload.(LightCommand)
	if !ok {
		t.Fatal("expected payload to be LightCommand")
	}
	if *lc.On != true {
		t.Fatal("expected On to be true")
	}
	if *lc.Brightness != 75 {
		t.Fatalf("expected 75, got %d", *lc.Brightness)
	}
}

func TestDeviceCommandWithSensorState(t *testing.T) {
	cmd := DeviceCommand{
		DeviceID: DeviceID("sensor-1"),
		Payload: SensorState{
			Temperature: Ptr(19.5),
		},
	}
	ss, ok := cmd.Payload.(SensorState)
	if !ok {
		t.Fatal("expected payload to be SensorState")
	}
	if *ss.Temperature != 19.5 {
		t.Fatalf("expected 19.5, got %f", *ss.Temperature)
	}
}

func TestDeviceCommandTypeAssertion(t *testing.T) {
	cmd := DeviceCommand{
		DeviceID: DeviceID("light-2"),
		Payload:  LightCommand{On: Ptr(false)},
	}
	_, ok := cmd.Payload.(SensorState)
	if ok {
		t.Fatal("LightCommand should not assert to SensorState")
	}
}
