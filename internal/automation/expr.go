package automation

import (
	"context"
	"fmt"
	"time"

	"github.com/expr-lang/expr"
	"github.com/expr-lang/expr/vm"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// exprNameResolver resolves group / room IDs from human-readable names.
// *store.DB satisfies this implicitly via the methods of the same name.
type exprNameResolver interface {
	ResolveGroupIDByName(ctx context.Context, name string) (string, bool, error)
	ResolveRoomIDByName(ctx context.Context, name string) (string, bool, error)
}

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

// targetLookup returns the function bound to the `device(...)` accessor in
// stored condition expressions. Despite the name, it dispatches on the given
// label across three vocabularies in this order: device by name, then group
// by name, then room by name. Devices return their full per-capability state
// map; groups and rooms return only `{"on": <any-on>}` because aggregate
// semantics for non-binary capabilities (max? mean? any?) are intentionally
// not defined. Returns an empty map when the name matches none of the three.
func targetLookup(ctx context.Context, reader device.StateReader, resolver device.TargetResolver, names exprNameResolver) func(string) map[string]any {
	return func(name string) map[string]any {
		if m, ok := lookupDeviceByName(reader, name); ok {
			return m
		}
		if names != nil {
			if id, found, _ := names.ResolveGroupIDByName(ctx, name); found {
				ids := resolver.ResolveTargetDeviceIDs(ctx, device.TargetGroup, id)
				return map[string]any{"on": aggregateOn(reader, ids)}
			}
			if id, found, _ := names.ResolveRoomIDByName(ctx, name); found {
				ids := resolver.ResolveTargetDeviceIDs(ctx, device.TargetRoom, id)
				return map[string]any{"on": aggregateOn(reader, ids)}
			}
		}
		return map[string]any{}
	}
}

func lookupDeviceByName(reader device.StateReader, name string) (map[string]any, bool) {
	var targetID device.DeviceID
	for _, d := range reader.ListDevices() {
		if d.Name == name {
			targetID = d.ID
			break
		}
	}
	if targetID == "" {
		return nil, false
	}

	st, ok := reader.GetDeviceState(targetID)
	if !ok || st == nil {
		return map[string]any{}, true
	}

	result := make(map[string]any)
	if st.On != nil {
		result["on"] = *st.On
	}
	if st.Brightness != nil {
		result["brightness"] = *st.Brightness
	}
	if st.ColorTemp != nil {
		result["colorTemp"] = *st.ColorTemp
	}
	if st.Temperature != nil {
		result["temperature"] = *st.Temperature
	}
	if st.Humidity != nil {
		result["humidity"] = *st.Humidity
	}
	if st.Battery != nil {
		result["battery"] = *st.Battery
	}
	if st.Pressure != nil {
		result["pressure"] = *st.Pressure
	}
	if st.Illuminance != nil {
		result["illuminance"] = *st.Illuminance
	}
	if st.Power != nil {
		result["power"] = *st.Power
	}
	if st.Voltage != nil {
		result["voltage"] = *st.Voltage
	}
	if st.Current != nil {
		result["current"] = *st.Current
	}
	if st.Energy != nil {
		result["energy"] = *st.Energy
	}
	return result, true
}

func buildEnv(ctx context.Context, reader device.StateReader, resolver device.TargetResolver, names exprNameResolver, event eventbus.Event, now time.Time) ExprEnv {
	return ExprEnv{
		DeviceFn: targetLookup(ctx, reader, resolver, names),
		Trigger: TriggerContext{
			DeviceID: event.DeviceID,
			Payload:  event.Payload,
		},
		Time: buildTimeContext(now),
	}
}

// buildScheduledEnv builds an ExprEnv for evaluation triggered by a schedule
// (cron) firing. There is no triggering event, so the Trigger context is zero.
func buildScheduledEnv(ctx context.Context, reader device.StateReader, resolver device.TargetResolver, names exprNameResolver, now time.Time) ExprEnv {
	return ExprEnv{
		DeviceFn: targetLookup(ctx, reader, resolver, names),
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
