package automation

import (
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"

	"github.com/expr-lang/expr/ast"
	"github.com/expr-lang/expr/parser"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

// Literal preserves the distinction between a string, number, boolean and null.
type Literal struct {
	StringValue  *string  `json:"stringValue,omitempty"`
	NumberValue  *float64 `json:"numberValue,omitempty"`
	BooleanValue *bool    `json:"booleanValue,omitempty"`
	NullValue    *bool    `json:"nullValue,omitempty"`
}

func (v Literal) JSON() (json.RawMessage, error) {
	count := 0
	var raw []byte
	if v.StringValue != nil {
		count++
		raw, _ = json.Marshal(*v.StringValue)
	}
	if v.NumberValue != nil {
		count++
		if math.IsNaN(*v.NumberValue) || math.IsInf(*v.NumberValue, 0) {
			return nil, fmt.Errorf("number must be finite")
		}
		raw, _ = json.Marshal(*v.NumberValue)
	}
	if v.BooleanValue != nil {
		count++
		raw, _ = json.Marshal(*v.BooleanValue)
	}
	if v.NullValue != nil {
		count++
		if !*v.NullValue {
			return nil, fmt.Errorf("nullValue must be true")
		}
		raw = []byte("null")
	}
	if count != 1 {
		return nil, fmt.Errorf("provide exactly one literal value")
	}
	return raw, nil
}

func literalFromJSON(raw json.RawMessage) (*Literal, error) {
	v := &Literal{}
	switch {
	case string(raw) == "null":
		yes := true
		v.NullValue = &yes
	case len(raw) > 0 && raw[0] == '"':
		var s string
		if err := json.Unmarshal(raw, &s); err != nil {
			return nil, err
		}
		v.StringValue = &s
	case string(raw) == "true" || string(raw) == "false":
		b := string(raw) == "true"
		v.BooleanValue = &b
	default:
		var n float64
		if err := json.Unmarshal(raw, &n); err != nil {
			return nil, err
		}
		v.NumberValue = &n
	}
	return v, nil
}

func (v Literal) expression() (string, error) {
	b, err := v.JSON()
	if string(b) == "null" {
		return "nil", err
	}
	return string(b), err
}

// AuthoringConfig is the editable configuration of exactly one node variant.
type AuthoringConfig struct {
	Trigger   *AuthoringTrigger   `json:"trigger,omitempty"`
	Condition *AuthoringCondition `json:"condition,omitempty"`
	Operator  *AuthoringOperator  `json:"operator,omitempty"`
	Action    *AuthoringAction    `json:"action,omitempty"`
	Macro     *AuthoringMacro     `json:"macro,omitempty"`
}

type AuthoringTrigger struct {
	Mode                  string                   `json:"mode"`
	DeviceID              string                   `json:"deviceId,omitempty"`
	Property              string                   `json:"property,omitempty"`
	Comparator            string                   `json:"comparator,omitempty"`
	Value                 *Literal                 `json:"value,omitempty"`
	EventValue            string                   `json:"eventValue,omitempty"`
	EventType             string                   `json:"eventType,omitempty"`
	CustomExpr            string                   `json:"customExpr,omitempty"`
	EndpointID            string                   `json:"endpointId,omitempty"`
	WebhookFilters        []AuthoringWebhookFilter `json:"webhookFilters,omitempty"`
	ScheduleSubmode       string                   `json:"scheduleSubmode,omitempty"`
	CronExpr              string                   `json:"cronExpr,omitempty"`
	ScheduleHour          int                      `json:"scheduleHour,omitempty"`
	ScheduleMinute        int                      `json:"scheduleMinute,omitempty"`
	ScheduleSecond        int                      `json:"scheduleSecond,omitempty"`
	ScheduleWeekdays      []string                 `json:"scheduleWeekdays,omitempty"`
	ScheduleIntervalValue int                      `json:"scheduleIntervalValue,omitempty"`
	ScheduleIntervalUnit  string                   `json:"scheduleIntervalUnit,omitempty"`
	GraceMs               int64                    `json:"graceMs,omitempty"`
	CooldownMs            int64                    `json:"cooldownMs,omitempty"`
	HoldMs                int64                    `json:"holdMs,omitempty"`
}

type AuthoringWebhookFilter struct {
	Source   string   `json:"source"`
	Path     string   `json:"path"`
	Operator string   `json:"operator"`
	Value    *Literal `json:"value,omitempty"`
}

type AuthoringCondition struct {
	Negate       bool     `json:"negate,omitempty"`
	Mode         string   `json:"mode"`
	AfterHour    *int     `json:"afterHour,omitempty"`
	AfterMinute  *int     `json:"afterMinute,omitempty"`
	BeforeHour   *int     `json:"beforeHour,omitempty"`
	BeforeMinute *int     `json:"beforeMinute,omitempty"`
	Weekdays     []string `json:"weekdays,omitempty"`
	TargetType   string   `json:"targetType,omitempty"`
	TargetID     string   `json:"targetId,omitempty"`
	Property     string   `json:"property,omitempty"`
	Comparator   string   `json:"comparator,omitempty"`
	Value        *Literal `json:"value,omitempty"`
	CustomExpr   string   `json:"customExpr,omitempty"`
}

type AuthoringOperator struct {
	Kind string `json:"kind"`
}

type AuthoringMacro struct {
	Name      string            `json:"name"`
	Negate    bool              `json:"negate,omitempty"`
	Arguments []json.RawMessage `json:"arguments,omitempty"`
}

type AuthoringAction struct {
	ActionType string                  `json:"actionType"`
	TargetType string                  `json:"targetType,omitempty"`
	TargetID   string                  `json:"targetId,omitempty"`
	TargetExpr []device.Clause         `json:"targetExpr,omitempty"`
	Payload    *AuthoringActionPayload `json:"payload,omitempty"`
}

// AuthoringActionPayload contains the fields accepted by Hive's action executors.
type AuthoringActionPayload struct {
	On                *bool                   `json:"on,omitempty"`
	Brightness        *int                    `json:"brightness,omitempty"`
	ColorTemp         *int                    `json:"colorTemp,omitempty"`
	Color             *device.Color           `json:"color,omitempty"`
	Transition        *float64                `json:"transition,omitempty"`
	TargetTemperature *float64                `json:"targetTemperature,omitempty"`
	HvacMode          *string                 `json:"hvacMode,omitempty"`
	FanMode           *string                 `json:"fanMode,omitempty"`
	Swing             *string                 `json:"swing,omitempty"`
	SceneID           *string                 `json:"sceneId,omitempty"`
	Scenes            []string                `json:"scenes,omitempty"`
	EffectID          *string                 `json:"effectId,omitempty"`
	NativeName        *string                 `json:"nativeName,omitempty"`
	Field             *string                 `json:"field,omitempty"`
	Delta             *float64                `json:"delta,omitempty"`
	Mode              *string                 `json:"mode,omitempty"`
	Settings          []device.AttributeValue `json:"settings,omitempty"`
	AlarmID           *string                 `json:"alarmId,omitempty"`
	Severity          *string                 `json:"severity,omitempty"`
	Kind              *string                 `json:"kind,omitempty"`
	Message           *string                 `json:"message,omitempty"`
}

var authoringField = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)

