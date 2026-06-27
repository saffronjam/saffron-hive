package store

import (
	"encoding/json"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// optionalText maps an empty string to NULL for a nullable TEXT column.
func optionalText(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// textValue maps a nullable TEXT column to a string ("" when NULL).
func textValue(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

// marshalExpression encodes a scene action's target expression for the
// nullable scene_actions.expression column. An empty expression is stored as
// NULL (the action is a direct target).
func marshalExpression(expr []device.Clause) (*string, error) {
	if len(expr) == 0 {
		return nil, nil
	}
	b, err := json.Marshal(expr)
	if err != nil {
		return nil, fmt.Errorf("marshal scene action expression: %w", err)
	}
	s := string(b)
	return &s, nil
}

// unmarshalExpression decodes the nullable scene_actions.expression column.
// NULL or invalid JSON yields no expression.
func unmarshalExpression(raw *string) []device.Clause {
	if raw == nil || *raw == "" {
		return nil
	}
	var out []device.Clause
	if err := json.Unmarshal([]byte(*raw), &out); err != nil {
		return nil
	}
	return out
}

// userRefFromPtrs assembles a *UserRef from three nullable columns returned by
// a LEFT JOIN onto users. Returns nil when the creator id is NULL — which is the
// case for rows created before the users table existed, or whose creator has
// been deleted (ON DELETE SET NULL).
func userRefFromPtrs(id, username, name *string) *UserRef {
	if id == nil {
		return nil
	}
	ref := &UserRef{ID: *id}
	if username != nil {
		ref.Username = *username
	}
	if name != nil {
		ref.Name = *name
	}
	return ref
}

// marshalCapabilities serializes a capability slice to JSON for storage.
// A nil or empty slice is stored as "[]" so the column never holds NULL.
func marshalCapabilities(caps []device.Capability) (string, error) {
	if len(caps) == 0 {
		return "[]", nil
	}
	b, err := json.Marshal(caps)
	if err != nil {
		return "", fmt.Errorf("marshal capabilities: %w", err)
	}
	return string(b), nil
}

// unmarshalCapabilities parses the devices.capabilities JSON blob. Accepts
// both the current [{Name: ...}] shape and the legacy ["name", "name"] shape
// so rows written before migration 006 keep decoding correctly.
func unmarshalCapabilities(capsJSON string) []device.Capability {
	if capsJSON == "" || capsJSON == "[]" {
		return nil
	}
	var caps []device.Capability
	if err := json.Unmarshal([]byte(capsJSON), &caps); err == nil {
		return caps
	}
	var legacy []string
	if err := json.Unmarshal([]byte(capsJSON), &legacy); err == nil {
		caps = make([]device.Capability, len(legacy))
		for i, name := range legacy {
			caps[i] = device.Capability{Name: name}
		}
		return caps
	}
	return nil
}

// MarshalCommand serializes a Command to JSON for storage.
func MarshalCommand(cmd device.Command) (string, error) {
	b, err := json.Marshal(cmd)
	if err != nil {
		return "", fmt.Errorf("marshal command: %w", err)
	}
	return string(b), nil
}

// UnmarshalCommand deserializes a Command from JSON.
func UnmarshalCommand(data string) (device.Command, error) {
	var cmd device.Command
	if err := json.Unmarshal([]byte(data), &cmd); err != nil {
		return device.Command{}, fmt.Errorf("unmarshal command: %w", err)
	}
	return cmd, nil
}

func boolToNullInt64(b *bool) *int64 {
	if b == nil {
		return nil
	}
	var v int64
	if *b {
		v = 1
	}
	return &v
}

func nullInt64ToBool(v *int64) *bool {
	if v == nil {
		return nil
	}
	b := *v != 0
	return &b
}

func intPtrToNullInt64(v *int) *int64 {
	if v == nil {
		return nil
	}
	x := int64(*v)
	return &x
}

func nullInt64ToIntPtr(v *int64) *int {
	if v == nil {
		return nil
	}
	x := int(*v)
	return &x
}
