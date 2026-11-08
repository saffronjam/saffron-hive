package graph

import (
	"context"
	"encoding/json"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/adapter/dreame"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type mockDreameDiagnostics struct {
	calls       int
	credentials dreame.Credentials
}

func (p *mockDreameDiagnostics) Inspect(_ context.Context, input dreame.Credentials) (dreame.Report, error) {
	p.calls++
	p.credentials = input
	return dreame.Report{CompletedAt: time.Date(2026, 11, 7, 12, 0, 0, 0, time.UTC), Authenticated: true, Devices: []dreame.DeviceReport{{ID: "vacuum-1", Name: "D10 Plus Gen 2", Model: "dreame.vacuum.r2423", Properties: []dreame.Property{{Name: "BATTERY_LEVEL", SIID: 3, PIID: 1, Value: "84", Code: 0}}, Maps: []cleaning.MapSnapshot{{ID: 7, Name: "Ground floor", Width: 3, Height: 2, GridSize: 50, Layers: []cleaning.MapLayer{{Kind: "room", RoomID: 1, Path: "M0 1h2v1h-2z"}}, Rooms: []cleaning.MapRoom{{ID: 1, Name: "Kitchen"}}}}}}}, nil
}

const dreameDiagnosticsMutation = `mutation {readDreameDiagnostics{authenticated completedAt reads{name json error} devices{id name model maps{id name layers{kind path} rooms{name}} reads{name json error} properties{name siid piid value code}}}}`

func TestDreameDiagnosticsGraphQLReturnsDiagnosticSnapshot(t *testing.T) {
	env := newTestEnv(t)
	probe := &mockDreameDiagnostics{}
	env.resolver.Dreame = probe
	if err := env.store.UpsertDreameConfig(context.Background(), store.DreameConfig{Email: "owner@example.com", Password: "private-password", Region: "eu", Enabled: true}); err != nil {
		t.Fatal(err)
	}
	res := env.query(t, dreameDiagnosticsMutation, nil)
	if len(res.Errors) > 0 {
		t.Fatalf("GraphQL errors: %+v", res.Errors)
	}
	if probe.calls != 1 || probe.credentials.Password != "private-password" {
		t.Fatal("credentials did not reach diagnostic boundary")
	}
	if !strings.Contains(string(res.Data), `"value":"84"`) || !strings.Contains(string(res.Data), `"reads":[]`) {
		t.Fatalf("incomplete report: %s", res.Data)
	}
	if strings.Contains(string(res.Data), "private-password") {
		t.Fatal("password exposed in response")
	}
	if !strings.Contains(string(res.Data), `"name":"Ground floor"`) || !strings.Contains(string(res.Data), `"name":"Kitchen"`) || !strings.Contains(string(res.Data), `"path":"M0 1h2v1h-2z"`) {
		t.Fatalf("decoded map did not reach GraphQL: %s", res.Data)
	}
}

func TestDreameDiagnosticsRequiresRegisteredUser(t *testing.T) {
	for _, guest := range []bool{false, true} {
		t.Run(map[bool]string{false: "anonymous", true: "guest"}[guest], func(t *testing.T) {
			probe := &mockDreameDiagnostics{}
			srv := handler.New(NewExecutableSchema(Config{Resolvers: &Resolver{Dreame: probe}, Directives: DirectiveRoot{Auth: AuthDirective}}))
			srv.AddTransport(transport.POST{})
			body, _ := json.Marshal(map[string]any{"query": dreameDiagnosticsMutation, "variables": map[string]any{"input": map[string]string{"email": "owner@example.com", "password": "secret", "region": "eu"}}})
			req := httptest.NewRequest(http.MethodPost, "/graphql", strings.NewReader(string(body)))
			req.Header.Set("Content-Type", "application/json")
			if guest {
				req = req.WithContext(auth.WithPrincipal(req.Context(), auth.Principal{ID: "guest", Guest: true}))
			}
			w := httptest.NewRecorder()
			srv.ServeHTTP(w, req)
			var result graphqlResponse
			if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			if len(result.Errors) == 0 || probe.calls != 0 {
				t.Fatal("unregistered caller reached Dreame cloud")
			}
		})
	}
}