func compareExpr(field, comparator string, value *Literal) (string, error) {
	if comparator == "" {
		comparator = "=="
	}
	switch comparator {
	case "==", "!=", "<", "<=", ">", ">=":
	default:
		return "", fmt.Errorf("unknown comparator %q", comparator)
	}
	if value == nil {
		return "", fmt.Errorf("comparison value is required")
	}
	literal, err := value.expression()
	if err != nil {
		return "", err
	}
	return field + " " + comparator + " " + literal, nil
}
func quoted(v string) string { b, _ := json.Marshal(v); return string(b) }

// CompileAuthoring constructs the persisted configuration from typed editor input.
func CompileAuthoring(kind NodeType, c AuthoringConfig) (string, error) {
	count := 0
	for _, present := range []bool{c.Trigger != nil, c.Condition != nil, c.Operator != nil, c.Action != nil, c.Macro != nil} {
		if present {
			count++
		}
	}
	if count != 1 {
		return "", fmt.Errorf("provide exactly one node configuration")
	}
	if (c.Trigger != nil && kind != NodeTrigger) || (c.Condition != nil && kind != NodeCondition) || (c.Action != nil && kind != NodeAction) || (c.Operator != nil && kind != NodeOperator) {
		return "", fmt.Errorf("configuration does not match node type %q", kind)
	}
	if incompleteAuthoring(c) {
		raw, err := json.Marshal(struct {
			Draft AuthoringConfig `json:"draft"`
		}{c})
		return string(raw), err
	}
	var raw []byte
	var err error
	switch {
	case c.Macro != nil:
		if kind != NodeCondition && kind != NodeAction {
			return "", fmt.Errorf("macros apply to conditions and actions")
		}
		raw, err = json.Marshal(struct {
			Use    string            `json:"use"`
			Negate bool              `json:"negate,omitempty"`
			Args   []json.RawMessage `json:"args,omitempty"`
		}{c.Macro.Name, c.Macro.Negate, c.Macro.Arguments})
	case kind == NodeTrigger && c.Trigger != nil:
		v, err := compileAuthoringTrigger(*c.Trigger)
		if err != nil {
			return "", err
		}
		raw, err = json.Marshal(v)
	case kind == NodeCondition && c.Condition != nil:
		expr, err := compileAuthoringCondition(*c.Condition)
		if err != nil {
			return "", err
		}
		raw, err = json.Marshal(struct {
			Expr   string `json:"expr"`
			Negate bool   `json:"negate,omitempty"`
		}{expr, c.Condition.Negate})
	case kind == NodeOperator && c.Operator != nil:
		switch strings.ToLower(c.Operator.Kind) {
		case "and", "or":
		default:
			return "", fmt.Errorf("unknown operator %q", c.Operator.Kind)
		}
		raw, err = json.Marshal(struct {
			Kind string `json:"kind"`
		}{strings.ToLower(c.Operator.Kind)})
	case kind == NodeAction && c.Action != nil:
		a := c.Action
		payload := ""
		if a.Payload != nil {
			b, err := encodeActionPayload(a.Payload)
			if err != nil {
				return "", err
			}
			payload = string(b)
		}
		raw, err = json.Marshal(struct {
			ActionType string          `json:"action_type"`
			TargetType string          `json:"target_type"`
			TargetID   string          `json:"target_id"`
			TargetExpr []device.Clause `json:"target_expr,omitempty"`
			Payload    string          `json:"payload"`
		}{a.ActionType, a.TargetType, a.TargetID, a.TargetExpr, payload})
	default:
		return "", fmt.Errorf("configuration does not match node type %q", kind)
	}
	return string(raw), err
}

