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
		switch p := evt.Payload.(type) {
		case device.LightState:
			return formatLight(source, p)
		case device.SensorState:
			return formatSensor(source, p)
		case device.SwitchState:
			return formatSwitch(source, p)
		}
		return fmt.Sprintf("%s state changed", source)

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

func formatLight(name string, s device.LightState) string {
	var parts []string
	if s.On != nil {
		if *s.On {
			parts = append(parts, "on")
		} else {
			return fmt.Sprintf("%s turned off", name)
		}
	}
	if s.Brightness != nil {
		// Zigbee brightness is 0-254; convert to a rough percentage for display.
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
	if len(parts) == 0 {
		return fmt.Sprintf("%s state updated", name)
	}
	if len(parts) == 1 && parts[0] == "on" {
		return fmt.Sprintf("%s turned on", name)
	}
	return fmt.Sprintf("%s set to %s", name, strings.Join(parts, ", "))
}

func formatSensor(name string, s device.SensorState) string {
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
	if len(parts) == 0 {
		return fmt.Sprintf("%s reported", name)
	}
	return fmt.Sprintf("%s: %s", name, strings.Join(parts, ", "))
}

func formatSwitch(name string, s device.SwitchState) string {
	if s.Action == nil || *s.Action == "" {
		return fmt.Sprintf("%s pressed", name)
	}
	return fmt.Sprintf("%s: %s", name, *s.Action)
}
