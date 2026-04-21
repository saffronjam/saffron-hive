package infra

import (
	"os"
	"path/filepath"
	"runtime"
)

func fixturesDir() string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), "..", "fixtures")
}

// LoadBridgeDevices returns the bridge_devices.json fixture content.
func LoadBridgeDevices() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "bridge_devices.json"))
}

// LoadLightState returns the light_state.json fixture content.
func LoadLightState() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "light_state.json"))
}

// LoadSensorState returns the sensor_state.json fixture content.
func LoadSensorState() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "sensor_state.json"))
}

// LoadButtonState returns the button_state.json fixture content. Buttons
// report a single transient "action" payload per press.
func LoadButtonState() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "button_state.json"))
}

// LoadPlugState returns the plug_state.json fixture content. Plugs report
// on/off state together with power metering (power, voltage, current, energy).
func LoadPlugState() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "plug_state.json"))
}

// LoadMosquittoConf returns the path to the mosquitto.conf fixture.
func LoadMosquittoConf() string {
	return filepath.Join(fixturesDir(), "mosquitto.conf")
}
