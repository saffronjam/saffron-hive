package automation

import (
	"fmt"
	"math"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// ValidateAction checks the concrete payload and target shape used by the executor.
func ValidateAction(c ActionConfig) error {
	switch c.ActionType {
	case ActionSetDeviceState, ActionToggleDeviceState, ActionChangeValue, ActionConfigureDevice, ActionRunEffect:
		switch device.TargetType(c.TargetType) {
		case device.TargetDevice, device.TargetGroup, device.TargetRoom:
			if c.TargetID == "" {
				return fmt.Errorf("action target_id is required")
			}
		case device.TargetExpression:
			if err := device.ValidateExpression(c.TargetExpr); err != nil {
				return err
			}
		default:
			return fmt.Errorf("unknown action target_type %q", c.TargetType)
		}
	}
	switch c.ActionType {
	case ActionSetDeviceState:
		var payload struct {
			On                *bool         `json:"on"`
			Brightness        *int          `json:"brightness"`
			ColorTemp         *int          `json:"colorTemp"`
			Color             *device.Color `json:"color"`
			Transition        *float64      `json:"transition"`
			TargetTemperature *float64      `json:"targetTemperature"`
			HvacMode          *string       `json:"hvacMode"`
			FanMode           *string       `json:"fanMode"`
			Swing             *string       `json:"swing"`
		}
		if err := decodeNodeConfig(c.Payload, &payload); err != nil {
			return err
		}
		if payload.On == nil && payload.Brightness == nil && payload.ColorTemp == nil && payload.Color == nil && payload.TargetTemperature == nil && payload.HvacMode == nil && payload.FanMode == nil && payload.Swing == nil {
			return fmt.Errorf("desired state is required")
		}
		return device.ValidateCommand(device.Command{On: payload.On, Brightness: payload.Brightness, ColorTemp: payload.ColorTemp, Color: payload.Color, Transition: payload.Transition, TargetTemperature: payload.TargetTemperature, HvacMode: payload.HvacMode, FanMode: payload.FanMode, Swing: payload.Swing})
	case ActionChangeValue:
		var p changeValuePayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}

		if _, ok := numericFieldByCap(p.Field); !ok {
			return fmt.Errorf("unsupported numeric field %q", p.Field)
		}
		if p.Delta == 0 || math.IsNaN(p.Delta) || math.IsInf(p.Delta, 0) {
			return fmt.Errorf("delta must be finite and non-zero")
		}
		if p.Mode != "" && p.Mode != "absolute" && p.Mode != "percent" {
			return fmt.Errorf("unknown change mode %q", p.Mode)
		}
	case ActionToggleDeviceState:
		if c.Payload != "" {
			var p struct{}
			return decodeNodeConfig(c.Payload, &p)
		}
	case ActionConfigureDevice:
		var p configureDevicePayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if c.TargetType != TargetDevice || len(p.Settings) == 0 {
			return fmt.Errorf("configure_device requires a device and settings")
		}
	case ActionActivateScene:
		if c.Payload == "" {
			return fmt.Errorf("activate_scene requires a scene_id in payload")
		}
		var p activateScenePayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if strings.TrimSpace(p.SceneID) == "" {
			return fmt.Errorf("scene_id is required")
		}
	case ActionCycleScenes:
		var p cycleScenesPayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if len(p.Scenes) < 2 {
			return fmt.Errorf("cycle_scenes requires at least two scenes")
		}
		for _, id := range p.Scenes {
			if strings.TrimSpace(id) == "" {
				return fmt.Errorf("scene ID is required")
			}
		}
	case ActionRunEffect:
		var p runEffectPayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if (p.EffectID == "") == (p.NativeName == "") {
			return fmt.Errorf("exactly one effect_id or native_name is required")
		}
	case ActionRaiseAlarm:
		var p raiseAlarmPayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if strings.TrimSpace(p.AlarmID) == "" || strings.TrimSpace(p.Message) == "" {
			return fmt.Errorf("alarm_id and message are required")
		}
		if store.AlarmSeverity(p.Severity) != store.AlarmSeverityHigh && store.AlarmSeverity(p.Severity) != store.AlarmSeverityMedium && store.AlarmSeverity(p.Severity) != store.AlarmSeverityLow {
			return fmt.Errorf("invalid alarm severity %q", p.Severity)
		}
		if store.AlarmKind(p.Kind) != store.AlarmKindAuto && store.AlarmKind(p.Kind) != store.AlarmKindOneShot {
			return fmt.Errorf("invalid alarm kind %q", p.Kind)
		}
	case ActionClearAlarm:
		var p clearAlarmPayload
		if err := decodeNodeConfig(c.Payload, &p); err != nil {
			return err
		}
		if strings.TrimSpace(p.AlarmID) == "" {
			return fmt.Errorf("alarm_id is required")
		}
	default:
		return fmt.Errorf("unknown action type %q", c.ActionType)
	}
	return nil
}
