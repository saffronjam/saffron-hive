package graph

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"unicode"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/assistant"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/formatter"
)

type operationPolicy struct {
	Resource    string
	Destructive bool
	Confirm     bool
	Secrets     []assistant.SecretField
}

var assistantPolicies = map[string]operationPolicy{
	"updateLocalizedNameSet": {}, "updateDevice": {Resource: "devices"}, "deleteDevice": {Resource: "devices", Destructive: true}, "restoreDevice": {Resource: "devices"}, "batchDeleteDevices": {Resource: "devices", Destructive: true}, "batchRestoreDevices": {Resource: "devices"},
	"setTargetState": {}, "setDeviceConfiguration": {Resource: "devices"}, "runDeviceCommand": {Resource: "devices", Confirm: true}, "simulateDeviceAction": {Resource: "devices"},
	"applyScene": {Resource: "scenes"}, "deactivateScene": {Resource: "scenes"}, "createScene": {Resource: "scenes"}, "updateScene": {Resource: "scenes"}, "deleteScene": {Resource: "scenes", Destructive: true}, "batchDeleteScenes": {Resource: "scenes", Destructive: true},
	"createAutomation": {Resource: "automations"}, "updateAutomation": {Resource: "automations"}, "deleteAutomation": {Resource: "automations", Destructive: true}, "toggleAutomation": {Resource: "automations"}, "fireAutomationTrigger": {Resource: "automations"}, "batchDeleteAutomations": {Resource: "automations", Destructive: true},
	"createWebhookEndpoint": {Resource: "webhookEndpoints"}, "updateWebhookEndpoint": {Resource: "webhookEndpoints"}, "rotateWebhookEndpointSecret": {Resource: "webhookEndpoints", Confirm: true}, "deleteWebhookEndpoint": {Resource: "webhookEndpoints", Destructive: true}, "batchDeleteWebhookEndpoints": {Resource: "webhookEndpoints", Destructive: true},
	"createGroup": {Resource: "groups"}, "updateGroup": {Resource: "groups"}, "deleteGroup": {Resource: "groups", Destructive: true}, "addGroupMember": {Resource: "groups"}, "removeGroupMember": {Resource: "groups", Destructive: true}, "batchDeleteGroups": {Resource: "groups", Destructive: true}, "batchAddGroupDevices": {Resource: "groups"},
	"createRoom": {Resource: "rooms"}, "updateRoom": {Resource: "rooms"}, "deleteRoom": {Resource: "rooms", Destructive: true}, "addRoomMember": {Resource: "rooms"}, "removeRoomMember": {Resource: "rooms", Destructive: true}, "batchDeleteRooms": {Resource: "rooms", Destructive: true}, "batchAddRoomMembers": {Resource: "rooms"}, "updateFloorplan": {Resource: "floorplan"},
	"updateZigbee2MqttConfig": {Resource: "integrations", Confirm: true, Secrets: []assistant.SecretField{{Path: "input.password", Label: "Broker password", Optional: true}}}, "testZigbee2MqttConnection": {Secrets: []assistant.SecretField{{Path: "input.password", Label: "Broker password", Optional: true}}}, "scanZigbee2MqttNetwork": {},
	"updateTuyaConfig": {Resource: "integrations", Confirm: true, Secrets: []assistant.SecretField{{Path: "input.accessSecret", Label: "Tuya access secret"}}}, "testTuyaConnection": {Secrets: []assistant.SecretField{{Path: "input.accessSecret", Label: "Tuya access secret"}}}, "syncTuyaDevices": {}, "deleteIntegration": {Resource: "integrations", Confirm: true, Destructive: true},
	"updateClaudeConfig": {Resource: "integrations", Confirm: true, Secrets: []assistant.SecretField{{Path: "input.token", Label: "Claude setup-token"}}}, "testClaudeConnection": {Secrets: []assistant.SecretField{{Path: "input.token", Label: "Claude setup-token"}}},
	"updateSetting": {Resource: "settings"}, "createUser": {Resource: "users", Secrets: []assistant.SecretField{{Path: "input.password", Label: "Password"}}}, "createGuest": {Resource: "guests"}, "extendGuest": {Resource: "guests"}, "deleteGuest": {Resource: "guests", Destructive: true}, "batchDeleteGuests": {Resource: "guests", Destructive: true},
	"updateCurrentUser": {Resource: "me"}, "changePassword": {Resource: "me", Confirm: true, Secrets: []assistant.SecretField{{Path: "input.oldPassword", Label: "Current password"}, {Path: "input.newPassword", Label: "New password"}}}, "resetUserPassword": {Resource: "users", Confirm: true, Secrets: []assistant.SecretField{{Path: "newPassword", Label: "New password"}}}, "forceLogoutAllSessions": {Resource: "users", Confirm: true}, "deleteUser": {Resource: "users", Destructive: true, Confirm: true}, "batchDeleteUsers": {Resource: "users", Destructive: true, Confirm: true},
	"raiseAlarm": {Resource: "alarms"}, "deleteAlarm": {Resource: "alarms", Destructive: true}, "batchDeleteAlarms": {Resource: "alarms", Destructive: true}, "completeMaintenanceTasks": {Resource: "maintenanceTasks"}, "markDevicesSeen": {Resource: "devices"},
	"createEffect": {Resource: "effects"}, "updateEffect": {Resource: "effects"}, "deleteEffect": {Resource: "effects", Destructive: true}, "batchDeleteEffects": {Resource: "effects", Destructive: true}, "runEffect": {Resource: "effects"}, "runNativeEffect": {}, "stopEffect": {},
}
var assistantExcludedMutations = map[string]bool{"discoverClaudeModels": true, "login": true, "guestLogin": true, "createInitialUser": true, "completeFirstPasswordChange": true, "updateCurrentGuestLanguage": true, "createAssistantConversation": true, "renameAssistantConversation": true, "deleteAssistantConversation": true, "sendAssistantMessage": true, "stopAssistantRun": true, "respondToAssistantAction": true}

