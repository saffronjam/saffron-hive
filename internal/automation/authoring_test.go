package automation

import (
	"encoding/json"
	"reflect"
	"strings"
	"testing"
)

func authoringPtr[T any](v T) *T { return &v }

func TestAuthoringLiteralIdentity(t *testing.T) {
	for _, value := range []Literal{{StringValue: authoringPtr("true")}, {StringValue: authoringPtr("42")}, {StringValue: authoringPtr("")}, {StringValue: authoringPtr("a\"b\\c")}, {BooleanValue: authoringPtr(false)}, {NumberValue: authoringPtr(-12.5)}} {
		t.Run(stringMustJSON(value), func(t *testing.T) {
			original := AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "device_state", DeviceID: "sensor", Property: "occupancy", Comparator: "==", Value: &value}}
			raw, err := CompileAuthoring(NodeTrigger, original)
			if err != nil {
				t.Fatal(err)
			}
			restored, err := InterpretAuthoring(NodeTrigger, raw)
			if err != nil {
				t.Fatal(err)
			}
			if restored.Trigger.Mode != "device_state" || !reflect.DeepEqual(restored.Trigger.Value, &value) {
				t.Fatalf("lost literal: %s -> %#v", raw, restored.Trigger)
			}
			again, err := CompileAuthoring(NodeTrigger, restored)
			if err != nil || again != raw {
				t.Fatalf("round trip: %s -> %s (%v)", raw, again, err)
			}
		})
	}
}
func stringMustJSON(v Literal) string { b, _ := v.JSON(); return string(b) }

func TestAuthoringCustomSemantics(t *testing.T) {
	cases := []string{
		`device("sensor").occupancy != false`,
		`device("sensor").occupancy == nil`,
		`trigger.device_id == "sensor" && trigger.payload.state.occupancy != nil && trigger.payload.state.occupancy == nil`,
		`trigger.device_id == "sensor" && trigger.payload.state.occupancy != nil && trigger.payload.state.occupancy != false`,
		`trigger.device_id == "sensor" && trigger.payload.state.occupancy != false`,
		`trigger.device_id == "sensor" && trigger.payload.state.occupancy == false && time.after("23:00")`,
	}
	for _, expression := range cases {
		raw, _ := json.Marshal(authoredTriggerWire{Kind: "event", EventType: "device.state_changed", FilterExpr: expression, DeviceID: "sensor", HoldMs: 600000})
		config, err := InterpretAuthoring(NodeTrigger, string(raw))
		if err != nil {
			t.Fatal(err)
		}
		if config.Trigger.Mode != "custom" || config.Trigger.CustomExpr != expression {
			t.Fatalf("changed semantics: %s -> %#v", expression, config.Trigger)
		}
	}
}

func TestAuthoringHallwayHoldIdentity(t *testing.T) {
	old := TriggerConfig{Kind: TriggerEvent, EventType: "device.state_changed", HoldDeviceID: "sensor", HoldMs: 600000, FilterExpr: `device("sensor").occupancy == false`}
	config, err := CompileAuthoring(NodeTrigger, AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "device_state", DeviceID: "sensor", Property: "occupancy", Comparator: "==", Value: &Literal{BooleanValue: authoringPtr(false)}, HoldMs: 600000}})
	if err != nil {
		t.Fatal(err)
	}
	parsed, err := parseNodeConfig(NodeTrigger, config)
	if err != nil {
		t.Fatal(err)
	}
	if holdSignature(old) != holdSignature(parsed.(TriggerConfig)) {
		t.Fatal("equivalent held state resets timer")
	}
	old.FilterExpr = `device( "sensor" ).occupancy==false`
	if holdSignature(old) != holdSignature(parsed.(TriggerConfig)) {
		t.Fatal("formatting resets timer")
	}
	old.HoldMs = 300000
	if holdSignature(old) == holdSignature(parsed.(TriggerConfig)) {
		t.Fatal("changed hold duration retained timer")
	}
}

