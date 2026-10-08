package automation

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/expr-lang/expr"
	"github.com/expr-lang/expr/vm"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

// exprNameResolver resolves group, room and scene IDs from human-readable
// names. *store.DB satisfies this implicitly via the methods of the same name.
type exprNameResolver interface {
	ResolveGroupIDByName(ctx context.Context, name string) (string, bool, error)
	ResolveRoomIDByName(ctx context.Context, name string) (string, bool, error)
	ResolveSceneIDByName(ctx context.Context, name string) (string, bool, error)
}

// sceneActivity reports whether a scene is currently the live state of its
// devices. *scene.Runner satisfies it.
type sceneActivity interface {
	IsActive(sceneID string) bool
}

// TriggerContext holds the triggering event fields accessible in expressions.
type TriggerContext struct {
	DeviceID string `expr:"device_id"`
	Payload  any    `expr:"payload"`
}

// TimeContext holds the local clock and time-window checks. Times are
// "HH:MM" or "HH:MM:SS"; a window whose end is before its start wraps
// past midnight.
type TimeContext struct {
	Hour    int                       `expr:"hour"`
	Minute  int                       `expr:"minute"`
	Second  int                       `expr:"second"`
	Weekday string                    `expr:"weekday"`
	Between func(string, string) bool `expr:"between"`
	After   func(string) bool         `expr:"after"`
	Before  func(string) bool         `expr:"before"`
}

// DayContext checks the local weekday. Days are three-letter or full English
// names in any case.
type DayContext struct {
	In func(...string) bool `expr:"in"`
}

// ExprEnv is the environment passed to expr-lang for trigger filters and
// conditions.
//
// Targets passed to the aggregate functions are either a device, group or
// room id or name, or a map: {"device": id}, {"group": id}, {"room": id}
// or {"where": [clauses]} with clauses in the target_expr shape.
type ExprEnv struct {
	DeviceFn    func(string) map[string]any `expr:"device"`
	RoomFn      func(string) map[string]any `expr:"room"`
	GroupFn     func(string) map[string]any `expr:"group"`
	AnyOf       func(any, string, any) bool `expr:"any_of"`
	AllOf       func(any, string, any) bool `expr:"all_of"`
	CountOf     func(any, string, any) int  `expr:"count_of"`
	AvgOf       func(any, string) float64   `expr:"avg_of"`
	MinOf       func(any, string) float64   `expr:"min_of"`
	MaxOf       func(any, string) float64   `expr:"max_of"`
	Since       func(any, string) float64   `expr:"since"`
	Duration    func(string) float64        `expr:"duration"`
	SceneActive func(string) bool           `expr:"scene_active"`
	Trigger     TriggerContext              `expr:"trigger"`
	Time        TimeContext                 `expr:"time"`
	Day         DayContext                  `expr:"day"`
}

// exprScope is what expression functions read during an evaluation.
// names, scenes and changes may be nil.
type exprScope struct {
	ctx      context.Context
	reader   device.StateReader
	resolver device.TargetResolver
	names    exprNameResolver
	scenes   sceneActivity
	changes  *changeTracker
}

func (s exprScope) env(event *eventbus.Event, now time.Time) ExprEnv {
	env := ExprEnv{
		DeviceFn:    s.deviceState,
		RoomFn:      func(ref string) map[string]any { return s.aggregateState(s.roomDevices(ref)) },
		GroupFn:     func(ref string) map[string]any { return s.aggregateState(s.groupDevices(ref)) },
		AnyOf:       s.anyOf,
		AllOf:       s.allOf,
		CountOf:     s.countOf,
		AvgOf:       s.avgOf,
		MinOf:       s.minOf,
		MaxOf:       s.maxOf,
		Since:       func(target any, field string) float64 { return s.since(target, field, now) },
		Duration:    parseDurationSeconds,
		SceneActive: s.sceneActive,
		Time:        buildTimeContext(now),
		Day:         buildDayContext(now),
	}
	if event != nil {
		payload := event.Payload
		if incoming, ok := event.Payload.(webhook.Event); ok {
			payload = incoming.ExpressionPayload()
		}
		env.Trigger = TriggerContext{DeviceID: event.DeviceID, Payload: payload}
	}
	return env
}

func buildTimeContext(t time.Time) TimeContext {
	second := t.Hour()*3600 + t.Minute()*60 + t.Second()
	return TimeContext{
		Hour:    t.Hour(),
		Minute:  t.Minute(),
		Second:  t.Second(),
		Weekday: t.Weekday().String(),
		Between: func(from, to string) bool {
			start, okStart := parseClock(from)
			end, okEnd := parseClock(to)
			if !okStart || !okEnd {
				return false
			}
			if start <= end {
				return second >= start && second < end
			}
			return second >= start || second < end
		},
		After: func(at string) bool {
			start, ok := parseClock(at)
			return ok && second >= start
		},
		Before: func(at string) bool {
			end, ok := parseClock(at)
			return ok && second < end
		},
	}
}