type assistantAttachments interface {
	GetAssistantAttachment(context.Context, string, string) (store.AssistantAttachment, error)
}

type AssistantGateway struct {
	schema      *ast.Schema
	handler     http.Handler
	resolver    *Resolver
	attachments assistantAttachments
	avatar      http.Handler
}

func NewAssistantGateway(schema graphql.ExecutableSchema, handler http.Handler, resolver *Resolver, attachments assistantAttachments, avatar http.Handler) *AssistantGateway {
	return &AssistantGateway{schema: schema.Schema(), handler: handler, resolver: resolver, attachments: attachments, avatar: avatar}
}

func (g *AssistantGateway) Discover(_ context.Context, topic string) (string, error) {
	var b strings.Builder
	if topic == "" {
		b.WriteString("Queries:\n")
		for _, f := range g.schema.Query.Fields {
			if assistantReadable(f.Name) {
				fmt.Fprintf(&b, "%s: %s\n", f.Name, f.Type)
			}
		}
		b.WriteString("Mutations (act takes field, arguments JSON string, selection):\n")
		for _, f := range g.schema.Mutation.Fields {
			if _, ok := assistantPolicies[f.Name]; ok {
				fmt.Fprintf(&b, "%s", f.Name)
				for _, a := range f.Arguments {
					fmt.Fprintf(&b, " %s: %s", a.Name, a.Type)
				}
				fmt.Fprintf(&b, " -> %s\n", f.Type)
			}
		}
		b.WriteString("Attachment operations: setAvatar (attachmentId), clearAvatar. Use a type name as topic for full fields and descriptions.")
		return b.String(), nil
	}
	def := g.schema.Types[topic]
	if def == nil {
		return "", errors.New("unknown GraphQL type")
	}
	formatter.NewFormatter(&b).FormatSchemaDocument(&ast.SchemaDocument{Definitions: ast.DefinitionList{def}})
	return b.String(), nil
}

