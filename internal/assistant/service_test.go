package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/testdb"
)

var assistantDBTemplate = testdb.NewTemplate(store.Migrations, "migrations")

func (f runnerFunc) Models(context.Context, string) ([]AvailableModel, error) {
	return []AvailableModel{{ID: "opus", Name: "Opus"}}, nil
}

type runnerFunc func(context.Context, Invocation) (Result, error)

func (f runnerFunc) Run(ctx context.Context, inv Invocation) (Result, error) { return f(ctx, inv) }

type testGateway struct {
	mu         sync.Mutex
	assessment Assessment
	executed   int
	values     []SecretValue
	result     ExecutionResult
}

func (g *testGateway) Discover(context.Context, string) (string, error) { return "schema", nil }
func (g *testGateway) Query(context.Context, string, json.RawMessage) (string, error) {
	return `{}`, nil
}
func (g *testGateway) Assess(context.Context, Operation) (Assessment, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.assessment, nil
}
func (g *testGateway) Execute(_ context.Context, _ Operation, v []SecretValue) (ExecutionResult, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.executed++
	g.values = append([]SecretValue{}, v...)
	return g.result, nil
}
func (g *testGateway) count() int { g.mu.Lock(); defer g.mu.Unlock(); return g.executed }

func testService(t *testing.T, runner Runner) (*Service, *store.DB, context.Context, auth.Principal) {
	t.Helper()
	db, err := assistantDBTemplate.Open(filepath.Join(t.TempDir(), "assistant.db"), "_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_txlock=immediate")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	st := store.New(db)
	user, err := st.CreateUser(t.Context(), store.CreateUserParams{ID: "owner", Username: "owner", Name: "Owner", PasswordHash: "hash"})
	if err != nil {
		t.Fatal(err)
	}
	_, err = st.CreateUser(t.Context(), store.CreateUserParams{ID: "other", Username: "other", Name: "Other", PasswordHash: "hash"})
	if err != nil {
		t.Fatal(err)
	}
	root, cancel := context.WithCancel(t.Context())
	p := auth.Principal{ID: user.ID, TokenVersion: user.TokenVersion}
	ctx := auth.WithPrincipal(root, p)
	if runner == nil {
		runner = runnerFunc(func(ctx context.Context, _ Invocation) (Result, error) { <-ctx.Done(); return Result{}, ctx.Err() })
	}
	s := New(root, st, runner)
	s.SetGateway(&testGateway{})
	if err = s.Start(); err != nil {
		t.Fatal(err)
	}
	if err = s.UpdateConfig(ctx, store.ClaudeConfig{Token: "test-token", Enabled: true, Model: "opus"}); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cancel()
		deadline := time.Now().Add(2 * time.Second)
		for time.Now().Before(deadline) {
			s.mu.Lock()
			n := len(s.workers)
			s.mu.Unlock()
			if n == 0 {
				return
			}
			time.Sleep(time.Millisecond)
		}
		t.Error("assistant workers did not stop")
	})
	return s, st, ctx, p
}
func seededRun(t *testing.T, s *Service, ctx context.Context, p auth.Principal) (string, string) {
	t.Helper()
	c, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	id := uuid.NewString()
	err = s.mutate(ctx, p.ID, c.ID, func(c *Conversation) error {
		c.Runs = append(c.Runs, Run{ID: id, State: Running, Model: "opus", TokenVersion: p.TokenVersion})
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
	return c.ID, id
}
func eventually(t *testing.T, fn func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if fn() {
			return
		}
		time.Sleep(5 * time.Millisecond)
	}
	t.Fatal("condition did not become true")
}

func TestConfirmationIsBoundToOwnerAndExecutesOnce(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	g := &testGateway{assessment: Assessment{NeedsConfirmation: true, Fingerprint: "same", Targets: []Target{{ID: "a", Name: "One"}, {ID: "b", Name: "Two"}}}}
	s.SetGateway(g)
	id, run := seededRun(t, s, ctx, p)
	_, err := s.act(ctx, p, id, run, Operation{Field: "batchDeleteAutomations", Arguments: json.RawMessage(`{"ids":["a","b"]}`)}, false)
	if err != nil {
		t.Fatal(err)
	}
	c, _ := s.Get(ctx, id)
	a := c.Actions[0]
	if g.count() != 0 || c.Runs[0].State != Waiting {
		t.Fatal("action ran before approval")
	}
	if _, err = s.Respond(ctx, id, a.ID, true, false, nil); err == nil {
		t.Fatal("accepted without acknowledgement")
	}
	other := auth.WithPrincipal(ctx, auth.Principal{ID: "other"})
	if _, err = s.Respond(other, id, a.ID, true, true, nil); err == nil {
		t.Fatal("accepted another user's approval")
	}
	if _, err = s.act(ctx, p, id, run, Operation{Field: "deleteAutomation", Arguments: json.RawMessage(`{}`)}, false); !errors.Is(err, ErrWaiting) {
		t.Fatalf("write while waiting: %v", err)
	}
	var wg sync.WaitGroup
	for range 5 {
		wg.Go(func() { _, _ = s.Respond(ctx, id, a.ID, true, true, nil) })
	}
	wg.Wait()
	if g.count() != 1 {
		t.Fatalf("executions=%d", g.count())
	}
}
func TestStaleAndRejectedCardsNeverExecute(t *testing.T) {
	for _, stale := range []bool{false, true} {
		t.Run(map[bool]string{false: "rejected", true: "stale"}[stale], func(t *testing.T) {
			s, _, ctx, p := testService(t, nil)
			g := &testGateway{assessment: Assessment{NeedsConfirmation: true, Fingerprint: "one"}}
			s.SetGateway(g)
			id, run := seededRun(t, s, ctx, p)
			_, err := s.act(ctx, p, id, run, Operation{Field: "deleteRoom", Arguments: json.RawMessage(`{}`)}, false)
			if err != nil {
				t.Fatal(err)
			}
			c, _ := s.Get(ctx, id)
			if stale {
				g.mu.Lock()
				g.assessment.Fingerprint = "two"
				g.mu.Unlock()
			}
			if _, err = s.Respond(ctx, id, c.Actions[0].ID, stale, true, nil); err != nil {
				t.Fatal(err)
			}
			if g.count() != 0 {
				t.Fatal("executed unapproved operation")
			}
		})
	}
}
func TestPrivateValuesNeverEnterTranscriptOrDatabase(t *testing.T) {
	s, st, ctx, p := testService(t, nil)
	g := &testGateway{assessment: Assessment{Fingerprint: "same", Inputs: []SecretField{{Path: "input.password", Label: "Password"}}}, result: ExecutionResult{Public: `{"created":true}`, Private: "generated-secret"}}
	s.SetGateway(g)
	id, run := seededRun(t, s, ctx, p)
	_, err := s.act(ctx, p, id, run, Operation{Field: "createUser", Arguments: json.RawMessage(`{"input":{"username":"new"}}`)}, false)
	if err != nil {
		t.Fatal(err)
	}
	c, _ := s.Get(ctx, id)
	a := c.Actions[0]
	if _, err = s.Respond(ctx, id, a.ID, true, false, []SecretValue{{Path: "input.password", Value: "private-password"}}); err != nil {
		t.Fatal(err)
	}
	row, err := st.GetAssistantConversation(ctx, id, p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(row.Document, "private-password") || strings.Contains(row.Document, "generated-secret") {
		t.Fatal("secret persisted in chat")
	}
	c, _ = s.Get(ctx, id)
	if strings.Contains(transcript(c, run), "generated-secret") {
		t.Fatal("secret exposed to model")
	}
	secret, err := s.PrivateResult(ctx, id, a.ID)
	if err != nil || secret != "generated-secret" {
		t.Fatalf("private output: %q %v", secret, err)
	}
	if _, err = s.PrivateResult(auth.WithPrincipal(ctx, auth.Principal{ID: "other"}), id, a.ID); err == nil {
		t.Fatal("private output leaked across users")
	}
}
func TestSingleDeleteAllowedAndSequentialDeletesRequireConfirmation(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	g := &testGateway{assessment: Assessment{Destructive: true, Targets: []Target{{ID: "a"}}}}
	s.SetGateway(g)
	id, run := seededRun(t, s, ctx, p)
	if _, err := s.act(ctx, p, id, run, Operation{Field: "deleteRoom", Arguments: json.RawMessage(`{"id":"a"}`)}, false); err != nil {
		t.Fatal(err)
	}
	if g.count() != 1 {
		t.Fatal("single delete should execute")
	}
	g.mu.Lock()
	g.assessment.Targets = []Target{{ID: "b"}}
	g.mu.Unlock()
	if _, err := s.act(ctx, p, id, run, Operation{Field: "deleteRoom", Arguments: json.RawMessage(`{"id":"b"}`)}, false); err != nil {
		t.Fatal(err)
	}
	c, _ := s.Get(ctx, id)
	if g.count() != 1 || c.Runs[0].State != Waiting {
		t.Fatal("sequential delete bypassed approval")
	}
}
func TestRestartMarksWorkInterruptedWithoutReplaying(t *testing.T) {
	s, st, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	if err := s.mutate(ctx, p.ID, id, func(c *Conversation) error {
		c.Actions = append(c.Actions, Action{ID: "pending", RunID: run, Status: Executing})
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	second := New(t.Context(), st, runnerFunc(func(context.Context, Invocation) (Result, error) { t.Error("replayed a run"); return Result{}, nil }))
	if err := second.Start(); err != nil {
		t.Fatal(err)
	}
	c, err := second.Get(ctx, id)
	if err != nil || c.Runs[0].State != Interrupted || c.Actions[0].Status != Stale {
		t.Fatalf("restart state: %+v %v", c, err)
	}
}
func TestRunClassifiesStreamsAndDeduplicatesMessages(t *testing.T) {
	var mu sync.Mutex
	models := []string{}
	runner := runnerFunc(func(_ context.Context, inv Invocation) (Result, error) {
		mu.Lock()
		models = append(models, inv.Model)
		mu.Unlock()
		if inv.JSONSchema != "" {
			return Result{Structured: json.RawMessage(`{"decision":"allow","bulkDestructive":false,"reply":""}`)}, nil
		}
		if inv.MCPURL != "" {
			if inv.OnText != nil {
				t.Fatal("tool commentary must not stream")
			}
			return Result{Text: "Internal work notes"}, nil
		}
		inv.OnText("Your lights ")
		inv.OnText("are on.")
		return Result{Text: "Your lights are on."}, nil
	})
	s, _, ctx, _ := testService(t, runner)
	c, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	clientID := uuid.NewString()
	if _, err = s.Send(ctx, c.ID, "Check the lights", nil, clientID); err != nil {
		t.Fatal(err)
	}
	if _, err = s.Send(ctx, c.ID, "Check the lights", nil, clientID); err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[0].State == Completed })
	if len(c.Runs) != 1 || len(c.Messages) != 2 || c.Messages[1].Text != "Your lights are on." {
		t.Fatalf("chat: %+v", c)
	}
	mu.Lock()
	defer mu.Unlock()
	if strings.Join(models, ",") != "haiku,opus,opus" {
		t.Fatalf("models %v", models)
	}
}
func TestUnrelatedRequestNeverReachesMainAgent(t *testing.T) {
	count := 0
	s, _, ctx, _ := testService(t, runnerFunc(func(_ context.Context, inv Invocation) (Result, error) {
		count++
		if inv.Model != "haiku" {
			t.Error("main agent reached")
		}
		return Result{Structured: json.RawMessage(`{"decision":"unrelated","bulkDestructive":false,"reply":"Ask me about your home."}`)}, nil
	}))
	c, _ := s.Create(ctx)
	_, err := s.Send(ctx, c.ID, "Write unrelated content", nil, uuid.NewString())
	if err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[0].State == Completed })
	if count != 1 {
		t.Fatalf("calls %d", count)
	}
}
func TestToolsRequireLiveScopedGrant(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	url, token, revoke := s.tools.Issue(p, id, run)
	for _, bearer := range []string{"", token} {
		req, err := http.NewRequestWithContext(ctx, "POST", url, strings.NewReader(`{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}`))
		if err != nil {
			t.Fatal(err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json, text/event-stream")
		req.Header.Set("Authorization", "Bearer "+bearer)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		_ = resp.Body.Close()
		if bearer == "" && resp.StatusCode != 401 {
			t.Fatal("accepted missing grant")
		}
		if bearer != "" && resp.StatusCode != 200 {
			t.Fatalf("initialize status %d", resp.StatusCode)
		}
	}
	revoke()
	req := httptest.NewRequest("POST", url, nil)
	req.Header.Set("Authorization", "Bearer "+token)
	if s.tools.lookup(req) != nil {
		t.Fatal("revoked grant remains valid")
	}
}
func TestWaitingConversationDoesNotStartQueuedWork(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	id, run := seededRun(t, s, ctx, p)
	if err := s.mutate(ctx, p.ID, id, func(c *Conversation) error {
		findRun(c, run).State = Waiting
		c.Runs = append(c.Runs, Run{ID: "next", State: Queued})
		return nil
	}); err != nil {
		t.Fatal(err)
	}
	s.kick(p, id)
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.workers) != 0 {
		t.Fatal("started queued work while waiting")
	}
}

func TestRevokedIdentityCannotUsePendingActionOrTools(t *testing.T) {
	s, st, ctx, p := testService(t, nil)
	g := &testGateway{assessment: Assessment{NeedsConfirmation: true}}
	s.SetGateway(g)
	id, run := seededRun(t, s, ctx, p)
	if _, err := s.act(ctx, p, id, run, Operation{Field: "deleteRoom", Arguments: json.RawMessage(`{}`)}, false); err != nil {
		t.Fatal(err)
	}
	c, _ := s.Get(ctx, id)
	if err := st.BumpUserTokenVersion(ctx, p.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Respond(ctx, id, c.Actions[0].ID, true, true, nil); err == nil {
		t.Fatal("revoked identity approved an operation")
	}
	if _, err := s.toolAccess(ctx, p, id, run, false); err == nil {
		t.Fatal("revoked tool grant retained access")
	}
	if g.count() != 0 {
		t.Fatal("executed after revocation")
	}
}
func TestGuestAndExpiredIdentityCannotCreateChats(t *testing.T) {
	s, _, ctx, p := testService(t, nil)
	for _, invalid := range []auth.Principal{{ID: p.ID, Guest: true}, {ID: p.ID, TokenVersion: p.TokenVersion, HardExpiresAt: time.Now().Add(-time.Second)}, {ID: p.ID, MustChangePassword: true}} {
		if _, err := s.Create(auth.WithPrincipal(ctx, invalid)); err == nil {
			t.Fatal("accepted invalid principal")
		}
	}
}
func TestImagesAndConversationOwnership(t *testing.T) {
	s, st, ctx, p := testService(t, nil)
	c, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	image := store.AssistantAttachment{ID: "image", ConversationID: c.ID, Name: "private.jpg", MIME: "image/jpeg", Content: []byte("private-image")}
	if err := st.CreateAssistantAttachment(ctx, image); err != nil {
		t.Fatal(err)
	}
	other := auth.WithPrincipal(ctx, auth.Principal{ID: "other"})
	if _, err := s.Get(other, c.ID); err == nil {
		t.Fatal("read another user's conversation")
	}
	req := httptest.NewRequest("GET", "/api/assistant/attachments/image", nil).WithContext(other)
	rec := httptest.NewRecorder()
	s.AttachmentHandler().ServeHTTP(rec, req)
	if rec.Code != 404 {
		t.Fatalf("private attachment status %d", rec.Code)
	}
	second, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Send(ctx, second.ID, "Use image", []string{image.ID}, uuid.NewString()); err == nil {
		t.Fatal("cross-conversation attachment accepted")
	}
	if err = s.Delete(ctx, c.ID); err != nil {
		t.Fatal(err)
	}
	if _, err = st.GetAssistantAttachment(ctx, image.ID, p.ID); err == nil {
		t.Fatal("attachment survived chat deletion")
	}
}

func TestFinalResponseFailureKeepsWorkAndRevokesTools(t *testing.T) {
	var s *Service
	var calls int
	var toolURL, token string
	runner := runnerFunc(func(_ context.Context, inv Invocation) (Result, error) {
		calls++
		if inv.JSONSchema != "" {
			return Result{Structured: json.RawMessage(`{"decision":"allow","bulkDestructive":false,"reply":""}`)}, nil
		}
		if inv.MCPURL != "" {
			if inv.OnText != nil {
				t.Error("tool work can stream commentary")
			}
			toolURL, token = inv.MCPURL, inv.MCPToken
			return Result{Text: "Internal notes", CostUSD: 0.25}, nil
		}
		req := httptest.NewRequest("POST", toolURL, nil)
		req.Header.Set("Authorization", "Bearer "+token)
		if s.tools.lookup(req) != nil {
			t.Error("tool grant survived into final response")
		}
		if inv.MCPToken != "" || inv.MCPURL != "" {
			t.Error("final response has tools")
		}
		inv.OnText("Partial answer")
		return Result{CostUSD: 0.125}, fmt.Errorf("response interrupted")
	})
	var ctx context.Context
	s, _, ctx, _ = testService(t, runner)
	c, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	clientID := uuid.NewString()
	if _, err = s.Send(ctx, c.ID, "Check lights", nil, clientID); err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[0].State == Failed })
	if calls != 3 || c.Runs[0].CostUSD != 0.375 {
		t.Fatalf("calls=%d run=%+v", calls, c.Runs[0])
	}
	if len(c.Messages) != 2 || c.Messages[1].Text != "Partial answer" {
		t.Fatalf("messages=%+v", c.Messages)
	}
	if _, err = s.Send(ctx, c.ID, "Check lights", nil, clientID); err != nil {
		t.Fatal(err)
	}
	c, _ = s.Get(ctx, c.ID)
	if len(c.Runs) != 1 {
		t.Fatal("duplicate request replayed failed work")
	}
}

