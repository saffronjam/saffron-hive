package device

import (
	"context"
	"fmt"
	"slices"
)

// ClauseSubject names what a target-expression clause matches against.
type ClauseSubject string

const (
	SubjectRoom       ClauseSubject = "room"
	SubjectGroup      ClauseSubject = "group"
	SubjectDevice     ClauseSubject = "device"
	SubjectDeviceType ClauseSubject = "device_type"
	SubjectDeviceRole ClauseSubject = "device_role"
)

// ClauseOp names how a clause's values are matched. "is"/"is_one_of" include
// the matching devices; "is_not"/"is_not_one_of" exclude them. The singular vs
// plural variants are a UI affordance only — both evaluate as set membership.
type ClauseOp string

const (
	OpIs         ClauseOp = "is"
	OpIsOneOf    ClauseOp = "is_one_of"
	OpIsNot      ClauseOp = "is_not"
	OpIsNotOneOf ClauseOp = "is_not_one_of"
)

// Connector joins a clause to the running result. The first clause has no
// connector; subsequent clauses fold left-to-right (no precedence, no
// parentheses).
type Connector string

const (
	ConnectorAnd Connector = "and"
	ConnectorOr  Connector = "or"
)

// Clause is one rule in a target expression.
type Clause struct {
	Connector Connector     `json:"connector,omitempty"`
	Subject   ClauseSubject `json:"subject"`
	Op        ClauseOp      `json:"op"`
	Values    []string      `json:"values"`
}

// Expression is an ordered list of clauses resolving to a device set, evaluated
// left-to-right: result = clause[0], then for each later clause result =
// result AND/OR clause depending on its connector.
type Expression []Clause

// deviceRoles returns the logical roles a device fills: its physical type plus
// any roles its tags promote it into (a LIGHT-tagged plug is also a light).
func deviceRoles(d Device) map[string]struct{} {
	roles := map[string]struct{}{string(d.Type): {}}
	for _, t := range d.Tags {
		if v, ok := tagRoles[t]; ok {
			roles[v] = struct{}{}
		}
	}
	return roles
}

var tagRoles = map[DeviceTag]string{
	DeviceTagLight: string(Light),
}

var selectableKinds = map[string]struct{}{
	string(Light):   {},
	string(Sensor):  {},
	string(Button):  {},
	string(Plug):    {},
	string(Climate): {},
	string(Speaker): {},
}

// EvaluateExpression resolves a target expression to a sorted device-ID set.
// room/group/device clauses resolve through the TargetResolver; device_type and
// device_role clauses match against the in-memory device list. An empty
// expression matches nothing.
func EvaluateExpression(ctx context.Context, reader StateReader, resolver TargetResolver, expr Expression) []DeviceID {
	if len(expr) == 0 {
		return nil
	}
	universe := reader.ListDevices()
	var acc map[DeviceID]struct{}
	for i, c := range expr {
		set := clauseSet(ctx, resolver, universe, c)
		if i == 0 {
			acc = set
			continue
		}
		if c.Connector == ConnectorOr {
			for id := range set {
				acc[id] = struct{}{}
			}
		} else {
			for id := range acc {
				if _, ok := set[id]; !ok {
					delete(acc, id)
				}
			}
		}
	}
	out := make([]DeviceID, 0, len(acc))
	for id := range acc {
		out = append(out, id)
	}
	slices.Sort(out)
	return out
}

func clauseSet(ctx context.Context, resolver TargetResolver, universe []Device, c Clause) map[DeviceID]struct{} {
	include := map[DeviceID]struct{}{}
	switch c.Subject {
	case SubjectRoom, SubjectGroup, SubjectDevice:
		tt := map[ClauseSubject]TargetType{
			SubjectRoom:   TargetRoom,
			SubjectGroup:  TargetGroup,
			SubjectDevice: TargetDevice,
		}[c.Subject]
		for _, v := range c.Values {
			for _, id := range resolver.ResolveTargetDeviceIDs(ctx, tt, v) {
				include[id] = struct{}{}
			}
		}
	case SubjectDeviceType:
		want := toSet(c.Values)
		for _, d := range universe {
			if _, ok := want[string(d.Type)]; ok {
				include[d.ID] = struct{}{}
			}
		}
	case SubjectDeviceRole:
		want := toSet(c.Values)
		for _, d := range universe {
			for role := range deviceRoles(d) {
				if _, ok := want[role]; ok {
					include[d.ID] = struct{}{}
					break
				}
			}
		}
	}

	if c.Op == OpIsNot || c.Op == OpIsNotOneOf {
		excluded := map[DeviceID]struct{}{}
		for _, d := range universe {
			if _, ok := include[d.ID]; !ok {
				excluded[d.ID] = struct{}{}
			}
		}
		return excluded
	}
	return include
}

func toSet(values []string) map[string]struct{} {
	out := make(map[string]struct{}, len(values))
	for _, v := range values {
		out[v] = struct{}{}
	}
	return out
}

// ValidateExpression checks an expression is well-formed: known subjects/ops,
// non-empty values, a connector on every clause after the first, and valid
// kind identifiers for device_type / device_role clauses.
func ValidateExpression(expr Expression) error {
	for i, c := range expr {
		switch c.Subject {
		case SubjectRoom, SubjectGroup, SubjectDevice, SubjectDeviceType, SubjectDeviceRole:
		default:
			return fmt.Errorf("clause %d: unknown subject %q", i, c.Subject)
		}
		switch c.Op {
		case OpIs, OpIsOneOf, OpIsNot, OpIsNotOneOf:
		default:
			return fmt.Errorf("clause %d: unknown op %q", i, c.Op)
		}
		if len(c.Values) == 0 {
			return fmt.Errorf("clause %d: no values", i)
		}
		if i == 0 {
			if c.Connector != "" {
				return fmt.Errorf("clause 0: first clause must not have a connector")
			}
		} else if c.Connector != ConnectorAnd && c.Connector != ConnectorOr {
			return fmt.Errorf("clause %d: connector must be %q or %q", i, ConnectorAnd, ConnectorOr)
		}
		if c.Subject == SubjectDeviceType || c.Subject == SubjectDeviceRole {
			for _, v := range c.Values {
				if _, ok := selectableKinds[v]; !ok {
					return fmt.Errorf("clause %d: unknown device kind %q", i, v)
				}
			}
		}
	}
	return nil
}