type authoredTriggerWire struct {
	Kind           string               `json:"kind"`
	EventType      string               `json:"event_type,omitempty"`
	FilterExpr     string               `json:"filter_expr,omitempty"`
	CronExpr       string               `json:"cron_expr,omitempty"`
	GraceMs        int64                `json:"grace_ms,omitempty"`
	CooldownMs     int64                `json:"cooldown_ms,omitempty"`
	HoldMs         int64                `json:"hold_ms,omitempty"`
	DeviceID       string               `json:"device_id,omitempty"`
	EndpointID     string               `json:"endpoint_id,omitempty"`
	WebhookFilters []webhook.FilterRule `json:"webhook_filters,omitempty"`
}

func compileAuthoringTrigger(t AuthoringTrigger) (authoredTriggerWire, error) {
	w := authoredTriggerWire{Kind: "event", GraceMs: t.GraceMs, CooldownMs: t.CooldownMs, HoldMs: t.HoldMs}
	if err := ValidateTriggerTiming(t.GraceMs, t.CooldownMs); err != nil {
		return authoredTriggerWire{}, err
	}
	switch t.Mode {
	case "device_state":
		w.EventType = string(eventbus.EventDeviceStateChanged)
		if t.DeviceID == "" || t.Property == "" || t.Value == nil {
			w.FilterExpr = "true"
			break
		}
		if !authoringField.MatchString(t.Property) {
			return authoredTriggerWire{}, fmt.Errorf("invalid state property")
		}
		field := "trigger.payload.state." + t.Property
		cmp, err := compareExpr(field, t.Comparator, t.Value)
		if err != nil {
			return authoredTriggerWire{}, err
		}
		w.FilterExpr = "trigger.device_id == " + quoted(t.DeviceID) + " && " + field + " != nil && " + cmp
	case "device_event":
		w.EventType = string(eventbus.EventDeviceActionFired)
		w.FilterExpr = "trigger.device_id == " + quoted(t.DeviceID)
		if t.EventValue != "" {
			w.FilterExpr += " && trigger.payload.action == " + quoted(t.EventValue)
		}
	case "availability":
		w.EventType = string(eventbus.EventDeviceAvailabilityChanged)
		w.FilterExpr = "trigger.device_id == " + quoted(t.DeviceID)
	case "custom":
		w.EventType = t.EventType
		if w.EventType == "" {
			w.EventType = string(eventbus.EventDeviceStateChanged)
		}
		w.FilterExpr = t.CustomExpr
	case "webhook":
		w.EventType = string(eventbus.EventWebhookReceived)
		w.EndpointID = t.EndpointID
		w.FilterExpr = t.CustomExpr
		if w.FilterExpr == "" {
			w.FilterExpr = "true"
		}
		for _, f := range t.WebhookFilters {
			rule := webhook.FilterRule{Source: webhook.FilterSource(f.Source), Path: f.Path, Operator: webhook.FilterOperator(f.Operator)}
			if f.Value != nil {
				b, err := f.Value.JSON()
				if err != nil {
					return authoredTriggerWire{}, err
				}
				if err = json.Unmarshal(b, &rule.Value); err != nil {
					return authoredTriggerWire{}, err
				}
				switch {
				case f.Value.StringValue != nil:
					rule.ValueType = webhook.FilterString
				case f.Value.NumberValue != nil:
					rule.ValueType = webhook.FilterNumber
				case f.Value.BooleanValue != nil:
					rule.ValueType = webhook.FilterBoolean
				default:
					rule.ValueType = webhook.FilterNull
				}
			}
			w.WebhookFilters = append(w.WebhookFilters, rule)
		}
	case "schedule":
		w.Kind = "schedule"
		var err error
		w.CronExpr, err = authoringCron(t)
		if err != nil {
			return authoredTriggerWire{}, err
		}
	default:
		return authoredTriggerWire{}, fmt.Errorf("unknown trigger mode %q", t.Mode)
	}
	if t.HoldMs != 0 {
		w.DeviceID = t.DeviceID
		if err := ValidateTriggerHold(TriggerConfig{Kind: TriggerKind(w.Kind), EventType: w.EventType, HoldMs: t.HoldMs, HoldDeviceID: t.DeviceID}); err != nil {
			return authoredTriggerWire{}, err
		}
	}
	return w, nil
}