func buildDayContext(t time.Time) DayContext {
	return DayContext{
		In: func(days ...string) bool {
			for _, day := range days {
				if weekday, ok := parseWeekday(day); ok && weekday == t.Weekday() {
					return true
				}
			}
			return false
		},
	}
}

// parseClock returns the second of the day for "HH:MM" or "HH:MM:SS".
func parseClock(value string) (int, bool) {
	parts := strings.Split(value, ":")
	if len(parts) < 2 || len(parts) > 3 {
		return 0, false
	}
	limits := []int{24, 60, 60}
	total := 0
	for i, part := range parts {
		n, err := strconv.Atoi(part)
		if err != nil || n < 0 || n >= limits[i] {
			return 0, false
		}
		total += n * []int{3600, 60, 1}[i]
	}
	return total, true
}

func parseWeekday(value string) (time.Weekday, bool) {
	lower := strings.ToLower(value)
	for day := time.Sunday; day <= time.Saturday; day++ {
		name := strings.ToLower(day.String())
		if lower == name || lower == name[:3] {
			return day, true
		}
	}
	return 0, false
}

// parseDurationSeconds accepts Go durations ("10m", "1h30m") plus whole days
// ("2d"). Invalid input is NaN, which compares false.
func parseDurationSeconds(value string) float64 {
	if days, ok := strings.CutSuffix(value, "d"); ok {
		n, err := strconv.ParseFloat(days, 64)
		if err != nil {
			return math.NaN()
		}
		return n * 86400
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		return math.NaN()
	}
	return d.Seconds()
}

// deviceState is the device(...) accessor. It resolves the reference as a
// device id, a device name, a group, then a room. Devices return their full
// state; groups and rooms return {"on": <any member on>}.
func (s exprScope) deviceState(ref string) map[string]any {
	if id, ok := s.deviceID(ref); ok {
		st, ok := s.reader.GetDeviceState(id)
		if !ok || st == nil {
			return map[string]any{}
		}
		return stateFields(st)
	}
	if ids := s.groupDevices(ref); len(ids) > 0 {
		return s.aggregateState(ids)
	}
	return s.aggregateState(s.roomDevices(ref))
}

func (s exprScope) aggregateState(ids []device.DeviceID) map[string]any {
	if len(ids) == 0 {
		return map[string]any{}
	}
	return map[string]any{"on": aggregateOn(s.reader, ids)}
}

// deviceID resolves a device id or, failing that, a device display name.
func (s exprScope) deviceID(ref string) (device.DeviceID, bool) {
	if _, ok := s.reader.GetDevice(device.DeviceID(ref)); ok {
		return device.DeviceID(ref), true
	}
	for _, d := range s.reader.ListDevices() {
		if d.DisplayName() == ref {
			return d.ID, true
		}
	}
	return "", false
}

func (s exprScope) groupDevices(ref string) []device.DeviceID {
	if ids := s.resolver.ResolveTargetDeviceIDs(s.ctx, device.TargetGroup, ref); len(ids) > 0 {
		return ids
	}
	if s.names == nil {
		return nil
	}
	if id, found, _ := s.names.ResolveGroupIDByName(s.ctx, ref); found {
		return s.resolver.ResolveTargetDeviceIDs(s.ctx, device.TargetGroup, id)
	}
	return nil
}

func (s exprScope) roomDevices(ref string) []device.DeviceID {
	if ids := s.resolver.ResolveTargetDeviceIDs(s.ctx, device.TargetRoom, ref); len(ids) > 0 {
		return ids
	}
	if s.names == nil {
		return nil
	}
	if id, found, _ := s.names.ResolveRoomIDByName(s.ctx, ref); found {
		return s.resolver.ResolveTargetDeviceIDs(s.ctx, device.TargetRoom, id)
	}
	return nil
}

// targetDevices resolves an expression target argument to its devices.
func (s exprScope) targetDevices(target any) []device.DeviceID {
	switch t := target.(type) {
	case string:
		if id, ok := s.deviceID(t); ok {
			return []device.DeviceID{id}
		}
		if ids := s.groupDevices(t); len(ids) > 0 {
			return ids
		}
		return s.roomDevices(t)
	case map[string]any:
		if ref, ok := t["device"].(string); ok {
			if id, ok := s.deviceID(ref); ok {
				return []device.DeviceID{id}
			}
			return nil
		}
		if ref, ok := t["group"].(string); ok {
			return s.groupDevices(ref)
		}
		if ref, ok := t["room"].(string); ok {
			return s.roomDevices(ref)
		}
		if clauses, ok := t["where"]; ok {
			raw, err := json.Marshal(clauses)
			if err != nil {
				return nil
			}
			var expression device.Expression
			if err := json.Unmarshal(raw, &expression); err != nil {
				return nil
			}
			return device.EvaluateExpression(s.ctx, s.reader, s.resolver, expression)
		}
	}
	return nil
}

