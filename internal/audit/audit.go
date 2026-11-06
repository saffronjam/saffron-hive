// Package audit identifies native operations and describes persisted changes.
package audit

import (
	"context"
	"encoding/json"
	"net/url"
	"slices"
	"strings"
)

// Origin carries server-established attribution through asynchronous work.
type Origin struct {
	OperationID    string
	ActorID        string
	ActorName      string
	Source         string
	OwnerID        *string
	ConversationID *string
	RunID          *string
	ActionID       *string
	ParentID       *string
}
type originKey struct{}

func WithOrigin(ctx context.Context, origin Origin) context.Context {
	return context.WithValue(ctx, originKey{}, origin)
}
func FromContext(ctx context.Context) Origin { o, _ := ctx.Value(originKey{}).(Origin); return o }

// Change describes one field of a sanitized snapshot.
type Change struct {
	Path   string          `json:"path"`
	Before json.RawMessage `json:"before"`
	After  json.RawMessage `json:"after"`
}

// Diff compares object members deterministically; ordered arrays retain their order.
func Diff(before, after json.RawMessage) []Change {
	changes := []Change{}
	var walk func(string, json.RawMessage, json.RawMessage)
	walk = func(path string, a, b json.RawMessage) {
		a = decoded(a)
		b = decoded(b)
		if string(a) == string(b) {
			return
		}
		var x, y map[string]json.RawMessage
		if json.Unmarshal(a, &x) == nil && json.Unmarshal(b, &y) == nil && (x != nil || y != nil) {
			keys := map[string]bool{}
			for k := range x {
				keys[k] = true
			}
			for k := range y {
				keys[k] = true
			}
			ordered := make([]string, 0, len(keys))
			for k := range keys {
				ordered = append(ordered, k)
			}
			slices.Sort(ordered)
			for _, k := range ordered {
				walk(strings.TrimPrefix(path+"."+k, "."), value(x[k]), value(y[k]))
			}
			return
		}
		changes = append(changes, Change{path, value(a), value(b)})
	}
	walk("", value(before), value(after))
	return changes
}
func value(v json.RawMessage) json.RawMessage {
	if len(v) == 0 {
		return json.RawMessage("null")
	}
	return v
}

// Sanitize removes credential values before storing an operation proposal.
func Sanitize(raw json.RawMessage) json.RawMessage { return sanitize(raw, false) }

// SanitizeSnapshot preserves the credential-change markers produced by storage projections.
func SanitizeSnapshot(raw json.RawMessage) json.RawMessage { return sanitize(raw, true) }
func sanitize(raw json.RawMessage, markers bool) json.RawMessage {
	raw = decoded(raw)
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) == nil && object != nil {
		sensitiveValue := false
		for _, descriptor := range []string{"capability", "key", "name", "path"} {
			var name string
			if json.Unmarshal(object[descriptor], &name) == nil && secretName(name) {
				sensitiveValue = true
			}
		}
		for k, v := range object {
			if secretName(k) || (sensitiveValue && (k == "value" || k == "stringValue" || k == "numberValue" || k == "booleanValue")) {
				var marker string
				safe := markers && json.Unmarshal(v, &marker) == nil && (marker == "unset" || marker == "configured" || marker == "[changed]" || marker == "[redacted]")
				if !safe {
					object[k] = json.RawMessage(`"[redacted]"`)
				}
			} else {
				object[k] = sanitize(v, false)
			}
		}
		b, _ := json.Marshal(object)
		return b
	}
	var list []json.RawMessage
	if json.Unmarshal(raw, &list) == nil && list != nil {
		for i, v := range list {
			list[i] = Sanitize(v)
		}
		b, _ := json.Marshal(list)
		return b
	}
	var text string
	if json.Unmarshal(raw, &text) == nil && strings.Contains(text, "://") {
		if address, err := url.Parse(text); err == nil && address.Scheme != "" && address.Host != "" {
			changed := false
			if address.User != nil {
				if _, hasPassword := address.User.Password(); hasPassword {
					address.User = url.UserPassword(address.User.Username(), "[redacted]")
					changed = true
				}
			}
			query := address.Query()
			for key := range query {
				if secretName(key) {
					query.Set(key, "[redacted]")
					changed = true
				}
			}
			if changed {
				address.RawQuery = query.Encode()
				b, _ := json.Marshal(address.String())
				return b
			}
		}
	}
	return raw
}