func authoringCron(t AuthoringTrigger) (string, error) {
	switch t.ScheduleSubmode {
	case "at":
		if t.ScheduleHour < 0 || t.ScheduleHour > 23 || t.ScheduleMinute < 0 || t.ScheduleMinute > 59 || t.ScheduleSecond < 0 || t.ScheduleSecond > 59 {
			return "", fmt.Errorf("invalid scheduled time")
		}
		days := "*"
		if len(t.ScheduleWeekdays) > 0 {
			for _, d := range t.ScheduleWeekdays {
				if !strings.Contains("|MON|TUE|WED|THU|FRI|SAT|SUN|", "|"+d+"|") {
					return "", fmt.Errorf("invalid weekday %q", d)
				}
			}
			days = strings.Join(t.ScheduleWeekdays, ",")
		}
		return fmt.Sprintf("%d %d %d * * %s", t.ScheduleSecond, t.ScheduleMinute, t.ScheduleHour, days), nil
	case "every":
		n := t.ScheduleIntervalValue
		if n <= 0 {
			return "", fmt.Errorf("schedule interval must be positive")
		}
		switch t.ScheduleIntervalUnit {
		case "seconds":
			if n <= 59 {
				return fmt.Sprintf("*/%d * * * * *", n), nil
			}
		case "minutes":
			if n <= 59 {
				return fmt.Sprintf("0 */%d * * * *", n), nil
			}
		case "hours":
			if n <= 23 {
				return fmt.Sprintf("0 0 */%d * * *", n), nil
			}
		}
		return "", fmt.Errorf("invalid schedule interval")
	case "custom", "":
		return t.CronExpr, nil
	default:
		return "", fmt.Errorf("unknown schedule mode")
	}
}

