package tuya

import "github.com/saffronjam/saffron-hive/internal/device"

// Local control speaks in numeric data-point ids; the rest of the adapter
// (mapState, commandsFor) speaks in Tuya function codes. These tables translate
// between them per product. The cloud /functions endpoint omits some DPs (e.g.
// swing, fan_speed) for certain products, so they are declared here.

var productDPMaps = map[string]map[string]string{
	// WIFIACMB1WT12 portable air conditioner.
	"vrredpnf22yayvhi": {
		"1":   "switch",
		"2":   "temp_set",
		"3":   "temp_current",
		"4":   "mode",
		"5":   "fan_speed",
		"110": "swing",
	},
}

var defaultACDPMap = map[string]string{
	"1": "switch",
	"2": "temp_set",
	"3": "temp_current",
	"4": "mode",
	"5": "fan_speed",
}

func dpIDToCode(productID string) map[string]string {
	if m, ok := productDPMaps[productID]; ok {
		return m
	}
	return defaultACDPMap
}

func dpCodeToID(productID string) map[string]string {
	rev := make(map[string]string)
	for id, code := range dpIDToCode(productID) {
		rev[code] = id
	}
	return rev
}

// localDPSToState converts a local dp-id -> value map into a domain DeviceState
// by translating ids to codes and reusing mapState.
func localDPSToState(dps map[string]any, productID string) device.DeviceState {
	idToCode := dpIDToCode(productID)
	status := make([]Status, 0, len(dps))
	for id, val := range dps {
		if code, ok := idToCode[id]; ok {
			status = append(status, Status{Code: code, Value: val})
		}
	}
	return mapState(status)
}

// commandToDPS converts a domain Command into a local dp-id -> value map by
// reusing commandsFor and translating codes to ids.
func commandToDPS(cmd device.Command, productID string) map[string]any {
	codeToID := dpCodeToID(productID)
	out := make(map[string]any)
	for _, c := range commandsFor(cmd) {
		if id, ok := codeToID[c.Code]; ok {
			out[id] = c.Value
		}
	}
	return out
}

// basicCapForCode returns a capability for a function code without rich
// metadata, used to surface cloud-hidden DPs (swing, fan) declared in the DP map.
func basicCapForCode(code string) (device.Capability, bool) {
	switch code {
	case "switch":
		return device.Capability{Name: device.CapOnOff, Type: "binary", Access: 7}, true
	case "temp_set":
		return device.Capability{Name: device.CapTargetTemperature, Type: "numeric", Access: 7}, true
	case "mode":
		return device.Capability{Name: device.CapHvacMode, Type: "enum", Access: 7}, true
	case "fan_speed":
		return device.Capability{Name: device.CapFanMode, Type: "enum", Access: 7}, true
	case "swing":
		return device.Capability{Name: device.CapSwing, Type: "binary", Values: []string{"off", "on"}, Access: 7}, true
	}
	return device.Capability{}, false
}

// augmentCapabilities adds capabilities for any product DP-map code not already
// present in base (so cloud-hidden swing/fan still surface).
func augmentCapabilities(base []device.Capability, productID string) []device.Capability {
	present := make(map[string]struct{}, len(base))
	for _, c := range base {
		present[c.Name] = struct{}{}
	}
	for _, code := range dpIDToCode(productID) {
		capb, ok := basicCapForCode(code)
		if !ok {
			continue
		}
		if _, dup := present[capb.Name]; dup {
			continue
		}
		present[capb.Name] = struct{}{}
		base = append(base, capb)
	}
	return base
}
