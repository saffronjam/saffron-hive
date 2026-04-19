package automation

import (
	"fmt"
	"time"

	"github.com/expr-lang/expr"
	"github.com/expr-lang/expr/vm"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// TriggerContext holds the triggering event fields accessible in expressions.
type TriggerContext struct {
	DeviceID string `expr:"device_id"`
	Payload  any    `expr:"payload"`
}

// TimeContext holds time accessors for expression evaluation.
type TimeContext struct {
	Hour    int    `expr:"hour"`
	Minute  int    `expr:"minute"`
	Second  int    `expr:"second"`
	Weekday string `expr:"weekday"`
}

// ExprEnv is the environment passed to expr-lang for condition evaluation.
type ExprEnv struct {
	DeviceFn func(string) map[string]any `expr:"device"`
	Trigger  TriggerContext              `expr:"trigger"`
	Time     TimeContext                 `expr:"time"`
}

func buildTimeContext(t time.Time) TimeContext {
	return TimeContext{
		Hour:    t.Hour(),
		Minute:  t.Minute(),
		Second:  t.Second(),
		Weekday: t.Weekday().String(),
	}
}

func deviceLookup(reader device.StateReader) func(string) map[string]any {
	return func(name string) map[string]any {
		result := make(map[string]any)

		var targetID device.DeviceID
		for _, d := range reader.ListDevices() {
			if d.Name == name {
				targetID = d.ID
				break
			}
		}
		if targetID == "" {
			return result
		}

		if ls, ok := reader.GetLightState(targetID); ok && ls != nil {
			if ls.On != nil {
				result["on"] = *ls.On
			}
			if ls.Brightness != nil {
				result["brightness"] = *ls.Brightness
			}
			if ls.ColorTemp != nil {
				result["color_temp"] = *ls.ColorTemp
			}
		}

		if ss, ok := reader.GetSensorState(targetID); ok && ss != nil {
			if ss.Temperature != nil {
				result["temperature"] = *ss.Temperature
			}
			if ss.Humidity != nil {
				result["humidity"] = *ss.Humidity
			}
			if ss.Battery != nil {
				result["battery"] = *ss.Battery
			}
			if ss.Pressure != nil {
				result["pressure"] = *ss.Pressure
			}
			if ss.Illuminance != nil {
				result["illuminance"] = *ss.Illuminance
			}
		}

		if sw, ok := reader.GetSwitchState(targetID); ok && sw != nil {
			if sw.Action != nil {
				result["action"] = *sw.Action
			}
		}

		return result
	}
}

func buildEnv(reader device.StateReader, event eventbus.Event, now time.Time) ExprEnv {
	return ExprEnv{
		DeviceFn: deviceLookup(reader),
		Trigger: TriggerContext{
			DeviceID: event.DeviceID,
			Payload:  event.Payload,
		},
		Time: buildTimeContext(now),
	}
}

// buildScheduledEnv builds an ExprEnv for evaluation triggered by a schedule
// (cron) firing. There is no triggering event, so the Trigger context is zero.
func buildScheduledEnv(reader device.StateReader, now time.Time) ExprEnv {
	return ExprEnv{
		DeviceFn: deviceLookup(reader),
		Time:     buildTimeContext(now),
	}
}

func compileExpr(expression string) (*vm.Program, error) {
	return expr.Compile(expression, expr.Env(ExprEnv{}), expr.AsBool())
}

func evalExpr(program *vm.Program, env ExprEnv) (bool, error) {
	output, err := expr.Run(program, env)
	if err != nil {
		return false, nil
	}
	result, ok := output.(bool)
	if !ok {
		return false, fmt.Errorf("expression did not return bool, got %T", output)
	}
	return result, nil
}

// ValidateExpression compiles an expression against the automation environment
// and returns any error. Use at save time to catch syntax and type errors.
func ValidateExpression(expression string) error {
	_, err := compileExpr(expression)
	return err
}