func compileAuthoringCondition(c AuthoringCondition) (string, error) {
	clock := func(h, m *int) (string, error) {
		hour, minute := 0, 0
		if h != nil {
			hour = *h
		}
		if m != nil {
			minute = *m
		}
		if hour < 0 || hour > 23 || minute < 0 || minute > 59 {
			return "", fmt.Errorf("invalid time")
		}
		return fmt.Sprintf("%02d:%02d", hour, minute), nil
	}
	switch c.Mode {
	case "time_window":
		after, err := clock(c.AfterHour, c.AfterMinute)
		if err != nil {
			return "", err
		}
		before, err := clock(c.BeforeHour, c.BeforeMinute)
		if err != nil {
			return "", err
		}
		if c.AfterHour != nil && c.BeforeHour != nil {
			return "time.between(" + quoted(after) + ", " + quoted(before) + ")", nil
		}
		if c.AfterHour != nil {
			return "time.after(" + quoted(after) + ")", nil
		}
		if c.BeforeHour != nil {
			return "time.before(" + quoted(before) + ")", nil
		}
		return "true", nil
	case "weekday":
		days := make([]string, 0, len(c.Weekdays))
		for _, d := range c.Weekdays {
			name := strings.ToLower(d)
			switch name {
			case "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday":
				name = name[:3]
			}
			if !strings.Contains("|mon|tue|wed|thu|fri|sat|sun|", "|"+name+"|") {
				return "", fmt.Errorf("invalid weekday")
			}
			days = append(days, quoted(name))
		}
		if len(days) == 0 {
			return "true", nil
		}
		return "day.in(" + strings.Join(days, ", ") + ")", nil
	case "device_state":
		if c.TargetID == "" || c.Property == "" || c.Value == nil {
			return "true", nil
		}
		if !authoringField.MatchString(c.Property) {
			return "", fmt.Errorf("invalid state property")
		}
		switch c.TargetType {
		case "device", "room", "group":
		default:
			return "", fmt.Errorf("invalid condition target type")
		}
		return compareExpr(c.TargetType+"("+quoted(c.TargetID)+")."+c.Property, c.Comparator, c.Value)
	case "custom":
		return c.CustomExpr, nil
	default:
		return "", fmt.Errorf("unknown condition mode %q", c.Mode)
	}
}

func expressionTree(expr string) ast.Node {
	tree, err := parser.Parse(expr)
	if err != nil {
		return nil
	}
	return tree.Node
}
func expressionSame(a, b string) bool {
	aa, bb := expressionTree(a), expressionTree(b)
	return aa != nil && bb != nil && aa.String() == bb.String()
}
func literalNode(n ast.Node) (*Literal, bool) {
	switch v := n.(type) {
	case *ast.StringNode:
		return &Literal{StringValue: &v.Value}, true
	case *ast.BoolNode:
		return &Literal{BooleanValue: &v.Value}, true
	case *ast.IntegerNode:
		f := float64(v.Value)
		return &Literal{NumberValue: &f}, true
	case *ast.FloatNode:
		return &Literal{NumberValue: &v.Value}, true
	case *ast.NilNode:
		b := true
		return &Literal{NullValue: &b}, true
	case *ast.UnaryNode:
		if v.Operator == "-" {
			lit, ok := literalNode(v.Node)
			if ok && lit.NumberValue != nil {
				*lit.NumberValue = -*lit.NumberValue
				return lit, true
			}
		}
	}
	return nil, false
}
func callParts(n ast.Node) (string, []ast.Node, bool) {
	c, ok := n.(*ast.CallNode)
	if !ok {
		return "", nil, false
	}
	return c.Callee.String(), c.Arguments, true
}
func stringNode(n ast.Node) (string, bool) {
	s, ok := n.(*ast.StringNode)
	if !ok {
		return "", false
	}
	return s.Value, true
}

