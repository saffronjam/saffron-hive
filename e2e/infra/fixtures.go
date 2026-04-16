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

// LoadSwitchState returns the switch_state.json fixture content.
func LoadSwitchState() ([]byte, error) {
	return os.ReadFile(filepath.Join(fixturesDir(), "switch_state.json"))
}

// LoadMosquittoConf returns the path to the mosquitto.conf fixture.
func LoadMosquittoConf() string {
	return filepath.Join(fixturesDir(), "mosquitto.conf")
}
