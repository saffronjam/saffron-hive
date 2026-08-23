package webhook

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	migratesqlite "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

func newWebhookTestStore(t *testing.T) *store.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		t.Fatal(err)
	}
	source, err := iofs.New(store.Migrations, "migrations")
	if err != nil {
		t.Fatal(err)
	}
	driver, err := migratesqlite.WithInstance(db, &migratesqlite.Config{})
	if err != nil {
		t.Fatal(err)
	}
	m, err := migrate.NewWithInstance("iofs", source, "sqlite", driver)
	if err != nil {
		t.Fatal(err)
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		t.Fatal(err)
	}
	return store.New(db)
}

func createWebhookTestEndpoint(t *testing.T, service *Service, enabled bool) SecretResult {
	t.Helper()
	result, err := service.CreateEndpoint(context.Background(), store.CreateWebhookEndpointParams{
		Name:              "Pipeline failed",
		Enabled:           enabled,
		RateLimitCount:    1,
		RateLimitWindowMs: 1000,
	})
	if err != nil {
		t.Fatal(err)
	}
	return result
}

func serveWebhook(service *Service, method, path, contentType string, body []byte, headers map[string]string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	recorder := httptest.NewRecorder()
	auth.ClientIPMiddleware(false)(service).ServeHTTP(recorder, req)
	return recorder
}

func TestIncomingWebhookPublishesTransientRequestAndPersistsSafeMetadata(t *testing.T) {
	db := newWebhookTestStore(t)
	bus := eventbus.NewChannelBus()
	service := NewService(db, bus, NewBuffer())
	now := time.Date(2026, 8, 23, 10, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	endpoint := createWebhookTestEndpoint(t, service, true)

	if !strings.HasPrefix(endpoint.SecretPath, PathPrefix) || len(strings.TrimPrefix(endpoint.SecretPath, PathPrefix)) != 43 {
		t.Fatalf("unexpected secret path %q", endpoint.SecretPath)
	}
	if endpoint.Endpoint.ID == "" || strings.Contains(endpoint.Endpoint.ID, strings.TrimPrefix(endpoint.SecretPath, PathPrefix)) {
		t.Fatalf("endpoint exposed secret material: %+v", endpoint.Endpoint)
	}

	events := bus.Subscribe(eventbus.EventWebhookReceived)
	defer bus.Unsubscribe(events)
	response := serveWebhook(service, http.MethodPost, endpoint.SecretPath+"?branch=main", "application/json", []byte(`{"pipeline":{"status":"failed"}}`), map[string]string{
		"Authorization": "Bearer private",
		"Cookie":        "session=private",
		"X-Event-Type":  "pipeline",
		"X-Request-ID":  "request-42",
		"User-Agent":    "ci-runner/1.0",
	})
	if response.Code != http.StatusAccepted {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}

	select {
	case envelope := <-events:
		incoming, ok := envelope.Payload.(Event)
		if !ok {
			t.Fatalf("unexpected payload %T", envelope.Payload)
		}
		body, ok := incoming.Body.(map[string]any)
		if !ok || body["pipeline"] == nil || incoming.Query["branch"][0] != "main" {
			t.Fatalf("request data missing from event: %+v", incoming)
		}
		if incoming.Headers["X-Event-Type"][0] != "pipeline" || incoming.Headers["Authorization"] != nil || incoming.Headers["Cookie"] != nil {
			t.Fatalf("unsafe event headers: %+v", incoming.Headers)
		}
	case <-time.After(time.Second):
		t.Fatal("webhook event was not published")
	}

	deliveries, err := db.ListWebhookDeliveries(context.Background(), endpoint.Endpoint.ID, nil, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(deliveries) != 1 {
		t.Fatalf("deliveries = %d", len(deliveries))
	}
	delivery := deliveries[0]
	if delivery.Outcome != "accepted" || delivery.HTTPStatus != http.StatusAccepted || delivery.BodySize == 0 || delivery.RequestID == nil || *delivery.RequestID != "request-42" {
		t.Fatalf("unexpected delivery: %+v", delivery)
	}
	if strings.Contains(delivery.HeaderNamesJSON, "Authorization") || strings.Contains(delivery.HeaderNamesJSON, "Cookie") || strings.Contains(delivery.QueryKeysJSON, "main") {
		t.Fatalf("delivery persisted request values: %+v", delivery)
	}
}

func TestIncomingWebhookRequestBoundariesAndRateLimit(t *testing.T) {
	db := newWebhookTestStore(t)
	service := NewService(db, nil, nil)
	now := time.Date(2026, 8, 23, 10, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	endpoint := createWebhookTestEndpoint(t, service, true)

	if got := serveWebhook(service, http.MethodGet, endpoint.SecretPath, "", nil, nil).Code; got != http.StatusMethodNotAllowed {
		t.Fatalf("GET status = %d", got)
	}
	if got := serveWebhook(service, http.MethodPost, PathPrefix+"unknown", "application/json", []byte(`{}`), nil).Code; got != http.StatusNotFound {
		t.Fatalf("unknown status = %d", got)
	}
	if got := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{broken`), nil).Code; got != http.StatusBadRequest {
		t.Fatalf("invalid JSON status = %d", got)
	}
	now = now.Add(2 * time.Second)
	if got := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "text/plain", bytes.Repeat([]byte("x"), MaxRequestBytes+1), nil).Code; got != http.StatusRequestEntityTooLarge {
		t.Fatalf("oversize status = %d", got)
	}

	now = now.Add(2 * time.Second)
	if got := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{"ok":true}`), nil).Code; got != http.StatusAccepted {
		t.Fatalf("accepted status = %d", got)
	}
	firstLimited := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{"ok":true}`), nil)
	if firstLimited.Code != http.StatusTooManyRequests || firstLimited.Header().Get("Retry-After") != "1" {
		t.Fatalf("rate limit response = %d, retry = %q", firstLimited.Code, firstLimited.Header().Get("Retry-After"))
	}
	if got := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{"ok":true}`), nil).Code; got != http.StatusTooManyRequests {
		t.Fatalf("repeated rate limit status = %d", got)
	}

	deliveries, err := db.ListWebhookDeliveries(context.Background(), endpoint.Endpoint.ID, nil, 20)
	if err != nil {
		t.Fatal(err)
	}
	outcomes := map[string]int{}
	for _, delivery := range deliveries {
		outcomes[delivery.Outcome]++
	}
	if outcomes["invalid_json"] != 1 || outcomes["too_large"] != 1 || outcomes["accepted"] != 1 || outcomes["rate_limited"] != 1 {
		t.Fatalf("unexpected coalesced outcomes: %+v", outcomes)
	}
}

