package tuya

import (
	"encoding/json"
	"math"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const Source device.Source = "tuya"

type valueSpec struct {
	Range []string `json:"range"`
	Min   *float64 `json:"min"`
	Max   *float64 `json:"max"`
	Unit  string   `json:"unit"`
}

func mapDevice(info DeviceInfo, functions []Function) device.Device {
	name := info.Name
	if name == "" {
		name = info.ProductName
	}
	if name == "" {
		name = info.ID
	}
	return device.Device{
		ID:           device.DeviceID(info.ID),
		Name:         name,
		Source:       Source,
		Type:         mapDeviceType(info),
		Capabilities: mapCapabilities(functions),
		Available:    info.Online,
	}
}

func mapDeviceType(info DeviceInfo) device.DeviceType {
	if info.Category == "kt" || strings.Contains(strings.ToLower(info.ProductName), "air conditioner") {
		return device.Climate
	}
	return device.Unknown
}

func mapCapabilities(functions []Function) []device.Capability {
	out := make([]device.Capability, 0, len(functions))
	for _, fn := range functions {
		switch fn.Code {
		case "switch":
			out = append(out, device.Capability{Name: device.CapOnOff, Type: "binary", Access: 7})
		case "temp_set":
			min, max, unit := numericSpec(fn.Values)
			out = append(out, device.Capability{Name: device.CapTargetTemperature, Type: "numeric", ValueMin: min, ValueMax: max, Unit: unit, Access: 7})
		case "mode":
			values := enumSpec(fn.Values)
			out = append(out, device.Capability{Name: device.CapHvacMode, Type: "enum", Values: values, Access: 7})
		case "fan_speed", "fan_speed_enum", "windspeed":
			values := enumSpec(fn.Values)
			out = append(out, device.Capability{Name: device.CapFanMode, Type: "enum", Values: values, Access: 7})
		case "swing", "switch_horizontal", "switch_vertical":
			out = append(out, device.Capability{Name: device.CapSwing, Type: "binary", Values: []string{"off", "on"}, Access: 7})
		}
	}
	return out
}

func mapState(status []Status) device.DeviceState {
	var st device.DeviceState
	for _, item := range status {
		switch item.Code {
		case "switch":
			if v, ok := item.Value.(bool); ok {
				st.On = device.Ptr(v)
			}
		case "temp_set":
			if v, ok := numberValue(item.Value); ok {
				st.TargetTemperature = device.Ptr(v)
			}
		case "temp_current":
			if v, ok := numberValue(item.Value); ok {
				st.Temperature = device.Ptr(v)
			}
		case "mode":
			if v, ok := item.Value.(string); ok {
				st.HvacMode = device.Ptr(mapHvacModeFromTuya(v))
			}
		case "fan_speed", "fan_speed_enum", "windspeed":
			if v, ok := item.Value.(string); ok {
				st.FanMode = device.Ptr(v)
			}
		case "swing", "switch_horizontal", "switch_vertical":
			if v, ok := item.Value.(bool); ok {
				swing := "off"
				if v {
					swing = "on"
				}
				st.Swing = &swing
			}
		}
	}
	return st
}

func commandsFor(cmd device.Command) []Command {
	var out []Command
	if cmd.On != nil {
		out = append(out, Command{Code: "switch", Value: *cmd.On})
	}
	if cmd.TargetTemperature != nil {
		out = append(out, Command{Code: "temp_set", Value: int(math.Round(*cmd.TargetTemperature))})
	}
	if cmd.HvacMode != nil {
		out = append(out, Command{Code: "mode", Value: mapHvacModeToTuya(*cmd.HvacMode)})
	}
	if cmd.FanMode != nil {
		out = append(out, Command{Code: "fan_speed", Value: *cmd.FanMode})
	}
	if cmd.Swing != nil {
		out = append(out, Command{Code: "swing", Value: *cmd.Swing == "on"})
	}
	return out
}

func numericSpec(raw string) (*float64, *float64, string) {
	var spec valueSpec
	if err := json.Unmarshal([]byte(raw), &spec); err != nil {
		return nil, nil, ""
	}
	return spec.Min, spec.Max, spec.Unit
}

func enumSpec(raw string) []string {
	var spec valueSpec
	if err := json.Unmarshal([]byte(raw), &spec); err != nil {
		return nil
	}
	for i, v := range spec.Range {
		spec.Range[i] = mapHvacModeFromTuya(v)
	}
	return spec.Range
}

func numberValue(v any) (float64, bool) {
	switch n := v.(type) {
	case float64:
		return n, true
	case int:
		return float64(n), true
	case json.Number:
		f, err := n.Float64()
		return f, err == nil
	default:
		return 0, false
	}
}

func mapHvacModeFromTuya(v string) string {
	switch v {
	case "cold":
		return "cool"
	case "wet":
		return "dry"
	case "wind":
		return "fan_only"
	case "hot":
		return "heat"
	default:
		return v
	}
}

func mapHvacModeToTuya(v string) string {
	switch v {
	case "cool":
		return "cold"
	case "dry":
		return "wet"
	case "fan_only":
		return "wind"
	case "heat":
		return "hot"
	default:
		return v
	}
}