func assistantReadable(field string) bool {
	return field != "setupStatus" && field != "currentGuest" && !strings.HasPrefix(field, "assistant")
}

func rootFields(doc *ast.QueryDocument, set ast.SelectionSet) []*ast.Field {
	var out []*ast.Field
	for _, sel := range set {
		switch v := sel.(type) {
		case *ast.Field:
			out = append(out, v)
		case *ast.InlineFragment:
			out = append(out, rootFields(doc, v.SelectionSet)...)
		case *ast.FragmentSpread:
			if f := doc.Fragments.ForName(v.Name); f != nil {
				out = append(out, rootFields(doc, f.SelectionSet)...)
			}
		}
	}
	return out
}

func (g *AssistantGateway) Query(ctx context.Context, document string, variables json.RawMessage) (string, error) {
	if len(document) > 64000 || len(variables) > 128<<10 {
		return "", errors.New("query is too large")
	}
	doc, errs := gqlparser.LoadQuery(g.schema, document)
	if len(errs) > 0 {
		return "", errors.New(errs.Error())
	}
	if len(doc.Operations) != 1 || doc.Operations[0].Operation != ast.Query {
		return "", errors.New("use act for mutations")
	}
	for _, f := range rootFields(doc, doc.Operations[0].SelectionSet) {
		if !assistantReadable(f.Name) {
			return "", errors.New("this query is unavailable to the assistant")
		}
	}
	if err := safeAssistantSelections(doc); err != nil {
		return "", err
	}
	return g.invoke(ctx, document, variables)
}

