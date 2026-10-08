package automation

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const testDefinitions = `{
	"night": {"kind": "condition", "expr": "time.between(\"22:00\", \"06:00\")"},
	"bedroom_lights": {"kind": "target", "target_expr": [{"subject": "room", "op": "is", "values": ["bedroom"]}]},
	"dim": {"kind": "action", "params": 1, "action": {"action_type": "set_device_state", "target_type": "macro", "target_id": "bedroom_lights", "payload": {"on": true, "brightness": "$1"}}},
	"lights_on": {"kind": "condition", "expr": "any_of({\"macro\": \"bedroom_lights\"}, \"on\", true)"}
}`

func mustDefinitions(t *testing.T) Definitions {
	t.Helper()
	defs, err := ParseDefinitions(testDefinitions)
	if err != nil {
		t.Fatal(err)
	}
	if err := defs.Validate(); err != nil {
		t.Fatalf("validate: %v", err)
	}
	return defs
}

func TestExpandConditionMacro(t *testing.T) {
	defs := mustDefinitions(t)
	config, err := defs.ParseNodeConfig(NodeCondition, `{"use": "night", "negate": true}`)
	if err != nil {
		t.Fatal(err)
	}
	if got := config.(ConditionConfig).Expr; got != `!(time.between("22:00", "06:00"))` {
		t.Fatalf("expr = %q", got)
	}
}

func TestExpandTargetMacroInsideExpression(t *testing.T) {
	defs := mustDefinitions(t)
	config, err := defs.ParseNodeConfig(NodeCondition, `{"use": "lights_on"}`)
	if err != nil {
		t.Fatal(err)
	}
	expression := config.(ConditionConfig).Expr
	if !strings.Contains(expression, `{"where":[{"subject":"room","op":"is","values":["bedroom"]}]}`) {
		t.Fatalf("expr = %q", expression)
	}
	if err := ValidateExpression(expression); err != nil {
		t.Fatal(err)
	}
}

func TestExpandActionMacroSubstitutesArguments(t *testing.T) {
	defs := mustDefinitions(t)
	config, err := defs.ParseNodeConfig(NodeAction, `{"use": "dim", "args": [51]}`)
	if err != nil {
		t.Fatal(err)
	}
	action := config.(ActionConfig)
	if action.ActionType != ActionSetDeviceState || action.TargetType != TargetType(device.TargetExpression) {
		t.Fatalf("action = %+v", action)
	}
	if len(action.TargetExpr) != 1 || action.TargetExpr[0].Values[0] != "bedroom" {
		t.Fatalf("target = %+v", action.TargetExpr)
	}
	var payload map[string]any
	if err := json.Unmarshal([]byte(action.Payload), &payload); err != nil {
		t.Fatal(err)
	}
	if payload["brightness"] != float64(51) || payload["on"] != true {
		t.Fatalf("payload = %v", payload)
	}
}

func TestExpandMacroErrors(t *testing.T) {
	defs := mustDefinitions(t)
	cases := []struct {
		nodeType NodeType
		config   string
		want     string
	}{
		{NodeCondition, `{"use": "missing"}`, `unknown macro "missing"`},
		{NodeCondition, `{"use": "dim"}`, `is a action, not a condition`},
		{NodeAction, `{"use": "dim", "args": []}`, `takes 1 arguments, got 0`},
		{NodeAction, `{"action_type": "toggle_device_state", "target_type": "macro", "target_id": "night"}`, `not a target`},
		{NodeTrigger, `{"kind": "event", "filter_expr": "any_of({\"macro\": \"nope\"}, \"on\", true)"}`, `unknown macro "nope"`},
	}
	for _, tc := range cases {
		_, err := defs.ExpandNodeConfig(tc.nodeType, tc.config)
		if err == nil || !strings.Contains(err.Error(), tc.want) {
			t.Errorf("%s: error = %v, want %q", tc.config, err, tc.want)
		}
	}
}

func TestValidateDefinitions(t *testing.T) {
	cases := map[string]string{
		`{"bad name": {"kind": "condition", "expr": "true"}}`:            "name must be",
		`{"x": {"kind": "condition", "expr": "time.hour >"}}`:            "invalid condition expression",
		`{"x": {"kind": "target"}}`:                                      "at least one clause",
		`{"x": {"kind": "action", "params": 0, "action": {"use": "y"}}}`: "cannot call another",
		`{"x": {"kind": "action", "params": 0, "action": {"p": "$2"}}}`:  "parameter $2 has no argument",
		`{"x": {"kind": "loop"}}`:                                        "unknown kind",
	}
	for raw, want := range cases {
		defs, err := ParseDefinitions(raw)
		if err != nil {
			t.Fatal(err)
		}
		if err := defs.Validate(); err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("%s: error = %v, want %q", raw, err, want)
		}
	}
}

func TestNodesWithoutMacrosPassThrough(t *testing.T) {
	defs := Definitions{}
	config := `{"action_type":"toggle_device_state","target_type":"device","target_id":"lamp","payload":""}`
	expanded, err := defs.ExpandNodeConfig(NodeAction, config)
	if err != nil {
		t.Fatal(err)
	}
	var a, b map[string]any
	_ = json.Unmarshal([]byte(config), &a)
	_ = json.Unmarshal([]byte(expanded), &b)
	if len(a) != len(b) || a["target_id"] != b["target_id"] {
		t.Fatalf("expanded = %s", expanded)
	}
}
