package graph

import (
	"context"
	"encoding/json"
	"net/url"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/assistant"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
)

func assistantConversationModel(c *assistant.Conversation) *model.AssistantConversation {
	if c == nil {
		return nil
	}
	out := &model.AssistantConversation{ID: c.ID, AutoTitle: c.AutoTitle, TitleOverride: c.TitleOverride, Revision: int(c.Revision), UpdatedAt: c.UpdatedAt, Messages: []*model.AssistantMessage{}, Actions: []*model.AssistantAction{}, Runs: []*model.AssistantRun{}, Forms: []*model.AssistantChatForm{}}
	for _, form := range c.Forms {
		fields := []*model.AssistantChatField{}
		for _, f := range form.Fields {
			options := f.Options
			if options == nil {
				options = []string{}
			}
			fields = append(fields, &model.AssistantChatField{Key: f.Key, Kind: model.AssistantFieldKind(f.Kind), Label: f.Label, Section: f.Section, Description: f.Description, Min: f.Min, Max: f.Max, Step: f.Step, Options: options, Revision: int(f.Revision), Value: &model.AssistantFieldValue{Text: f.Value.Text, Number: f.Value.Number, Boolean: f.Value.Boolean, AttachmentID: f.Value.AttachmentID}})
		}
		out.Forms = append(out.Forms, &model.AssistantChatForm{ID: form.ID, RunID: form.RunID, Title: form.Title, Description: form.Description, Revision: int(form.Revision), Fields: fields})
	}
	for _, m := range c.Messages {
		attachments := []*model.AssistantAttachment{}
		for _, a := range m.Attachments {
			attachments = append(attachments, &model.AssistantAttachment{ID: a.ID, Name: a.Name, Mime: a.MIME})
		}
		out.Messages = append(out.Messages, &model.AssistantMessage{ID: m.ID, Role: m.Role, Text: m.Text, Attachments: attachments, CreatedAt: m.CreatedAt, RunID: m.RunID})
	}
	for _, a := range c.Actions {
		targets := []*model.AssistantTarget{}
		for _, t := range assistantActionTargets(a) {
			targets = append(targets, &model.AssistantTarget{ID: t.ID, Name: t.Name, Href: t.Href})
		}
		inputs := []*model.AssistantPrivateField{}
		for _, v := range a.Inputs {
			inputs = append(inputs, &model.AssistantPrivateField{Path: v.Path, Label: v.Label, Required: !v.Optional})
		}
		out.Actions = append(out.Actions, &model.AssistantAction{ID: a.ID, RunID: a.RunID, Status: model.AssistantActionStatus(a.Status), Title: a.Title, Description: a.Description, ButtonLabel: a.ButtonLabel, Targets: targets, Inputs: inputs, NeedsConfirmation: a.NeedsConfirmation, Result: a.Result, HasPrivateResult: a.HasPrivateResult})
	}
	for _, r := range c.Runs {
		out.Runs = append(out.Runs, &model.AssistantRun{ID: r.ID, State: model.AssistantRunState(r.State), Activity: r.Activity, Error: r.Error, Model: r.Model, StartedAt: r.StartedAt, FinishedAt: r.FinishedAt})
	}
	return out
}

func assistantTargetHref(resource, id string) string {
	switch resource {
	case "devices", "scenes", "automations", "effects", "integrations":
		return "/" + resource + "/" + url.PathEscape(id)
	case "rooms", "groups":
		return "/" + resource + "?edit=" + url.QueryEscape(id)
	case "webhookEndpoints":
		return "/webhooks/" + url.PathEscape(id)
	case "users", "guests":
		return "/users"
	case "me":
		return "/profile"
	case "floorplan":
		return "/map"
	case "settings", "alarms":
		return "/" + resource
	case "maintenanceTasks":
		return "/maintenance"
	default:
		return ""
	}
}

func assistantActionTargets(action assistant.Action) []assistant.Target {
	if action.Status != assistant.Done || !strings.HasPrefix(action.Operation.Field, "create") {
		return action.Targets
	}
	var data map[string]json.RawMessage
	if json.Unmarshal([]byte(action.Result), &data) != nil {
		return action.Targets
	}
	var entity struct {
		ID, Name string
		Endpoint *struct{ ID, Name string }
	}
	if json.Unmarshal(data[action.Operation.Field], &entity) != nil {
		return action.Targets
	}
	if action.Operation.Field == "createWebhookEndpoint" && entity.Endpoint != nil {
		entity.ID, entity.Name = entity.Endpoint.ID, entity.Endpoint.Name
	}
	if entity.ID == "" {
		return action.Targets
	}
	href := assistantTargetHref(assistantPolicies[action.Operation.Field].Resource, entity.ID)
	if href == "" {
		return action.Targets
	}
	if entity.Name == "" && len(action.Targets) == 1 {
		entity.Name = action.Targets[0].Name
	}
	if entity.Name == "" {
		entity.Name = entity.ID
	}
	return []assistant.Target{{ID: entity.ID, Name: entity.Name, Href: href}}
}

// AnnounceMutation refreshes clients after successful structural writes from any client.
func (r *Resolver) AnnounceMutation(ctx context.Context, next graphql.Resolver) (any, error) {
	result, err := next(ctx)
	fc := graphql.GetFieldContext(ctx)
	if err == nil && fc != nil && fc.Object == "Mutation" && !strings.Contains(strings.ToLower(fc.Field.Name), "assistant") && structuralMutation(fc.Field.Name) {
		r.ApplicationRevision.Add(1)
		if r.ApplicationChanges != nil {
			r.ApplicationChanges.Publish(int(r.ApplicationRevision.Load()))
		}
	}
	return result, err
}

func (r *Resolver) watchApplication(ctx context.Context) <-chan int {
	out := make(chan int, 1)
	var events <-chan int
	unsubscribe := func() {}
	if r.ApplicationChanges != nil {
		events, unsubscribe = r.ApplicationChanges.Subscribe()
	}
	go func() {
		defer close(out)
		defer unsubscribe()
		tick := time.NewTicker(2 * time.Second)
		defer tick.Stop()
		revision := int64(-1)
		for {
			current := r.ApplicationRevision.Load()
			if current != revision {
				select {
				case out <- int(current):
					revision = current
				case <-ctx.Done():
					return
				}
			}
			select {
			case <-ctx.Done():
				return
			case <-events:
			case <-tick.C:
			}
		}
	}()
	return out
}

func assistantDiagnostic(err error) *string { s := err.Error(); return &s }

func structuralMutation(field string) bool {
	switch field {
	case "discoverClaudeModels", "setTargetState", "setDeviceConfiguration", "runDeviceCommand", "simulateDeviceAction", "applyScene", "deactivateScene", "fireAutomationTrigger", "runEffect", "runNativeEffect", "stopEffect", "markDevicesSeen", "testClaudeConnection", "testTuyaConnection", "testZigbee2MqttConnection", "scanZigbee2MqttNetwork", "login", "guestLogin":
		return false
	}
	return true
}