func TestIncomingWebhookDisableAndRotateInvalidateCredentials(t *testing.T) {
	db := newWebhookTestStore(t)
	service := NewService(db, nil, nil)
	now := time.Date(2026, 8, 23, 10, 0, 0, 0, time.UTC)
	service.now = func() time.Time { return now }
	endpoint := createWebhookTestEndpoint(t, service, true)

	rotated, err := service.RotateEndpointSecret(context.Background(), endpoint.Endpoint.ID)
	if err != nil {
		t.Fatal(err)
	}
	if rotated.SecretPath == endpoint.SecretPath {
		t.Fatal("rotation returned the existing credential")
	}
	if got := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{}`), nil).Code; got != http.StatusNotFound {
		t.Fatalf("rotated credential status = %d", got)
	}
	updated, err := db.UpdateWebhookEndpoint(context.Background(), store.UpdateWebhookEndpointParams{
		ID:                endpoint.Endpoint.ID,
		Name:              endpoint.Endpoint.Name,
		Enabled:           false,
		RateLimitCount:    1,
		RateLimitWindowMs: 1000,
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Enabled {
		t.Fatal("endpoint remained enabled")
	}
	if got := serveWebhook(service, http.MethodPost, rotated.SecretPath, "application/json", []byte(`{}`), nil).Code; got != http.StatusGone {
		t.Fatalf("disabled status = %d", got)
	}
}

func TestIncomingWebhookResponseContainsOnlyDeliveryID(t *testing.T) {
	db := newWebhookTestStore(t)
	service := NewService(db, nil, nil)
	endpoint := createWebhookTestEndpoint(t, service, true)
	response := serveWebhook(service, http.MethodPost, endpoint.SecretPath, "application/json", []byte(`{}`), nil)
	var payload map[string]any
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	if len(payload) != 1 || payload["deliveryId"] == nil {
		t.Fatalf("unexpected response payload: %+v", payload)
	}
}