func TestConversationAutomaticNameAndManualOverride(t *testing.T) {
	started := make(chan struct{})
	release := make(chan struct{})
	var once sync.Once
	s, st, ctx, _ := testService(t, runnerFunc(func(ctx context.Context, inv Invocation) (Result, error) {
		if inv.JSONSchema != "" {
			once.Do(func() {
				close(started)
				select {
				case <-release:
				case <-ctx.Done():
				}
			})
			if strings.Contains(inv.Prompt, "Ändra ljusstyrkan") {
				return Result{Structured: json.RawMessage(`{"decision":"allow","bulkDestructive":false,"reply":"","title":"Changed brightness"}`)}, nil
			}
			return Result{Structured: json.RawMessage(`{"decision":"allow","bulkDestructive":false,"reply":"","title":"  Nattljus   i hallen  "}`)}, nil
		}
		return Result{Text: "Klart."}, nil
	}))
	c, err := s.Create(ctx)
	if err != nil || c.AutoTitle != "" || c.TitleOverride != "" {
		t.Fatalf("new chat: %+v, %v", c, err)
	}
	if _, err := s.Send(ctx, c.ID, "Skapa nattljus i hallen", nil, uuid.NewString()); err != nil {
		t.Fatal(err)
	}
	select {
	case <-started:
	case <-time.After(time.Second):
		t.Fatal("classification did not start")
	}
	if _, err := s.Rename(ctx, c.ID, "  Min hall  "); err != nil {
		t.Fatal(err)
	}
	close(release)
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[0].State == Completed })
	if c.AutoTitle != "Nattljus i hallen" || c.TitleOverride != "Min hall" {
		t.Fatalf("automatic naming overwrote manual choice: %+v", c)
	}
	rows, err := s.List(ctx)
	if err != nil || len(rows) != 1 || rows[0].AutoTitle != c.AutoTitle || rows[0].TitleOverride != c.TitleOverride {
		t.Fatalf("list: %+v, %v", rows, err)
	}
	other := auth.WithPrincipal(ctx, auth.Principal{ID: "other"})
	if _, err := s.Rename(other, c.ID, "Stolen"); err == nil {
		t.Fatal("another owner could rename the chat")
	}
	if _, err := s.Rename(ctx, c.ID, strings.Repeat("å", 121)); err == nil {
		t.Fatal("accepted an oversized override")
	}
	c, err = s.Rename(ctx, c.ID, " \n ")
	if err != nil || c.AutoTitle != "Nattljus i hallen" || c.TitleOverride != "" {
		t.Fatalf("clearing override: %+v, %v", c, err)
	}
	if _, err := s.Send(ctx, c.ID, "Ändra ljusstyrkan", nil, uuid.NewString()); err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[1].State == Completed })
	reopened := New(t.Context(), st, nil)
	c, err = reopened.Get(ctx, c.ID)
	if err != nil || c.AutoTitle != "Nattljus i hallen" || c.TitleOverride != "" {
		t.Fatalf("persisted name: %+v, %v", c, err)
	}
}

func TestConversationNamingFailureDoesNotPreventLaterNaming(t *testing.T) {
	calls := 0
	s, _, ctx, _ := testService(t, runnerFunc(func(_ context.Context, inv Invocation) (Result, error) {
		calls++
		if calls == 1 {
			return Result{}, errors.New("classifier unavailable")
		}
		if !strings.Contains(inv.Prompt, "First question") {
			t.Error("first question missing from naming context")
		}
		return Result{Structured: json.RawMessage(`{"decision":"clarify","bulkDestructive":false,"reply":"Which lights?","title":"Lighting setup"}`)}, nil
	}))
	c, err := s.Create(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.Send(ctx, c.ID, "First question", nil, uuid.NewString()); err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[0].State == Failed })
	if c.AutoTitle != "" {
		t.Fatal("failed classification assigned a name")
	}
	if _, err := s.Send(ctx, c.ID, "Try again", nil, uuid.NewString()); err != nil {
		t.Fatal(err)
	}
	eventually(t, func() bool { c, _ = s.Get(ctx, c.ID); return c.Runs[1].State == Completed })
	if c.AutoTitle != "Lighting setup" {
		t.Fatalf("title = %q", c.AutoTitle)
	}
}
