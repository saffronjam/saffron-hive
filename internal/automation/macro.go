package automation

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// DefinitionKind names what a macro stands in for.
type DefinitionKind string

const (
	DefinitionCondition DefinitionKind = "condition"
	DefinitionTarget    DefinitionKind = "target"
	DefinitionAction    DefinitionKind = "action"
)

// Definition is one named macro of an automation.
//
//   - condition: Expr is a condition expression. A condition node uses it
//     with {"use": name}, optionally {"negate": true}.
//   - target: TargetExpr is a device selector. An action uses it with
//     target_type "macro" and target_id name; an expression uses it as the
//     target argument {"macro": name}.
//   - action: Action is an action node config whose payload is a JSON object
//     rather than an encoded string. String values "$1".."$n" are parameters,
//     n being Params. An action node uses it with {"use": name, "args": [...]}.
type Definition struct {
	Kind       DefinitionKind    `json:"kind"`
	Expr       string            `json:"expr,omitempty"`
	TargetExpr device.Expression `json:"target_expr,omitempty"`
	Action     json.RawMessage   `json:"action,omitempty"`
	Params     int               `json:"params,omitempty"`
}

// Definitions are an automation's macros keyed by name.
type Definitions map[string]Definition

var (
	definitionName  = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)
	targetMacroRef  = regexp.MustCompile(`\{\s*"macro"\s*:\s*"([A-Za-z_][A-Za-z0-9_]*)"\s*\}`)
	parameterString = regexp.MustCompile(`^\$([1-9][0-9]*)$`)
)

// ParseDefinitions decodes stored definitions. Empty input has none.
func ParseDefinitions(raw string) (Definitions, error) {
	if strings.TrimSpace(raw) == "" {
		return Definitions{}, nil
	}
	var defs Definitions
	if err := json.Unmarshal([]byte(raw), &defs); err != nil {
		return nil, fmt.Errorf("invalid definitions: %w", err)
	}
	if defs == nil {
		defs = Definitions{}
	}
	return defs, nil
}

// Validate checks every definition on its own: names, kinds, expressions and
// action bodies.
func (d Definitions) Validate() error {
	for name, def := range d {
		if !definitionName.MatchString(name) {
			return fmt.Errorf("definition %q: name must be letters, digits and underscores", name)
		}
		switch def.Kind {
		case DefinitionCondition:
			expression, err := d.expandExpr(def.Expr)
			if err != nil {
				return fmt.Errorf("definition %q: %w", name, err)
			}
			if err := ValidateExpression(expression); err != nil {
				return fmt.Errorf("definition %q: invalid condition expression: %w", name, err)
			}
		case DefinitionTarget:
			if len(def.TargetExpr) == 0 {
				return fmt.Errorf("definition %q: target needs at least one clause", name)
			}
		case DefinitionAction:
			args := make([]json.RawMessage, def.Params)
			for i := range args {
				args[i] = json.RawMessage(`0`)
			}
			if _, err := d.expandAction(def, args); err != nil {
				return fmt.Errorf("definition %q: %w", name, err)
			}
		default:
			return fmt.Errorf("definition %q: unknown kind %q", name, def.Kind)
		}
	}
	return nil
}

func (d Definitions) lookup(name string, kind DefinitionKind) (Definition, error) {
	def, ok := d[name]
	if !ok {
		return Definition{}, fmt.Errorf("unknown macro %q", name)
	}
	if def.Kind != kind {
		return Definition{}, fmt.Errorf("macro %q is a %s, not a %s", name, def.Kind, kind)
	}
	return def, nil
}

// ExpandNodeConfig returns a stored node config with its macro references
// replaced by their definitions, in the shape the engine reads.
func (d Definitions) ExpandNodeConfig(nodeType NodeType, config string) (string, error) {
	switch nodeType {
	case NodeTrigger:
		return d.expandConfigExpr(config, "filter_expr")
	case NodeCondition:
		var use struct {
			Use    string `json:"use"`
			Negate bool   `json:"negate"`
		}
		if err := json.Unmarshal([]byte(config), &use); err == nil && use.Use != "" {
			def, err := d.lookup(use.Use, DefinitionCondition)
			if err != nil {
				return "", err
			}
			expression := def.Expr
			if use.Negate {
				expression = "!(" + expression + ")"
			}
			raw, _ := json.Marshal(map[string]string{"expr": expression})
			config = string(raw)
		}
		return d.expandConfigExpr(config, "expr")
	case NodeAction:
		var fields map[string]json.RawMessage
		if err := json.Unmarshal([]byte(config), &fields); err != nil {
			return config, nil
		}
		if _, ok := fields["use"]; ok {
			var use struct {
				Use  string            `json:"use"`
				Args []json.RawMessage `json:"args"`
			}
			if err := json.Unmarshal([]byte(config), &use); err != nil {
				return "", fmt.Errorf("invalid macro call: %w", err)
			}
			def, err := d.lookup(use.Use, DefinitionAction)
			if err != nil {
				return "", err
			}
			if len(use.Args) != def.Params {
				return "", fmt.Errorf("macro %q takes %d arguments, got %d", use.Use, def.Params, len(use.Args))
			}
			expanded, err := d.expandAction(def, use.Args)
			if err != nil {
				return "", fmt.Errorf("macro %q: %w", use.Use, err)
			}
			return expanded, nil
		}
		return d.expandActionTarget(fields)
	default:
		return config, nil
	}
}

