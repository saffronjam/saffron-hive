package activity

import (
	"fmt"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// formatMessage produces a short human-readable one-liner for a bus event.
// deviceName is the resolved name of the event's device (may be "" when unknown
// or when the event is not device-scoped); sceneName / automationName resolve
// the corresponding payload references.
func formatMessage(evt eventbus.Event, deviceName, sceneName, automationName string) string {
	source := deviceName
	if source == "" {
		source = "Device"
	}

	switch evt.Type {
	case eventbus.EventDeviceStateChanged:
		if change, ok := evt.Payload.(device.DeviceStateChange); ok {
			return formatDeviceState(source, change.State)
		}
		return fmt.Sprintf("%s state changed", source)

	case eventbus.EventDeviceActionFired:
		if a, ok := evt.Payload.(device.Action); ok && a.Action != "" {
			return fmt.Sprintf("%s: %s", source, a.Action)
		}
		return fmt.Sprintf("%s action", source)

	case eventbus.EventDeviceAvailabilityChanged:
		online, _ := evt.Payload.(bool)
		if online {
			return fmt.Sprintf("%s came online", source)
		}
		return fmt.Sprintf("%s went offline", source)

	case eventbus.EventDeviceAdded:
		if d, ok := evt.Payload.(device.Device); ok && d.Name != "" {
			return fmt.Sprintf("New device discovered: %s", d.Name)
		}
		if source != "Device" {
			return fmt.Sprintf("New device discovered: %s", source)
		}
		return "New device discovered"

	case eventbus.EventDeviceRemoved:
		if source != "Device" {
			return fmt.Sprintf("Device removed: %s", source)
		}
		return "Device removed"

	case eventbus.EventCommandRequested:
		return fmt.Sprintf("Command sent to %s", source)

	case eventbus.EventSceneApplied:
		if sceneName != "" {
			return fmt.Sprintf("Scene applied: %s", sceneName)
		}
		return "Scene applied"

	case eventbus.EventAutomationTriggered:
		if automationName != "" {
			return fmt.Sprintf("Automation fired: %s", automationName)
		}
		return "Automation fired"

	case eventbus.EventAutomationNodeActivated:
		na, _ := evt.Payload.(automation.NodeActivation)
		label := automationName
		if label == "" {
			label = "Automation"
		}
		if na.Active {
			return fmt.Sprintf("%s: node activated", label)
		}
		return fmt.Sprintf("%s: node deactivated", label)
	}

	return string(evt.Type)
}

// formatDeviceState picks the most informative summary for a DeviceState
// based on which pointer fields are populated. Priority:
// metering > environmental sensor > light. A state with only On populated
// is rendered as a plug toggle.
func formatDeviceState(name string, s device.DeviceState) string {
	if parts := meteringParts(s); len(parts) > 0 {
		prefix := name
		if s.On != nil {
			if *s.On {
				prefix = fmt.Sprintf("%s on", name)
			} else {
				prefix = fmt.Sprintf("%s off", name)
			}
		}
		return fmt.Sprintf("%s: %s", prefix, strings.Join(parts, ", "))
	}
	if parts := sensorParts(s); len(parts) > 0 {
		return fmt.Sprintf("%s: %s", name, strings.Join(parts, ", "))
	}
	if parts := lightParts(s); len(parts) > 0 || s.On != nil {
		return formatLight(name, s, parts)
	}
	return fmt.Sprintf("%s state updated", name)
}

func meteringParts(s device.DeviceState) []string {
	var parts []string
	if s.Power != nil {
		parts = append(parts, fmt.Sprintf("%.0f W", *s.Power))
	}
	if s.Voltage != nil {
		parts = append(parts, fmt.Sprintf("%.0f V", *s.Voltage))
	}
	if s.Current != nil {
		parts = append(parts, fmt.Sprintf("%.2f A", *s.Current))
	}
	if s.Energy != nil {
		parts = append(parts, fmt.Sprintf("%.2f kWh", *s.Energy))
	}
	return parts
}

func sensorParts(s device.DeviceState) []string {
	var parts []string
	if s.Temperature != nil {
		parts = append(parts, fmt.Sprintf("%.1f°C", *s.Temperature))
	}
	if s.Humidity != nil {
		parts = append(parts, fmt.Sprintf("%.0f%% humidity", *s.Humidity))
	}
	if s.Pressure != nil {
		parts = append(parts, fmt.Sprintf("%.0f hPa", *s.Pressure))
	}
	if s.Illuminance != nil {
		parts = append(parts, fmt.Sprintf("%.0f lux", *s.Illuminance))
	}
	if s.Battery != nil {
		parts = append(parts, fmt.Sprintf("battery %d%%", *s.Battery))
	}
	return parts
}

func lightParts(s device.DeviceState) []string {
	var parts []string
	if s.Brightness != nil {
		pct := int((float64(*s.Brightness) / 254.0) * 100.0)
		if pct < 0 {
			pct = 0
		}
		if pct > 100 {
			pct = 100
		}
		parts = append(parts, fmt.Sprintf("%d%%", pct))
	}
	if s.ColorTemp != nil {
		parts = append(parts, fmt.Sprintf("%dK", *s.ColorTemp))
	}
	return parts
}

func formatLight(name string, s device.DeviceState, parts []string) string {
	if s.On != nil && !*s.On {
		return fmt.Sprintf("%s turned off", name)
	}
	if s.On != nil {
		parts = append([]string{"on"}, parts...)
	}
	if len(parts) == 0 {
		return fmt.Sprintf("%s state updated", name)
	}
	if len(parts) == 1 && parts[0] == "on" {
		return fmt.Sprintf("%s turned on", name)
	}
	return fmt.Sprintf("%s set to %s", name, strings.Join(parts, ", "))
}
