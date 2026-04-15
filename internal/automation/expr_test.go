package automation

import (
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func evalTestExpr(t *testing.T, expression string, reader device.StateReader, event eventbus.Event, now time.Time) (bool, error) {
	t.Helper()
	prog, err := compileExpr(expression)
	if err != nil {
		return false, err
	}
	env := buildEnv(reader, event, now)
	return evalExpr(prog, env)
}

func TestExprSimpleComparison(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(200)})

	result, err := evalTestExpr(t, `device("light-1").brightness > 100`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true")
	}
}

func TestExprSimpleComparisonFalse(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(50)})

	result, err := evalTestExpr(t, `device("light-1").brightness > 100`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false")
	}
}

func TestExprAnd(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setLightState("light-1", &device.LightState{On: device.Ptr(true)})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(30.0)})

	result, err := evalTestExpr(t, `device("light-1").on == true && device("sensor-1").temperature > 25`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true")
	}
}

func TestExprAndPartialFalse(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setLightState("light-1", &device.LightState{On: device.Ptr(true)})
	reader.setSensorState("sensor-1", &device.SensorState{Temperature: device.Ptr(20.0)})

	result, err := evalTestExpr(t, `device("light-1").on == true && device("sensor-1").temperature > 25`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false")
	}
}

func TestExprOr(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "sensor-1", Name: "sensor-1"})
	reader.setSensorState("sensor-1", &device.SensorState{
		Temperature: device.Ptr(25.0),
		Humidity:    device.Ptr(75.0),
	})

	result, err := evalTestExpr(t, `device("sensor-1").temperature > 30 || device("sensor-1").humidity > 70`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true")
	}
}

func TestExprNot(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{On: device.Ptr(true)})

	result, err := evalTestExpr(t, `!(device("light-1").on == true)`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false")
	}
}

func TestExprTimeHour(t *testing.T) {
	reader := newMockStateReader()

	late := time.Date(2025, 1, 1, 22, 0, 0, 0, time.UTC)
	result, err := evalTestExpr(t, `time.hour >= 21`, reader, eventbus.Event{}, late)
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true for hour 22")
	}

	early := time.Date(2025, 1, 1, 10, 0, 0, 0, time.UTC)
	result, err = evalTestExpr(t, `time.hour >= 21`, reader, eventbus.Event{}, early)
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false for hour 10")
	}
}

func TestExprTimeWeekday(t *testing.T) {
	reader := newMockStateReader()
	monday := time.Date(2025, 1, 6, 12, 0, 0, 0, time.UTC) // Monday

	result, err := evalTestExpr(t, `time.weekday == "Monday"`, reader, eventbus.Event{}, monday)
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true for Monday")
	}
}

func TestExprTriggerAccess(t *testing.T) {
	reader := newMockStateReader()
	event := eventbus.Event{DeviceID: "switch-1"}

	result, err := evalTestExpr(t, `trigger.device_id == "switch-1"`, reader, event, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if !result {
		t.Fatal("expected true")
	}
}

func TestExprDeviceNotFound(t *testing.T) {
	reader := newMockStateReader()

	result, err := evalTestExpr(t, `device("nonexistent").brightness > 0`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false for nonexistent device")
	}
}

func TestExprDeviceNotFoundNoError(t *testing.T) {
	reader := newMockStateReader()

	_, err := evalTestExpr(t, `device("nonexistent").brightness > 0`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal("expected no error for nonexistent device, got:", err)
	}
}

func TestExprSyntaxError(t *testing.T) {
	err := ValidateExpression(`device("light-1".brightness > 100`)
	if err == nil {
		t.Fatal("expected compile error for syntax error")
	}
}

func TestExprTypeError(t *testing.T) {
	reader := newMockStateReader()
	reader.addDevice(device.Device{ID: "light-1", Name: "light-1"})
	reader.setLightState("light-1", &device.LightState{Brightness: device.Ptr(200)})

	result, err := evalTestExpr(t, `device("light-1").brightness > "hello"`, reader, eventbus.Event{}, time.Now())
	if err != nil {
		t.Fatal(err)
	}
	if result {
		t.Fatal("expected false for type mismatch comparison")
	}
}