// expandAction substitutes the arguments into an action macro and returns it
// as a node config.
func (d Definitions) expandAction(def Definition, args []json.RawMessage) (string, error) {
	var body any
	if err := json.Unmarshal(def.Action, &body); err != nil {
		return "", fmt.Errorf("invalid action body: %w", err)
	}
	substituted, err := substituteArgs(body, args)
	if err != nil {
		return "", err
	}
	fields, ok := substituted.(map[string]any)
	if !ok {
		return "", fmt.Errorf("action body must be an object")
	}
	if _, nested := fields["use"]; nested {
		return "", fmt.Errorf("an action macro cannot call another action macro")
	}
	if payload, ok := fields["payload"]; ok {
		if _, isString := payload.(string); !isString {
			encoded, err := json.Marshal(payload)
			if err != nil {
				return "", err
			}
			fields["payload"] = string(encoded)
		}
	}
	raw, err := json.Marshal(fields)
	if err != nil {
		return "", err
	}
	var rawFields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &rawFields); err != nil {
		return "", err
	}
	return d.expandActionTarget(rawFields)
}

// expandActionTarget replaces a target_type "macro" reference with the
// macro's selector.
func (d Definitions) expandActionTarget(fields map[string]json.RawMessage) (string, error) {
	var targetType, targetID string
	_ = json.Unmarshal(fields["target_type"], &targetType)
	if targetType == "macro" {
		_ = json.Unmarshal(fields["target_id"], &targetID)
		def, err := d.lookup(targetID, DefinitionTarget)
		if err != nil {
			return "", err
		}
		clauses, err := json.Marshal(normalizedClauses(def.TargetExpr))
		if err != nil {
			return "", err
		}
		fields["target_type"] = json.RawMessage(`"expression"`)
		fields["target_id"] = json.RawMessage(`""`)
		fields["target_expr"] = clauses
	}
	raw, err := json.Marshal(fields)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

// expandConfigExpr expands target macro references in one expression field
// of a config.
func (d Definitions) expandConfigExpr(config, field string) (string, error) {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal([]byte(config), &fields); err != nil {
		return config, nil
	}
	var expression string
	if err := json.Unmarshal(fields[field], &expression); err != nil || expression == "" {
		return config, nil
	}
	expanded, err := d.expandExpr(expression)
	if err != nil {
		return "", err
	}
	if expanded == expression {
		return config, nil
	}
	encoded, _ := json.Marshal(expanded)
	fields[field] = encoded
	raw, err := json.Marshal(fields)
	if err != nil {
		return "", err
	}
	return string(raw), nil
}

// expandExpr replaces each {"macro": name} target argument with the macro's
// {"where": [...]} selector.
func (d Definitions) expandExpr(expression string) (string, error) {
	var failure error
	expanded := targetMacroRef.ReplaceAllStringFunc(expression, func(match string) string {
		name := targetMacroRef.FindStringSubmatch(match)[1]
		def, err := d.lookup(name, DefinitionTarget)
		if err != nil {
			failure = err
			return match
		}
		raw, err := json.Marshal(map[string]any{"where": normalizedClauses(def.TargetExpr)})
		if err != nil {
			failure = err
			return match
		}
		return string(raw)
	})
	return expanded, failure
}

// normalizedClauses gives every clause a non-null values list, so the JSON is
// also a valid expression literal.
func normalizedClauses(clauses device.Expression) device.Expression {
	out := make(device.Expression, len(clauses))
	for i, clause := range clauses {
		if clause.Values == nil {
			clause.Values = []string{}
		}
		out[i] = clause
	}
	return out
}

func substituteArgs(value any, args []json.RawMessage) (any, error) {
	switch v := value.(type) {
	case string:
		match := parameterString.FindStringSubmatch(v)
		if match == nil {
			return v, nil
		}
		index, _ := strconv.Atoi(match[1])
		if index > len(args) {
			return nil, fmt.Errorf("parameter %s has no argument", v)
		}
		var arg any
		if err := json.Unmarshal(args[index-1], &arg); err != nil {
			return nil, fmt.Errorf("argument %d: %w", index, err)
		}
		return arg, nil
	case map[string]any:
		for key, item := range v {
			substituted, err := substituteArgs(item, args)
			if err != nil {
				return nil, err
			}
			v[key] = substituted
		}
		return v, nil
	case []any:
		for i, item := range v {
			substituted, err := substituteArgs(item, args)
			if err != nil {
				return nil, err
			}
			v[i] = substituted
		}
		return v, nil
	default:
		return v, nil
	}
}
