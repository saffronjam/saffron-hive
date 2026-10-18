package graph

import (
	"context"
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
	out := &model.AssistantConversation{ID: c.ID, AutoTitle: c.AutoTitle, TitleOverride: c.TitleOverride, Revision: int(c.Revision), UpdatedAt: c.UpdatedAt, Messages: []*model.AssistantMessage{}, Actions: []*model.AssistantAction{}, Runs: []*model.AssistantRun{}}
	for _, m := range c.Messages {
		attachments := []*model.AssistantAttachment{}
		for _, a := range m.Attachments {
			attachments = append(attachments, &model.AssistantAttachment{ID: a.ID, Name: a.Name, Mime: a.MIME})
		}
		out.Messages = append(out.Messages, &model.AssistantMessage{ID: m.ID, Role: m.Role, Text: m.Text, Attachments: attachments, CreatedAt: m.CreatedAt, RunID: m.RunID})
	}
	for _, a := range c.Actions {
		targets := []*model.AssistantTarget{}
		for _, t := range a.Targets {
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