// InterpretAuthoring returns standard controls only for recognized equivalent expressions.
func InterpretAuthoring(kind NodeType, raw string) (AuthoringConfig, error) {
	var draftConfig struct {
		Draft *AuthoringConfig `json:"draft"`
	}
	if err := json.Unmarshal([]byte(raw), &draftConfig); err != nil {
		return AuthoringConfig{}, err
	}
	if draftConfig.Draft != nil {
		return *draftConfig.Draft, nil
	}
	var macro struct {
		Use    string            `json:"use"`
		Negate bool              `json:"negate"`
		Args   []json.RawMessage `json:"args"`
	}
	if err := json.Unmarshal([]byte(raw), &macro); err != nil {
		return AuthoringConfig{}, err
	}
	if macro.Use != "" {
		return AuthoringConfig{Macro: &AuthoringMacro{Name: macro.Use, Negate: macro.Negate, Arguments: macro.Args}}, nil
	}
	var draft struct {
		Mode *string `json:"mode"`
	}
	_ = json.Unmarshal([]byte(raw), &draft)
	switch kind {
	case NodeTrigger:
		if draft.Mode != nil && *draft.Mode == "" {
			return AuthoringConfig{Trigger: &AuthoringTrigger{Mode: "unset"}}, nil
		}
		var w authoredTriggerWire
		if err := json.Unmarshal([]byte(raw), &w); err != nil {
			return AuthoringConfig{}, err
		}
		t := interpretTrigger(w)
		return AuthoringConfig{Trigger: &t}, nil
	case NodeCondition:
		if draft.Mode != nil && *draft.Mode == "" {
			return AuthoringConfig{Condition: &AuthoringCondition{Mode: "unset"}}, nil
		}
		var c struct {
			Expr   string `json:"expr"`
			Negate bool   `json:"negate"`
		}
		if err := json.Unmarshal([]byte(raw), &c); err != nil {
			return AuthoringConfig{}, err
		}
		v := interpretCondition(c.Expr)
		v.Negate = c.Negate
		return AuthoringConfig{Condition: &v}, nil
	case NodeOperator:
		var c AuthoringOperator
		if err := json.Unmarshal([]byte(raw), &c); err != nil {
			return AuthoringConfig{}, err
		}
		return AuthoringConfig{Operator: &c}, nil
	case NodeAction:
		var w struct {
			ActionType string          `json:"action_type"`
			TargetType string          `json:"target_type"`
			TargetID   string          `json:"target_id"`
			TargetExpr []device.Clause `json:"target_expr"`
			Payload    string          `json:"payload"`
		}
		if err := json.Unmarshal([]byte(raw), &w); err != nil {
			return AuthoringConfig{}, err
		}
		a := AuthoringAction{ActionType: w.ActionType, TargetType: w.TargetType, TargetID: w.TargetID, TargetExpr: w.TargetExpr}
		if w.Payload != "" && w.Payload != "null" {
			a.Payload = &AuthoringActionPayload{}
			if err := decodeActionPayload(w.Payload, a.Payload); err != nil {
				return AuthoringConfig{}, err
			}
		}
		return AuthoringConfig{Action: &a}, nil
	default:
		return AuthoringConfig{}, fmt.Errorf("unknown node type %q", kind)
	}
}

func interpretTrigger(w authoredTriggerWire) AuthoringTrigger {
	t := AuthoringTrigger{Mode: "custom", DeviceID: w.DeviceID, EventType: w.EventType, CustomExpr: w.FilterExpr, GraceMs: w.GraceMs, CooldownMs: w.CooldownMs, HoldMs: w.HoldMs}
	if w.Kind == "schedule" {
		t.Mode = "schedule"
		t.CustomExpr = ""
		t.ScheduleSubmode = "custom"
		t.CronExpr = w.CronExpr
		interpretCron(&t)
		return t
	}
	if w.EventType == string(eventbus.EventWebhookReceived) {
		t.Mode = "webhook"
		t.EndpointID = w.EndpointID
		for _, f := range w.WebhookFilters {
			a := AuthoringWebhookFilter{Source: string(f.Source), Path: f.Path, Operator: string(f.Operator)}
			if f.ValueType != "" {
				b, _ := json.Marshal(f.Value)
				a.Value, _ = literalFromJSON(b)
			}
			t.WebhookFilters = append(t.WebhookFilters, a)
		}
		return t
	}
	terms := flattenAnd(expressionTree(w.FilterExpr))
	var id string
	var comparison *ast.BinaryNode
	for _, term := range terms {
		b, ok := term.(*ast.BinaryNode)
		if !ok {
			continue
		}
		if b.Operator == "==" && b.Left.String() == "trigger.device_id" {
			id, _ = stringNode(b.Right)
			continue
		}
		if b.Left.String() != "trigger.device_id" {
			comparison = b
		}
	}
	if w.HoldMs > 0 && len(terms) == 1 {
		if b, ok := terms[0].(*ast.BinaryNode); ok {
			comparison = b
		}
	}
	if id != "" && len(terms) == 1 && (w.EventType == string(eventbus.EventDeviceAvailabilityChanged) || w.EventType == string(eventbus.EventDeviceActionFired)) {
		t.Mode = "availability"
		if w.EventType == string(eventbus.EventDeviceActionFired) {
			t.Mode = "device_event"
		}
		t.DeviceID = id
		t.CustomExpr = ""
		return t
	}
	if comparison == nil {
		return t
	}
	if id != "" && w.EventType == string(eventbus.EventDeviceActionFired) && comparison.Operator == "==" && comparison.Left.String() == "trigger.payload.action" && len(terms) == 2 {
		if value, ok := stringNode(comparison.Right); ok {
			t.Mode = "device_event"
			t.DeviceID = id
			t.EventValue = value
			t.CustomExpr = ""
		}
		return t
	}
	if w.EventType != string(eventbus.EventDeviceStateChanged) {
		return t
	}
	value, ok := literalNode(comparison.Right)
	if !ok || value.NullValue != nil || (value.BooleanValue != nil && comparison.Operator != "==") {
		return t
	}
	property := ""
	const prefix = "trigger.payload.state."
	if strings.HasPrefix(comparison.Left.String(), prefix) && id != "" {
		property = strings.TrimPrefix(comparison.Left.String(), prefix)
	}
	heldCurrent := false
	if w.HoldMs > 0 && w.DeviceID != "" && len(terms) == 1 {
		if member, ok := comparison.Left.(*ast.MemberNode); ok {
			name, args, call := callParts(member.Node)
			field, fieldOK := stringNode(member.Property)
			if call && name == "device" && len(args) == 1 && fieldOK {
				bound, boundOK := stringNode(args[0])
				if boundOK && bound == w.DeviceID {
					id = bound
					property = field
					heldCurrent = true
				}
			}
		}
	}
	if property == "" || !authoringField.MatchString(property) || (w.DeviceID != "" && w.DeviceID != id) {
		return t
	}
	candidate := t
	candidate.Mode = "device_state"
	candidate.DeviceID = id
	candidate.Property = property
	candidate.Comparator = comparison.Operator
	candidate.Value = value
	candidate.CustomExpr = ""
	compiled, err := compileAuthoringTrigger(candidate)
	if err != nil {
		return t
	}
	canonical := compiled.FilterExpr
	if expressionSame(w.FilterExpr, canonical) || (heldCurrent && comparison.Operator == "==" && value.NullValue == nil) {
		return candidate
	}
	if len(terms) == 2 && comparison.Operator == "==" && value.NullValue == nil {
		withoutGuard := "trigger.device_id == " + quoted(id) + " && " + comparison.String()
		if expressionSame(w.FilterExpr, withoutGuard) {
			return candidate
		}
	}
	return t
}
func flattenAnd(n ast.Node) []ast.Node {
	if n == nil {
		return nil
	}
	if b, ok := n.(*ast.BinaryNode); ok && (b.Operator == "&&" || b.Operator == "and") {
		return append(flattenAnd(b.Left), flattenAnd(b.Right)...)
	}
	return []ast.Node{n}
}

