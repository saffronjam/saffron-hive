package graph

import (
	"bytes"
	"context"
	"encoding/json"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"
)

type auditFixture struct {
	events                      []store.AuditEvent
	fields, proposals, outcomes []string
}

func (a *auditFixture) BeginAudit(ctx context.Context, field, proposed string) (context.Context, error) {
	a.fields = append(a.fields, field)
	a.proposals = append(a.proposals, proposed)
	o := audit.FromContext(ctx)
	o.OperationID = strconv.Itoa(len(a.fields))
	return audit.WithOrigin(ctx, o), nil
}
func (a *auditFixture) FinishAudit(_ context.Context, status string) error {
	a.outcomes = append(a.outcomes, status)
	return nil
}
func (a *auditFixture) PruneAudit(context.Context) error           { return nil }
func (a *auditFixture) AuditFloor(context.Context) (int64, error)  { return 1, nil }
func (a *auditFixture) AuditCursor(context.Context) (int64, error) { return int64(len(a.events)), nil }
func (a *auditFixture) AuditEvents(_ context.Context, f store.AuditFilter) ([]store.AuditEvent, error) {
	out := []store.AuditEvent{}
	for _, e := range a.events {
		if e.Sequence > f.After && (f.Before == 0 || e.Sequence < f.Before) {
			out = append(out, e)
			if len(out) == f.Limit {
				break
			}
		}
	}
	return out, nil
}
func TestAuditReplayHasNoPageGaps(t *testing.T) {
	a := &auditFixture{}
	for i := 1; i <= 405; i++ {
		a.events = append(a.events, store.AuditEvent{Sequence: int64(i), Before: "null", After: "null", Proposed: "{}"})
	}
	r := &Resolver{Audit: a}
	ctx := auth.WithPrincipal(t.Context(), auth.Principal{ID: "user"})
	f, err := r.auditFilter(ctx, nil)
	if err != nil {
		t.Fatal(err)
	}
	f.Forward = true
	f.After = 1
	f.Limit = 200
	seen := 1
	for seen < 405 {
		page, err := r.auditPage(ctx, f)
		if err != nil {
			t.Fatal(err)
		}
		for _, e := range page.Entries {
			if e.ID != strconv.Itoa(seen+1) {
				t.Fatalf("gap after %d: %s", seen, e.ID)
			}
			seen++
		}
		f.After, _ = strconv.ParseInt(page.Cursor, 10, 64)
	}
	if _, err := r.auditFilter(auth.WithPrincipal(t.Context(), auth.Principal{ID: "guest", Guest: true}), nil); err == nil {
		t.Fatal("guest accessed audit")
	}
	f.After = 1000
	page, err := r.auditPage(ctx, f)
	if err != nil || !page.ResetRequired || page.Cursor != "405" || len(page.Entries) != 0 {
		t.Fatalf("future cursor did not reset: %+v %v", page, err)
	}
}
func TestObservationTimeoutIsBounded(t *testing.T) {
	r := &queryResolver{&Resolver{Audit: &auditFixture{}}}
	ctx := auth.WithPrincipal(t.Context(), auth.Principal{ID: "u"})
	zero := 0
	started := time.Now()
	result, err := r.observe(ctx, model.ObservationStreamAudit, nil, nil, nil, nil, &zero, nil)
	if err != nil || !result.TimedOut || time.Since(started) > time.Second {
		t.Fatalf("result=%+v err=%v", result, err)
	}
}

type firstActivityStore struct {
	GraphStore
	first bool
}

func (s *firstActivityStore) ActivityBounds(context.Context) (int64, int64, error) {
	if s.first {
		return 1, 1, nil
	}
	return 0, 0, nil
}

func (s *firstActivityStore) QueryActivityEvents(context.Context, store.ActivityQuery) ([]store.ActivityEvent, error) {
	if !s.first {
		s.first = true
		return nil, nil
	}
	return []store.ActivityEvent{{ID: 1, Type: "device.action_fired", PayloadJSON: `{"action":"on_press"}`, Timestamp: time.Now()}}, nil
}
func TestObserveActivityIncludesFirstEventAfterEmptyHistory(t *testing.T) {
	env := newTestEnv(t)
	env.resolver.Store = &firstActivityStore{GraphStore: env.resolver.Store}
	r := &queryResolver{env.resolver}
	ctx := auth.WithPrincipal(t.Context(), auth.Principal{ID: "u"})
	wait := 1
	result, err := r.observe(ctx, model.ObservationStreamActivity, nil, nil, nil, nil, &wait, nil)
	if err != nil || result.TimedOut || len(result.Activity) != 1 || result.Cursor != "1" {
		t.Fatalf("first event missing: %+v %v", result, err)
	}
}

func TestAuditMutationAttemptsAndSubmittedFields(t *testing.T) {
	env := newTestEnv(t)
	fixture := &auditFixture{}
	env.resolver.Audit = fixture
	executable := NewExecutableSchema(Config{Resolvers: env.resolver, Directives: DirectiveRoot{Auth: AuthDirective}})
	server := handler.New(executable)
	server.AddTransport(transport.POST{})
	server.AroundFields(env.resolver.AnnounceMutation)
	server.AroundOperations(AuditOperationContext)
	server.AroundResponses(env.resolver.AuditRejectedResponses(executable.Schema()))
	call := func(query string) {
		t.Helper()
		body, err := json.Marshal(map[string]string{"query": query})
		if err != nil {
			t.Fatal(err)
		}
		request := httptest.NewRequest("POST", "/graphql", bytes.NewReader(body))
		request.Header.Set("Content-Type", "application/json")
		request = request.WithContext(auth.WithPrincipal(request.Context(), testUser))
		server.ServeHTTP(httptest.NewRecorder(), request)
	}
	call(`mutation { updateRoom(id:"missing",input:{name:"Submitted",expectedRevision:0}){id} }`)
	if len(fixture.fields) != 1 || len(fixture.outcomes) != 1 || fixture.outcomes[0] != "failed" {
		t.Fatalf("execution attempt recorded incorrectly: %+v", fixture)
	}
	if fixture.proposals[0] != `{"id":"missing","input":{"expectedRevision":0,"name":"Submitted"}}` {
		t.Fatalf("proposal includes omitted fields: %s", fixture.proposals[0])
	}
	call(`mutation { updateRoom(id:"missing",input:{name:"Submitted"}){id} }`)
	if len(fixture.fields) != 2 || len(fixture.outcomes) != 2 || fixture.outcomes[1] != "denied" {
		t.Fatalf("schema rejection missing or duplicated: %+v", fixture)
	}
	call(`mutation { ...Cycle } fragment Cycle on Mutation { deleteRoom(id:"missing") ...Cycle }`)
	if len(fixture.fields) != 3 || fixture.outcomes[2] != "denied" {
		t.Fatalf("cyclic fragment attempt missing: %+v", fixture)
	}
}
