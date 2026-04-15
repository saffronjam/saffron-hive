package graph

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type testEnv struct {
	server      *httptest.Server
	stateReader *mockStateReader
	store       *mockStore
	bus         *eventbus.ChannelBus
	reloader    *mockReloader
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()
	sr := newMockStateReader()
	st := newMockStore()
	bus := eventbus.NewChannelBus()
	rl := &mockReloader{}

	resolver := &Resolver{
		StateReader:        sr,
		Store:              st,
		EventBus:           bus,
		AutomationReloader: rl,
	}

	srv := handler.New(NewExecutableSchema(Config{
		Resolvers: resolver,
	}))
	srv.AddTransport(transport.POST{})

	ts := httptest.NewServer(srv)
	t.Cleanup(ts.Close)

	return &testEnv{
		server:      ts,
		stateReader: sr,
		store:       st,
		bus:         bus,
		reloader:    rl,
	}
}

type graphqlResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []struct {
		Message string `json:"message"`
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