func interpretCron(t *AuthoringTrigger) {
	for i, cron := range []string{"* * * * * *", "0 * * * * *", "0 0 * * * *"} {
		if strings.Join(strings.Fields(t.CronExpr), " ") == cron {
			t.ScheduleSubmode = "every"
			t.ScheduleIntervalValue = 1
			t.ScheduleIntervalUnit = []string{"seconds", "minutes", "hours"}[i]
			return
		}
	}

	parts := strings.Fields(t.CronExpr)
	if len(parts) != 6 {
		return
	}
	if parts[3] == "*" && parts[4] == "*" {
		s, e1 := strconv.Atoi(parts[0])
		m, e2 := strconv.Atoi(parts[1])
		h, e3 := strconv.Atoi(parts[2])
		if e1 == nil && e2 == nil && e3 == nil {
			t.ScheduleSubmode = "at"
			t.ScheduleSecond = s
			t.ScheduleMinute = m
			t.ScheduleHour = h
			if parts[5] != "*" {
				t.ScheduleWeekdays = strings.Split(parts[5], ",")
			}
			if canonical, err := authoringCron(*t); err == nil && canonical == strings.Join(parts, " ") {
				return
			}
			t.ScheduleSubmode = "custom"
		}
	}
	for i, unit := range []string{"seconds", "minutes", "hours"} {
		if strings.HasPrefix(parts[i], "*/") {
			n, err := strconv.Atoi(parts[i][2:])
			if err == nil {
				t.ScheduleSubmode = "every"
				t.ScheduleIntervalValue = n
				t.ScheduleIntervalUnit = unit
				if canonical, err := authoringCron(*t); err == nil && canonical == strings.Join(parts, " ") {
					return
				}
				t.ScheduleSubmode = "custom"
			}
		}
	}
}