func (g *AssistantGateway) invoke(ctx context.Context, document string, variables json.RawMessage) (string, error) {
	raw, err := g.invokeRaw(ctx, document, variables)
	if err != nil {
		return "", err
	}
	return string(redactResponse([]byte(raw))), nil
}
func (g *AssistantGateway) invokeRaw(ctx context.Context, document string, variables json.RawMessage) (string, error) {
	if len(variables) == 0 {
		variables = json.RawMessage(`{}`)
	}
	body, err := json.Marshal(struct {
		Query     string          `json:"query"`
		Variables json.RawMessage `json:"variables"`
	}{document, variables})
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "http://hive.internal/graphql", bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	g.handler.ServeHTTP(rec, req)
	if rec.Code != 200 {
		return "", fmt.Errorf("Hive returned status %d", rec.Code)
	}
	var response struct {
		Data   json.RawMessage `json:"data"`
		Errors []struct {
			Message string `json:"message"`
		} `json:"errors"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		return "", errors.New("invalid Hive response")
	}
	if len(response.Errors) > 0 {
		return "", errors.New(response.Errors[0].Message)
	}
	return string(response.Data), nil
}

func redactResponse(raw json.RawMessage) json.RawMessage {
	var object map[string]json.RawMessage
	if json.Unmarshal(raw, &object) == nil && object != nil {
		for k, v := range object {
			switch strings.ToLower(k) {
			case "token", "password", "accesssecret", "secretpath":
				object[k] = json.RawMessage(`"********"`)
			default:
				object[k] = redactResponse(v)
			}
		}
		b, _ := json.Marshal(object)
		return b
	}
	var list []json.RawMessage
	if json.Unmarshal(raw, &list) == nil && list != nil {
		for i := range list {
			list[i] = redactResponse(list[i])
		}
		b, _ := json.Marshal(list)
		return b
	}
	return raw
}

func argumentObject(raw json.RawMessage) (map[string]json.RawMessage, error) {
	var args map[string]json.RawMessage
	if err := json.Unmarshal(raw, &args); err != nil || args == nil {
		return nil, errors.New("arguments must be an object")
	}
	return args, nil
}
func rawString(raw json.RawMessage) string { var s string; _ = json.Unmarshal(raw, &s); return s }
func argumentPath(args map[string]json.RawMessage, path string) json.RawMessage {
	parts := strings.SplitN(path, ".", 2)
	v := args[parts[0]]
	if len(parts) == 1 {
		return v
	}
	nested, _ := argumentObject(v)
	return argumentPath(nested, parts[1])
}
func putArgument(args map[string]json.RawMessage, path string, value json.RawMessage) error {
	parts := strings.SplitN(path, ".", 2)
	if len(parts) == 1 {
		args[parts[0]] = value
		return nil
	}
	nested, err := argumentObject(args[parts[0]])
	if err != nil {
		return err
	}
	if err := putArgument(nested, parts[1], value); err != nil {
		return err
	}
	args[parts[0]], err = json.Marshal(nested)
	return err
}

func (g *AssistantGateway) mutation(op assistant.Operation, args map[string]json.RawMessage) (string, json.RawMessage, error) {
	f := g.schema.Mutation.Fields.ForName(op.Field)
	if f == nil {
		return "", nil, errors.New("unknown operation")
	}
	keys := make([]string, 0, len(args))
	for k := range args {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var definitions, arguments []string
	for _, k := range keys {
		a := f.Arguments.ForName(k)
		if a == nil {
			return "", nil, fmt.Errorf("unknown argument %s", k)
		}
		definitions = append(definitions, "$"+k+":"+a.Type.String())
		arguments = append(arguments, k+":$"+k)
	}
	selection := op.Selection
	if selection == "" {
		selection = g.selection(f.Type.Name(), 3, false)
	}
	query := "mutation AssistantAction"
	if len(definitions) > 0 {
		query += "(" + strings.Join(definitions, ",") + ")"
	}
	query += "{" + op.Field
	if len(arguments) > 0 {
		query += "(" + strings.Join(arguments, ",") + ")"
	}
	if selection != "" {
		query += "{" + selection + "}"
	}
	query += "}"
	doc, errs := gqlparser.LoadQuery(g.schema, query)
	if len(errs) > 0 {
		return "", nil, errors.New(errs.Error())
	}
	if len(doc.Operations) != 1 {
		return "", nil, errors.New("one operation required")
	}
	fields := rootFields(doc, doc.Operations[0].SelectionSet)
	if len(fields) != 1 || fields[0].Name != op.Field {
		return "", nil, errors.New("one mutation field required")
	}
	if err := safeAssistantSelections(doc); err != nil {
		return "", nil, err
	}
	vars, err := json.Marshal(args)
	return query, vars, err
}

func (g *AssistantGateway) selection(name string, depth int, snapshot bool) string {
	def := g.schema.Types[name]
	if def == nil || def.Kind == ast.Scalar || def.Kind == ast.Enum {
		return ""
	}
	if depth == 0 || def.Kind == ast.Union {
		return "__typename"
	}
	fields := []string{"__typename"}
	for _, f := range def.Fields {
		if len(f.Arguments) > 0 {
			continue
		}
		if snapshot {
			switch f.Name {
			case "state", "available", "lastSeen", "lastFiredAt", "active", "runtimeState", "pendingUntil", "connected", "message", "deviceCount", "resolvedDevices", "documentation", "createdBy":
				continue
			}
		}
		child := g.schema.Types[f.Type.Name()]
		if child == nil {
			continue
		}
		if child.Kind == ast.Scalar || child.Kind == ast.Enum {
			fields = append(fields, f.Name)
		} else if depth > 1 {
			fields = append(fields, f.Name+"{"+g.selection(f.Type.Name(), depth-1, snapshot)+"}")
		}
	}
	return strings.Join(fields, " ")
}

func operationLabel(field string) string {
	var b strings.Builder
	for i, r := range field {
		if unicode.IsUpper(r) && i > 0 {
			b.WriteByte(' ')
		}
		if i == 0 {
			r = unicode.ToUpper(r)
		} else {
			r = unicode.ToLower(r)
		}
		b.WriteRune(r)
	}
	return b.String()
}

func targetIDs(args map[string]json.RawMessage) []string {
	for _, k := range []string{"ids", "alarmIds", "deviceIds"} {
		var ids []string
		if json.Unmarshal(args[k], &ids) == nil && len(ids) > 0 {
			return ids
		}
	}
	for _, k := range []string{"id", "deviceId", "sceneId", "automationId", "effectId", "roomId", "groupId", "userId", "alarmId", "provider"} {
		if id := rawString(args[k]); id != "" {
			return []string{id}
		}
	}
	if id := rawString(argumentPath(args, "input.id")); id != "" {
		return []string{id}
	}
	return nil
}

func (g *AssistantGateway) Assess(ctx context.Context, op assistant.Operation) (assistant.Assessment, error) {
	if op.Field == "setAvatar" || op.Field == "clearAvatar" {
		return g.assessAvatar(ctx, op)
	}
	policy, ok := assistantPolicies[op.Field]
	if !ok {
		return assistant.Assessment{}, errors.New("operation is unavailable to the assistant")
	}
	args, err := argumentObject(op.Arguments)
	if err != nil {
		return assistant.Assessment{}, err
	}
	a := assistant.Assessment{Title: operationLabel(op.Field), ButtonLabel: operationLabel(op.Field), NeedsConfirmation: policy.Confirm, Destructive: policy.Destructive, Targets: []assistant.Target{}, Inputs: []assistant.SecretField{}}
	for _, f := range policy.Secrets {
		value := rawString(argumentPath(args, f.Path))
		keepSecret := strings.Contains(op.Field, "Config") || strings.HasPrefix(op.Field, "test")
		if value != "" && (value != "********" || !keepSecret) {
			return a, errors.New("omit secret values; Hive collects them through a private input card")
		}
		if value == "" {
			a.Inputs = append(a.Inputs, f)
			placeholder, _ := json.Marshal("********")
			if err := putArgument(args, f.Path, placeholder); err != nil {
				return a, err
			}
		}
	}
	if _, _, err := g.mutation(op, args); err != nil {
		return a, err
	}
	ids := targetIDs(args)
	if a.Destructive && len(ids) > 1 {
		a.NeedsConfirmation = true
	}
	if string(argumentPath(args, "input.disabled")) == "true" || op.Field == "toggleAutomation" && string(args["enabled"]) == "false" || op.Field == "updateAutomation" && string(argumentPath(args, "input.enabled")) == "false" {
		a.Destructive = true
	}
	if a.Destructive && len(ids) > 1 {
		a.NeedsConfirmation = true
	}
	var snapshot json.RawMessage = json.RawMessage(`null`)
	if policy.Resource != "" {
		field := g.schema.Query.Fields.ForName(policy.Resource)
		if field != nil {
			q := "query{" + policy.Resource + "{" + g.selection(field.Type.Name(), 4, true) + "}}"
			response, err := g.Query(ctx, q, nil)
			if err != nil {
				return a, err
			}
			var data map[string]json.RawMessage
			_ = json.Unmarshal([]byte(response), &data)
			snapshot = data[policy.Resource]
		}
	}
	var rows []map[string]json.RawMessage
	if json.Unmarshal(snapshot, &rows) != nil {
		var row map[string]json.RawMessage
		if json.Unmarshal(snapshot, &row) == nil && row != nil {
			rows = []map[string]json.RawMessage{row}
		}
	}
	chosen := []json.RawMessage{}
	for _, id := range ids {
		name := id
		for _, row := range rows {
			key := rawString(row["id"])
			if key == "" {
				key = rawString(row["provider"])
			}
			match := key == id
			if strings.HasPrefix(op.Field, "remove") {
				var members []map[string]json.RawMessage
				_ = json.Unmarshal(row["members"], &members)
				for _, m := range members {
					if rawString(m["id"]) == id {
						match = true
					}
				}
			}
			if match {
				for _, key := range []string{"name", "friendlyName", "username"} {
					if v := rawString(row[key]); v != "" {
						name = v
						break
					}
				}
				b, _ := json.Marshal(row)
				chosen = append(chosen, b)
			}
		}
		href := ""
		if policy.Resource != "" && policy.Resource != "settings" {
			resource := policy.Resource
			if resource == "webhookEndpoints" {
				resource = "webhooks"
			}
			href = "/" + resource + "/" + id
		}
		a.Targets = append(a.Targets, assistant.Target{ID: id, Name: name, Href: href})
	}
	if len(ids) == 0 {
		chosen = append(chosen, snapshot)
	}
	if policy.Resource == "integrations" {
		response, err := g.Query(ctx, `query { devices { id name friendlyName source disabled deleted } zigbee2MqttConfig { broker username enabled } tuyaConfig { accessId region enabled } claudeConfig { enabled model } }`, nil)
		if err != nil {
			return a, err
		}
		chosen = append(chosen, json.RawMessage(response))
		var credentials []string
		if cfg, err := g.resolver.Store.GetZigbee2MQTTConfig(ctx); err == nil && cfg != nil {
			credentials = append(credentials, cfg.Password)
		}
		if cfg, err := g.resolver.Store.GetTuyaConfig(ctx); err == nil && cfg != nil {
			credentials = append(credentials, cfg.AccessSecret)
		}
		if g.resolver.Assistant != nil {
			if cfg, err := g.resolver.Assistant.Config(ctx); err == nil && cfg != nil {
				credentials = append(credentials, cfg.Token)
			}
		}
		secretBytes, _ := json.Marshal(credentials)
		secretHash := sha256.Sum256(secretBytes)
		encodedHash, _ := json.Marshal(hex.EncodeToString(secretHash[:]))
		chosen = append(chosen, encodedHash)
	}
	if len(a.Targets) == 0 {
		name := rawString(argumentPath(args, "input.name"))
		if name == "" {
			name = policy.Resource
		}
		if name != "" {
			a.Targets = append(a.Targets, assistant.Target{ID: name, Name: name})
		}
	}
	if op.Field == "updateFloorplan" || op.Field == "updateScene" || op.Field == "updateAutomation" || op.Field == "updateEffect" {
		removed := removedItems(snapshot, args, ids)
		if removed > 0 {
			a.Destructive = true
			a.NeedsConfirmation = a.NeedsConfirmation || removed > 1
			a.Description = fmt.Sprintf("This replaces saved configuration and removes %d existing items.", removed)
		}
	}
	if a.Description == "" {
		if a.Destructive {
			a.Description = fmt.Sprintf("This changes or removes %d selected item(s). Existing references and dependent behavior may be affected.", len(a.Targets))
		} else if a.NeedsConfirmation {
			a.Description = "This changes access or integration behavior. Review the affected items before continuing."
		}
	}
	if op.Field == "deleteIntegration" {
		provider := rawString(args["provider"])
		switch provider {
		case "tuya":
			a.Description = "This removes Tuya configuration and purges its devices. Scenes and automations referencing them are affected."
		case "zigbee2mqtt":
			a.Description = "This disconnects Zigbee2MQTT and removes its configuration. Device records and references are kept."
		case "claude":
			a.Description = "This removes the Claude token and configuration and stops assistant requests. Conversation history is kept."
		}
	}
	fingerprint, _ := json.Marshal(struct {
		Field     string
		Args      json.RawMessage
		Selection string
		Snapshots []json.RawMessage
	}{op.Field, op.Arguments, op.Selection, chosen})
	sum := sha256.Sum256(fingerprint)
	a.Fingerprint = hex.EncodeToString(sum[:])
	return a, nil
}

func removedItems(snapshot json.RawMessage, args map[string]json.RawMessage, ids []string) int {
	var rows []json.RawMessage
	if json.Unmarshal(snapshot, &rows) != nil {
		rows = []json.RawMessage{snapshot}
	}
	total := 0
	for _, raw := range rows {
		old, _ := argumentObject(raw)
		if len(ids) > 0 && rawString(old["id"]) != ids[0] {
			continue
		}
		total += removedConfiguration(raw, args["input"])
	}
	return total
}

func removedConfiguration(previous, next json.RawMessage) int {
	old, err := argumentObject(previous)
	if err != nil {
		return 0
	}
	fresh, err := argumentObject(next)
	if err != nil {
		return 0
	}
	removed := 0
	for key, value := range fresh {
		var before, after []json.RawMessage
		if json.Unmarshal(old[key], &before) == nil && len(before) > 0 && json.Unmarshal(value, &after) == nil {
			switch key {
			case "nodes", "edges", "tracks", "clips", "targets", "behaviours", "vertices", "walls", "rooms", "placements", "furniture", "openings", "doorBindings":
				remaining := map[string]json.RawMessage{}
				for _, item := range after {
					remaining[configurationIdentity(item)] = item
				}
				for _, item := range before {
					if match, ok := remaining[configurationIdentity(item)]; !ok {
						removed++
					} else {
						removed += removedConfiguration(item, match)
					}
				}
			}
		} else {
			removed += removedConfiguration(old[key], value)
		}
	}
	return removed
}
func configurationIdentity(raw json.RawMessage) string {
	obj, err := argumentObject(raw)
	if err != nil {
		return string(raw)
	}
	for _, key := range []string{"id", "deviceId", "targetId"} {
		if id := rawString(obj[key]); id != "" {
			return key + ":" + id
		}
	}
	if from := rawString(obj["fromNodeId"]); from != "" {
		return from + ":" + rawString(obj["toNodeId"])
	}
	b, _ := json.Marshal(obj)
	return string(b)
}

func (g *AssistantGateway) Execute(ctx context.Context, op assistant.Operation, values []assistant.SecretValue) (assistant.ExecutionResult, error) {
	if op.Field == "setAvatar" || op.Field == "clearAvatar" {
		v, err := g.executeAvatar(ctx, op)
		return assistant.ExecutionResult{Public: v}, err
	}
	policy, ok := assistantPolicies[op.Field]
	if !ok {
		return assistant.ExecutionResult{}, errors.New("operation is unavailable")
	}
	args, err := argumentObject(op.Arguments)
	if err != nil {
		return assistant.ExecutionResult{}, err
	}
	for _, value := range values {
		allowed := false
		for _, f := range policy.Secrets {
			if f.Path == value.Path {
				allowed = true
			}
		}
		if !allowed {
			return assistant.ExecutionResult{}, errors.New("unknown private field")
		}
		raw, _ := json.Marshal(value.Value)
		if err := putArgument(args, value.Path, raw); err != nil {
			return assistant.ExecutionResult{}, err
		}
	}
	doc, vars, err := g.mutation(op, args)
	if err != nil {
		return assistant.ExecutionResult{}, err
	}
	result, err := g.invokeRaw(ctx, doc, vars)
	if err != nil && len(values) > 0 {
		return assistant.ExecutionResult{}, errors.New("Hive rejected the private input or operation; check the supplied fields")
	}
	if err != nil {
		return assistant.ExecutionResult{}, err
	}
	public := string(redactResponse([]byte(result)))
	private := ""
	if op.Field == "createWebhookEndpoint" || op.Field == "rotateWebhookEndpointSecret" {
		private = result
	}
	return assistant.ExecutionResult{Public: public, Private: private}, nil
}

func safeAssistantSelections(doc *ast.QueryDocument) error {
	var walk func(ast.SelectionSet) error
	walk = func(set ast.SelectionSet) error {
		for _, sel := range set {
			switch f := sel.(type) {
			case *ast.Field:
				switch strings.ToLower(f.Name) {
				case "token", "password", "accesssecret", "secretpath":
					if f.Alias != f.Name {
						return errors.New("private fields cannot be aliased")
					}
				}
				if err := walk(f.SelectionSet); err != nil {
					return err
				}
			case *ast.InlineFragment:
				if err := walk(f.SelectionSet); err != nil {
					return err
				}
			}
		}
		return nil
	}
	for _, op := range doc.Operations {
		if err := walk(op.SelectionSet); err != nil {
			return err
		}
	}
	for _, f := range doc.Fragments {
		if err := walk(f.SelectionSet); err != nil {
			return err
		}
	}
	return nil
}