func TestAuthoringDraftPreservesSelections(t *testing.T) {
	for _, config := range []AuthoringConfig{
		{Trigger: &AuthoringTrigger{Mode: "device_state", DeviceID: "sensor", Property: "occupancy", HoldMs: 600000}},
		{Condition: &AuthoringCondition{Mode: "device_state", TargetType: "room", TargetID: "hallway"}},
		{Trigger: &AuthoringTrigger{Mode: "unset"}},
		{Trigger: &AuthoringTrigger{Mode: "schedule", ScheduleSubmode: "every", ScheduleIntervalUnit: "minutes"}},
		{Trigger: &AuthoringTrigger{Mode: "schedule", ScheduleSubmode: "custom"}},
		{Condition: &AuthoringCondition{Mode: "weekday"}},
		{Condition: &AuthoringCondition{Mode: "time_window"}},
	} {
		kind := NodeTrigger
		if config.Condition != nil {
			kind = NodeCondition
		}
		raw, err := CompileAuthoring(kind, config)
		if err != nil {
			t.Fatal(err)
		}
		if err := ValidateNodeShape(kind, raw); err != nil {
			t.Fatal(err)
		}
		restored, err := InterpretAuthoring(kind, raw)
		if err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(config, restored) {
			t.Fatalf("draft lost selections: %s", raw)
		}
		if _, err := parseNodeConfig(kind, raw); err == nil {
			t.Fatal("incomplete draft is executable")
		}
	}
}

func TestAuthoringConditionsAndMacros(t *testing.T) {
	cases := []AuthoringConfig{
		{Condition: &AuthoringCondition{Mode: "time_window", AfterHour: authoringPtr(0), BeforeHour: authoringPtr(4), Negate: true}},
		{Condition: &AuthoringCondition{Mode: "custom", CustomExpr: `!scene_active("night")`, Negate: true}},
		{Condition: &AuthoringCondition{Mode: "unset", Negate: true}},
		{Condition: &AuthoringCondition{Mode: "time_window", AfterHour: authoringPtr(0), AfterMinute: authoringPtr(0), BeforeHour: authoringPtr(4), BeforeMinute: authoringPtr(0)}},
		{Condition: &AuthoringCondition{Mode: "weekday", Weekdays: []string{"mon", "wed"}}},
		{Condition: &AuthoringCondition{Mode: "device_state", TargetType: "room", TargetID: "hallway", Property: "on", Comparator: "==", Value: &Literal{BooleanValue: authoringPtr(true)}}},
		{Condition: &AuthoringCondition{Mode: "custom", CustomExpr: `scene_active("night")`}},
		{Macro: &AuthoringMacro{Name: "night", Negate: true, Arguments: []json.RawMessage{json.RawMessage(`{"nested":[1,true,"x"]}`)}}},
	}
	for _, c := range cases {
		raw, err := CompileAuthoring(NodeCondition, c)
		if err != nil {
			t.Fatal(err)
		}
		read, err := InterpretAuthoring(NodeCondition, raw)
		if err != nil {
			t.Fatal(err)
		}
		again, err := CompileAuthoring(NodeCondition, read)
		if err != nil || raw != again {
			t.Fatalf("round trip: %s -> %s (%v)", raw, again, err)
		}
	}
	invalid := AuthoringConfig{Trigger: &AuthoringTrigger{}, Action: &AuthoringAction{}}
	if _, err := CompileAuthoring(NodeTrigger, invalid); err == nil {
		t.Fatal("multiple variants accepted")
	}
	if _, err := CompileAuthoring(NodeTrigger, AuthoringConfig{Action: &AuthoringAction{}}); err == nil {
		t.Fatal("wrong variant accepted")
	}
	invalidValue := Literal{StringValue: authoringPtr("false"), BooleanValue: authoringPtr(false)}
	if _, err := invalidValue.JSON(); err == nil {
		t.Fatal("ambiguous literal accepted")
	}
	null := Literal{NullValue: authoringPtr(true)}
	if raw, _ := null.expression(); strings.TrimSpace(raw) != "nil" {
		t.Fatal(raw)
	}
}