func interpretCondition(expr string) AuthoringCondition {
	c := AuthoringCondition{Mode: "custom", CustomExpr: expr}
	n := expressionTree(expr)
	if n == nil {
		return c
	}
	if name, args, ok := callParts(n); ok {
		clock := func(n ast.Node) (*int, *int, bool) {
			s, ok := stringNode(n)
			if !ok {
				return nil, nil, false
			}
			parts := strings.Split(s, ":")
			if len(parts) != 2 {
				return nil, nil, false
			}
			h, e1 := strconv.Atoi(parts[0])
			m, e2 := strconv.Atoi(parts[1])
			return &h, &m, e1 == nil && e2 == nil && h >= 0 && h <= 23 && m >= 0 && m <= 59
		}
		candidate := AuthoringCondition{Mode: "time_window"}
		switch {
		case name == "time.between" && len(args) == 2:
			var a, b bool
			candidate.AfterHour, candidate.AfterMinute, a = clock(args[0])
			candidate.BeforeHour, candidate.BeforeMinute, b = clock(args[1])
			if a && b {
				return candidate
			}
		case name == "time.after" && len(args) == 1:
			var ok bool
			candidate.AfterHour, candidate.AfterMinute, ok = clock(args[0])
			if ok {
				return candidate
			}
		case name == "time.before" && len(args) == 1:
			var ok bool
			candidate.BeforeHour, candidate.BeforeMinute, ok = clock(args[0])
			if ok {
				return candidate
			}
		case name == "day.in":
			candidate.Mode = "weekday"
			for _, arg := range args {
				v, ok := stringNode(arg)
				if !ok {
					return c
				}
				candidate.Weekdays = append(candidate.Weekdays, v)
			}
			if compiled, err := compileAuthoringCondition(candidate); err == nil && expressionSame(expr, compiled) {
				return candidate
			}
		}
	}
	if b, ok := n.(*ast.BinaryNode); ok {
		if member, ok := b.Left.(*ast.MemberNode); ok {
			name, args, call := callParts(member.Node)
			field, fieldOK := stringNode(member.Property)
			value, valueOK := literalNode(b.Right)
			if call && (name == "device" || name == "room" || name == "group") && len(args) == 1 && fieldOK && valueOK && value.NullValue == nil && (value.BooleanValue == nil || b.Operator == "==") {
				id, idOK := stringNode(args[0])
				if idOK {
					candidate := AuthoringCondition{Mode: "device_state", TargetType: name, TargetID: id, Property: field, Comparator: b.Operator, Value: value}
					if compiled, err := compileAuthoringCondition(candidate); err == nil && expressionSame(expr, compiled) {
						return candidate
					}
				}
			}
		}
	}
	return c
}

func incompleteAuthoring(c AuthoringConfig) bool {
	if t := c.Trigger; t != nil {
		switch t.Mode {
		case "", "unset":
			return true
		case "device_state":
			return t.DeviceID == "" || t.Property == "" || t.Value == nil
		case "device_event", "availability":
			return t.DeviceID == ""
		case "webhook":
			return t.EndpointID == ""
		case "schedule":
			return (t.ScheduleSubmode == "every" && t.ScheduleIntervalValue == 0) ||
				((t.ScheduleSubmode == "custom" || t.ScheduleSubmode == "") && strings.TrimSpace(t.CronExpr) == "")
		case "custom":
			return strings.TrimSpace(t.CustomExpr) == ""
		}
	}
	if v := c.Condition; v != nil {
		switch v.Mode {
		case "", "unset":
			return true
		case "time_window":
			return v.AfterHour == nil && v.BeforeHour == nil
		case "weekday":
			return len(v.Weekdays) == 0
		case "device_state":
			return v.TargetID == "" || v.Property == "" || v.Value == nil
		case "custom":
			return strings.TrimSpace(v.CustomExpr) == ""
		}
	}
	return false
}

var actionPayloadNames = map[string]string{"sceneId": "scene_id", "effectId": "effect_id", "nativeName": "native_name", "alarmId": "alarm_id"}

func encodeActionPayload(payload *AuthoringActionPayload) ([]byte, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		return nil, err
	}
	for authored, stored := range actionPayloadNames {
		if value, ok := fields[authored]; ok {
			fields[stored] = value
			delete(fields, authored)
		}
	}
	return json.Marshal(fields)
}

func decodeActionPayload(raw string, payload *AuthoringActionPayload) error {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal([]byte(raw), &fields); err != nil {
		return err
	}
	for authored, stored := range actionPayloadNames {
		if value, ok := fields[stored]; ok {
			fields[authored] = value
			delete(fields, stored)
		}
	}
	value, err := json.Marshal(fields)
	if err != nil {
		return err
	}
	decoder := json.NewDecoder(strings.NewReader(string(value)))
	decoder.DisallowUnknownFields()
	return decoder.Decode(payload)
}
