package graph

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/assistant"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func testAssistantGateway(t *testing.T) (*AssistantGateway, *testEnv, context.Context) {
	t.Helper()
	env := newTestEnv(t)
	schema := NewExecutableSchema(Config{Resolvers: env.resolver, Directives: DirectiveRoot{Auth: AuthDirective}})
	h := handler.New(schema)
	h.AddTransport(transport.POST{})
	h.Use(extension.FixedComplexityLimit(1000))
	return NewAssistantGateway(schema, h, env.resolver, nil, nil), env, auth.WithPrincipal(t.Context(), testUser)
}
func TestAssistantPolicyCoversEveryMutation(t *testing.T) {
	g, _, _ := testAssistantGateway(t)
	for _, f := range g.schema.Mutation.Fields {
		_, included := assistantPolicies[f.Name]
		if !included && !assistantExcludedMutations[f.Name] {
			t.Errorf("mutation %s needs an assistant policy", f.Name)
		}
	}
	for name := range assistantPolicies {
		if g.schema.Mutation.Fields.ForName(name) == nil {
			t.Errorf("unknown policy %s", name)
		}
	}
}
func TestAssistantQueryCannotWriteOrReadChats(t *testing.T) {
	g, _, ctx := testAssistantGateway(t)
	for _, doc := range []string{`mutation { deleteRoom(id:"one") }`, `query { alias: assistantConversations { id } }`, `query { ...Q } fragment Q on Query { assistantConversation(id:"one"){id} }`, `query { assistantActionPrivateResult(conversationId:"c",actionId:"a") }`, `query { claudeConfig { stolen:token } }`, `query { claudeConfig { ...Secrets } } fragment Secrets on ClaudeConfig { stolen:token }`} {
		if _, err := g.Query(ctx, doc, nil); err == nil {
			t.Errorf("accepted %s", doc)
		}
	}
}
func TestAssistantUsesGraphQLAuthorizationAndValidation(t *testing.T) {
	g, _, ctx := testAssistantGateway(t)
	op := assistant.Operation{Field: "createRoom", Arguments: json.RawMessage(`{"input":{"name":"Office"}}`), Selection: "id name"}
	a, err := g.Assess(ctx, op)
	if err != nil {
		t.Fatal(err)
	}
	if a.NeedsConfirmation {
		t.Fatal("ordinary create requires confirmation")
	}
	result, err := g.Execute(ctx, op, nil)
	if err != nil || !strings.Contains(result.Public, "Office") {
		t.Fatalf("create: %+v %v", result, err)
	}
	guest := auth.WithPrincipal(ctx, auth.Principal{ID: "guest", Guest: true})
	if _, err = g.Execute(guest, op, nil); err == nil {
		t.Fatal("guest bypassed auth directive")
	}
	if _, err = g.Execute(context.Background(), op, nil); err == nil {
		t.Fatal("missing identity bypassed directive")
	}
	op.Arguments = json.RawMessage(`{"input":{"unknownField":true}}`)
	if _, err = g.Execute(ctx, op, nil); err == nil {
		t.Fatal("invalid input accepted")
	}
}
func TestAssistantBulkPolicyAndFingerprint(t *testing.T) {
	g, env, ctx := testAssistantGateway(t)
	for _, id := range []string{"a", "b"} {
		env.store.putDevice(device.Device{ID: device.DeviceID(id), FriendlyName: "Light " + id, Type: device.Light})
	}
	single := assistant.Operation{Field: "deleteDevice", Arguments: json.RawMessage(`{"id":"a"}`)}
	a, err := g.Assess(ctx, single)
	if err != nil {
		t.Fatal(err)
	}
	if a.NeedsConfirmation || !a.Destructive || a.Targets[0].Name != "Light a" {
		t.Fatalf("single: %+v", a)
	}
	batch := assistant.Operation{Field: "batchDeleteDevices", Arguments: json.RawMessage(`{"ids":["a","b"]}`)}
	b, err := g.Assess(ctx, batch)
	if err != nil {
		t.Fatal(err)
	}
	if !b.NeedsConfirmation || len(b.Targets) != 2 {
		t.Fatalf("bulk: %+v", b)
	}
	env.store.putDevice(device.Device{ID: "a", FriendlyName: "Changed", Type: device.Light})
	next, err := g.Assess(ctx, single)
	if err != nil {
		t.Fatal(err)
	}
	if next.Fingerprint == a.Fingerprint {
		t.Fatal("changed target did not invalidate approval")
	}
}
func TestAssistantSecretsUsePrivateInputsAndCannotBeAliased(t *testing.T) {
	g, _, ctx := testAssistantGateway(t)
	op := assistant.Operation{Field: "createUser", Arguments: json.RawMessage(`{"input":{"username":"new","name":"New"}}`)}
	a, err := g.Assess(ctx, op)
	if err != nil {
		t.Fatal(err)
	}
	if len(a.Inputs) != 1 || a.Inputs[0].Path != "input.password" {
		t.Fatalf("private fields %+v", a.Inputs)
	}
	op.Arguments = json.RawMessage(`{"input":{"username":"new","name":"New","password":"leak"}}`)
	if _, err = g.Assess(ctx, op); err == nil {
		t.Fatal("accepted model-supplied password")
	}
	op = assistant.Operation{Field: "createWebhookEndpoint", Arguments: json.RawMessage(`{"input":{"name":"Test"}}`), Selection: "stolen: secretPath"}
	if _, err = g.Assess(ctx, op); err == nil {
		t.Fatal("accepted private output alias")
	}
}
func TestAssistantRejectsInjectedSecondMutation(t *testing.T) {
	g, _, ctx := testAssistantGateway(t)
	op := assistant.Operation{Field: "createRoom", Arguments: json.RawMessage(`{"input":{"name":"Office"}}`), Selection: `id } deleteRoom(id:"other") x:createRoom(input:{name:"hidden"}) { id`}
	if _, err := g.Assess(ctx, op); err == nil {
		t.Fatal("accepted second mutation")
	}
}
func TestAssistantIntegrationImpactIsAssessed(t *testing.T) {
	g, env, ctx := testAssistantGateway(t)
	env.store.tuyaConfig = &store.TuyaConfig{AccessID: "id", AccessSecret: "secret", Region: "eu", Enabled: true}
	a, err := g.Assess(ctx, assistant.Operation{Field: "deleteIntegration", Arguments: json.RawMessage(`{"provider":"tuya"}`)})
	if err != nil {
		t.Fatal(err)
	}
	if !a.NeedsConfirmation || !strings.Contains(a.Description, "purges") {
		t.Fatalf("impact %+v", a)
	}
}

func TestAssistantDetectsReplacementOfConfigurationItems(t *testing.T) {
	previous := json.RawMessage(`{"id":"a","nodes":[{"id":"one"},{"id":"two"}]}`)
	args := map[string]json.RawMessage{"input": json.RawMessage(`{"nodes":[{"id":"three"},{"id":"four"}]}`)}
	if removedItems(previous, args, []string{"a"}) != 2 {
		t.Fatal("equal-size replacement concealed removals")
	}
	previous = json.RawMessage(`{"id":"a","tracks":[{"id":"track","clips":[{"id":"one"},{"id":"two"}]}]}`)
	args["input"] = json.RawMessage(`{"tracks":[{"id":"track","clips":[]}]}`)
	if removedItems(previous, args, []string{"a"}) != 2 {
		t.Fatal("nested clip removal concealed removals")
	}
}
