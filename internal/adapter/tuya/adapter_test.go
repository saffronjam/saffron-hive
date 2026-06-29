package tuya

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const acProduct = "vrredpnf22yayvhi"

func TestLocalDPSToState(t *testing.T) {
	st := localDPSToState(map[string]any{
		"1":   true,
		"2":   float64(16),
		"4":   "cold",
		"5":   "low",
		"110": true,
	}, acProduct)

	if st.On == nil || !*st.On {
		t.Fatalf("On = %v, want true", st.On)
	}
	if st.TargetTemperature == nil || *st.TargetTemperature != 16 {
		t.Fatalf("TargetTemperature = %v, want 16", st.TargetTemperature)
	}
	if st.HvacMode == nil || *st.HvacMode != "cool" {
		t.Fatalf("HvacMode = %v, want cool", st.HvacMode)
	}
	if st.FanMode == nil || *st.FanMode != "low" {
		t.Fatalf("FanMode = %v, want low", st.FanMode)
	}
	if st.Swing == nil || *st.Swing != "on" {
		t.Fatalf("Swing = %v, want on", st.Swing)
	}
}

func TestCommandToDPS(t *testing.T) {
	cmd := device.Command{On: device.Ptr(true), Swing: device.Ptr("on")}
	dps := commandToDPS(cmd, acProduct)
	if dps["1"] != true {
		t.Fatalf("dp1 = %v, want true", dps["1"])
	}
	if dps["110"] != true {
		t.Fatalf("dp110 (swing) = %v, want true", dps["110"])
	}
}

func TestAugmentCapabilitiesAddsHiddenDPs(t *testing.T) {
	out := augmentCapabilities([]device.Capability{{Name: device.CapOnOff}}, acProduct)
	has := func(n string) bool {
		for _, c := range out {
			if c.Name == n {
				return true
			}
		}
		return false
	}
	if !has(device.CapSwing) {
		t.Fatal("expected swing capability from DP map")
	}
	if !has(device.CapFanMode) {
		t.Fatal("expected fan_mode capability from DP map")
	}
	if !has(device.CapOnOff) {
		t.Fatal("on_off capability dropped")
	}
}