func decoded(v json.RawMessage) json.RawMessage {
	var text string
	if json.Unmarshal(v, &text) == nil && len(text) > 0 && (text[0] == '{' || text[0] == '[') && json.Valid([]byte(text)) {
		return json.RawMessage(text)
	}
	return v
}

// EntityType identifies the configuration aggregate targeted by an operation.
func EntityType(field string) string {
	for _, entry := range []struct{ name, table string }{
		{"Zigbee2Mqtt", "zigbee2mqtt_config"}, {"Tuya", "tuya_config"}, {"Claude", "claude_config"}, {"Automation", "automations"}, {"Scene", "scenes"}, {"Effect", "effects"}, {"Room", "rooms"}, {"Group", "groups"}, {"Device", "devices"}, {"User", "users"}, {"Guest", "guests"}, {"Setting", "settings"}, {"WebhookEndpoint", "webhook_endpoints"}, {"Floorplan", "floorplans"},
	} {
		if strings.Contains(field, entry.name) {
			return entry.table
		}
	}
	return ""
}

// Proposal compares submitted fields with the saved configuration available at submission.
func Proposal(field string, request json.RawMessage, before json.RawMessage) json.RawMessage {
	configurationEdit := EntityType(field) != "" && (strings.HasPrefix(field, "create") || strings.HasPrefix(field, "update") || strings.HasPrefix(field, "save") || strings.HasPrefix(field, "delete") || strings.HasPrefix(field, "batch"))
	if !configurationEdit {
		b, _ := json.Marshal(struct {
			Request json.RawMessage `json:"request"`
			Changes []Change        `json:"changes"`
		}{request, []Change{}})
		return b
	}
	var args map[string]json.RawMessage
	_ = json.Unmarshal(request, &args)
	desired := args["input"]
	if len(desired) == 0 {
		desired = request
	}
	var previous, next map[string]json.RawMessage
	_ = json.Unmarshal(before, &previous)
	if previous == nil {
		previous = map[string]json.RawMessage{}
	}
	next = make(map[string]json.RawMessage, len(previous))
	for key, value := range previous {
		next[key] = value
	}
	var fields map[string]json.RawMessage
	_ = json.Unmarshal(desired, &fields)
	for key, value := range fields {
		if key != "expectedRevision" && key != "id" {
			next[key] = value
		}
	}
	after, _ := json.Marshal(next)
	if strings.HasPrefix(field, "delete") || strings.HasPrefix(field, "batchDelete") {
		after = json.RawMessage("null")
	}
	b, _ := json.Marshal(struct {
		Request json.RawMessage `json:"request"`
		Changes []Change        `json:"changes"`
	}{request, Diff(before, after)})
	return b
}

// RunContext retains the initiator while identifying a scene or effect run.
func RunContext(ctx context.Context, kind, id string) context.Context {
	origin := FromContext(ctx)
	operation := "run:" + kind + ":" + id
	if origin.OperationID != "" && origin.OperationID != operation {
		parent := origin.OperationID
		origin.ParentID = &parent
	}
	origin.OperationID = operation
	origin.RunID = &id
	return WithOrigin(ctx, origin)
}

// RunRecorder persists the intent and final outcome of a runtime program.
type RunRecorder interface {
	BeginAudit(context.Context, string, string) (context.Context, error)
	FinishAudit(context.Context, string) error
}

func secretName(name string) bool {
	key := strings.ToLower(strings.NewReplacer("_", "", "-", "", ".", "").Replace(name))
	switch key {
	case "passwordhash", "apikey", "localkey", "networkkey", "secretpath", "secrethash", "authorization", "privatekey":
		return true
	}
	return strings.HasSuffix(key, "password") || strings.HasSuffix(key, "secret") || strings.HasSuffix(key, "token")
}