func (s exprScope) fieldValues(target any, field string) []any {
	var values []any
	for _, id := range s.targetDevices(target) {
		st, ok := s.reader.GetDeviceState(id)
		if !ok || st == nil {
			continue
		}
		if value, ok := stateFields(st)[field]; ok {
			values = append(values, value)
		}
	}
	return values
}

func (s exprScope) anyOf(target any, field string, want any) bool {
	for _, value := range s.fieldValues(target, field) {
		if valuesEqual(value, want) {
			return true
		}
	}
	return false
}

// allOf is true when every device in the target that reports the field has
// the value, and at least one does.
func (s exprScope) allOf(target any, field string, want any) bool {
	values := s.fieldValues(target, field)
	for _, value := range values {
		if !valuesEqual(value, want) {
			return false
		}
	}
	return len(values) > 0
}

func (s exprScope) countOf(target any, field string, want any) int {
	count := 0
	for _, value := range s.fieldValues(target, field) {
		if valuesEqual(value, want) {
			count++
		}
	}
	return count
}

// numbers returns the numeric values of a field across the target. Devices
// without the field are skipped.
func (s exprScope) numbers(target any, field string) []float64 {
	var numbers []float64
	for _, value := range s.fieldValues(target, field) {
		if n, ok := toFloat(value); ok {
			numbers = append(numbers, n)
		}
	}
	return numbers
}

// avgOf, minOf and maxOf are NaN for a target with no values, which compares
// false.
func (s exprScope) avgOf(target any, field string) float64 {
	numbers := s.numbers(target, field)
	if len(numbers) == 0 {
		return math.NaN()
	}
	sum := 0.0
	for _, n := range numbers {
		sum += n
	}
	return sum / float64(len(numbers))
}

func (s exprScope) minOf(target any, field string) float64 {
	return fold(s.numbers(target, field), math.Min)
}

func (s exprScope) maxOf(target any, field string) float64 {
	return fold(s.numbers(target, field), math.Max)
}

func fold(numbers []float64, combine func(a, b float64) float64) float64 {
	if len(numbers) == 0 {
		return math.NaN()
	}
	result := numbers[0]
	for _, n := range numbers[1:] {
		result = combine(result, n)
	}
	return result
}

// since is how many seconds ago the field last changed on any device in the
// target. Changes from before the engine started count from the start.
func (s exprScope) since(target any, field string, now time.Time) float64 {
	ids := s.targetDevices(target)
	if len(ids) == 0 || s.changes == nil {
		return math.NaN()
	}
	latest := s.changes.lastChange(ids, field)
	return now.Sub(latest).Seconds()
}

func (s exprScope) sceneActive(ref string) bool {
	if s.scenes == nil {
		return false
	}
	if s.scenes.IsActive(ref) {
		return true
	}
	if s.names == nil {
		return false
	}
	id, found, _ := s.names.ResolveSceneIDByName(s.ctx, ref)
	return found && s.scenes.IsActive(id)
}

func valuesEqual(a, b any) bool {
	if x, ok := toFloat(a); ok {
		y, ok := toFloat(b)
		return ok && x == y
	}
	return a == b
}

// stateFields maps a device state to the camelCase fields expressions read.
func stateFields(st *device.DeviceState) map[string]any {
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
	if st.TargetTemperature != nil {
		result["targetTemperature"] = *st.TargetTemperature
	}
	if st.HvacMode != nil {
		result["hvacMode"] = *st.HvacMode
	}
	if st.FanMode != nil {
		result["fanMode"] = *st.FanMode
	}
	if st.Swing != nil {
		result["swing"] = *st.Swing
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
	if st.Occupancy != nil {
		result["occupancy"] = *st.Occupancy
	}
	if st.Presence != nil {
		result["presence"] = *st.Presence
	}
	if st.Contact != nil {
		result["contact"] = *st.Contact
	}
	if st.Orientation != nil {
		result["orientation"] = *st.Orientation
	}
	if st.DevicePosture != nil {
		result["devicePosture"] = *st.DevicePosture
	}
	if st.LinkQuality != nil {
		result["linkQuality"] = *st.LinkQuality
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
	return result
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
