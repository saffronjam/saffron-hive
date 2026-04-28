package graph

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

// testUser is the synthetic identity attached to every request from the
// default test env. Mirrors what auth.Middleware does in production after a
// successful token check, so existing resolver tests can call @auth-marked
// fields (devices, scenes, etc.) without each test having to mint a token.
var testUser = auth.CtxUser{ID: "test-user", Username: "test", Name: "Test"}

type testEnv struct {
	server       *httptest.Server
	stateReader  *mockStateReader
	store        *mockStore
	bus          *eventbus.ChannelBus
	reloader     *mockReloader
	effectRunner *mockEffectRunner
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()
	sr := newMockStateReader()
	st := newMockStore()
	bus := eventbus.NewChannelBus()
	rl := &mockReloader{}
	er := newMockEffectRunner(st)

	levelVar := &slog.LevelVar{}
	levelVar.Set(slog.LevelInfo)

	resolver := &Resolver{
		StateReader:        sr,
		Store:              st,
		TargetResolver:     st,
		EventBus:           bus,
		AutomationReloader: rl,
		EffectRunner:       er,
		LogBuffer:          logging.NewBuffer(),
		LevelVar:           levelVar,
	}

	srv := handler.New(NewExecutableSchema(Config{
		Resolvers: resolver,
		Directives: DirectiveRoot{
			Auth: AuthDirective,
		},
	}))
	srv.AddTransport(transport.POST{})

	// Inject a synthetic authenticated user for every request. This stands in
	// for auth.Middleware running in production: after a successful token
	// check, the user lives on the context and the @auth directive is
	// satisfied. Tests that need to exercise the unauthenticated path call
	// query through a different env (rebuildWithAuth) which omits this layer.
	authed := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r = r.WithContext(auth.WithUser(r.Context(), testUser))
		srv.ServeHTTP(w, r)
	})

	ts := httptest.NewServer(authed)
	t.Cleanup(ts.Close)

	return &testEnv{
		server:       ts,
		stateReader:  sr,
		store:        st,
		bus:          bus,
		reloader:     rl,
		effectRunner: er,
	}
}

type graphqlResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message    string         `json:"message"`
		Extensions map[string]any `json:"extensions"`
	} `json:"errors"`
}

func (te *testEnv) query(t *testing.T, query string, variables map[string]any) graphqlResponse {
	t.Helper()
	body := map[string]any{
		"query": query,
	}
	if variables != nil {
		body["variables"] = variables
	}
	b, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	resp, err := http.Post(te.server.URL, "application/json", bytes.NewReader(b))
	if err != nil {
		t.Fatalf("POST failed: %v", err)
	}
	defer func() { _ = resp.Body.Close() }()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("read response: %v", err)
	}

	var gqlResp graphqlResponse
	if err := json.Unmarshal(respBody, &gqlResp); err != nil {
		t.Fatalf("unmarshal response: %v\nbody: %s", err, string(respBody))
	}
	return gqlResp
}