func TestAuthoringTriggerControlsRoundTrip(t *testing.T) {
	cases := []AuthoringTrigger{
		{Mode: "availability", DeviceID: "sensor"},
		{Mode: "device_event", DeviceID: "button", EventValue: "single"},
		{Mode: "device_event", DeviceID: "button"},
		{Mode: "schedule", ScheduleSubmode: "at", ScheduleHour: 7, ScheduleMinute: 13, ScheduleWeekdays: []string{"TUE", "FRI"}},
		{Mode: "schedule", ScheduleSubmode: "every", ScheduleIntervalValue: 10, ScheduleIntervalUnit: "seconds"},
		{Mode: "schedule", ScheduleSubmode: "every", ScheduleIntervalValue: 5, ScheduleIntervalUnit: "minutes"},
		{Mode: "schedule", ScheduleSubmode: "every", ScheduleIntervalValue: 2, ScheduleIntervalUnit: "hours"},
		{Mode: "schedule", ScheduleSubmode: "custom", CronExpr: "0 0 8 1 * *"},
		{Mode: "webhook", EndpointID: "hook", CustomExpr: `trigger.payload.body.ready == true`, WebhookFilters: []AuthoringWebhookFilter{
			{Source: "body", Path: "label", Operator: "equals", Value: &Literal{StringValue: authoringPtr("false")}},
			{Source: "body", Path: "count", Operator: "equals", Value: &Literal{NumberValue: authoringPtr(42.0)}},
			{Source: "body", Path: "ready", Operator: "equals", Value: &Literal{BooleanValue: authoringPtr(false)}},
			{Source: "body", Path: "optional", Operator: "equals", Value: &Literal{NullValue: authoringPtr(true)}},
		}},
	}
	for _, trigger := range cases {
		t.Run(trigger.Mode+"/"+trigger.ScheduleSubmode+trigger.ScheduleIntervalUnit, func(t *testing.T) {
			trigger.GraceMs, trigger.CooldownMs = 500, 1000
			raw, err := CompileAuthoring(NodeTrigger, AuthoringConfig{Trigger: &trigger})
			if err != nil {
				t.Fatal(err)
			}
			restored, err := InterpretAuthoring(NodeTrigger, raw)
			if err != nil {
				t.Fatal(err)
			}
			if restored.Trigger.Mode != trigger.Mode {
				t.Fatalf("control became %s: %s", restored.Trigger.Mode, raw)
			}
			again, err := CompileAuthoring(NodeTrigger, restored)
			if err != nil || raw != again {
				t.Fatalf("changed trigger: %s -> %s (%v)", raw, again, err)
			}
		})
	}
}

func TestAuthoringRejectsInvalidControls(t *testing.T) {
	cases := []struct {
		kind   NodeType
		config AuthoringConfig
	}{
		{NodeCondition, AuthoringConfig{Condition: &AuthoringCondition{Mode: "weekday", Weekdays: []string{"mondayish"}}}},
		{NodeCondition, AuthoringConfig{Condition: &AuthoringCondition{Mode: "time_window", AfterHour: authoringPtr(24)}}},
		{NodeTrigger, AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "schedule", ScheduleSubmode: "every", ScheduleIntervalValue: -1, ScheduleIntervalUnit: "minutes"}}},
		{NodeTrigger, AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "schedule", ScheduleSubmode: "at", ScheduleHour: 25}}},
		{NodeTrigger, AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "device_state", DeviceID: "sensor", Property: "occupancy", Comparator: "===", Value: &Literal{BooleanValue: authoringPtr(true)}}}},
	}
	for _, tc := range cases {
		if _, err := CompileAuthoring(tc.kind, tc.config); err == nil {
			t.Fatalf("invalid controls accepted: %+v", tc.config)
		}
	}
}
