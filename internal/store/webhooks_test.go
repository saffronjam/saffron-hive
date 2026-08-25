package store

import (
	"context"
	"testing"
	"time"
)

func TestWebhookEndpointStoreLifecycleAndReferences(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	created, err := s.CreateWebhookEndpoint(ctx, CreateWebhookEndpointParams{
		ID:                "hook-1",
		Name:              "Pipeline failed",
		Enabled:           true,
		SecretHash:        "hash-1",
		RateLimitCount:    2,
		RateLimitWindowMs: 5000,
	})
	if err != nil {
		t.Fatal(err)
	}
	if created.Name != "Pipeline failed" || created.LastDeliveryAt != nil {
		t.Fatalf("unexpected endpoint: %+v", created)
	}

	authenticated, err := s.GetWebhookEndpointBySecretHash(ctx, "hash-1")
	if err != nil {
		t.Fatal(err)
	}
	if authenticated.ID != created.ID || authenticated.SecretHash != "hash-1" {
		t.Fatalf("unexpected authenticated endpoint: %+v", authenticated)
	}

	receivedAt := time.Date(2026, 8, 23, 9, 30, 0, 123456789, time.UTC)
	requestID := "pipeline-42"
	body := `{"pipeline":{"status":"failed"}}`
	_, err = s.InsertWebhookDelivery(ctx, WebhookDelivery{
		ID:              "delivery-1",
		EndpointID:      created.ID,
		ReceivedAt:      receivedAt,
		Outcome:         "accepted",
		HTTPStatus:      202,
		ClientIP:        "192.0.2.5",
		UserAgent:       "test-runner",
		ContentType:     "application/json",
		BodySize:        19,
		Body:            &body,
		DurationMs:      2,
		RequestID:       &requestID,
		QueryKeysJSON:   `["branch"]`,
		HeaderNamesJSON: `["Content-Type"]`,
	})
	if err != nil {
		t.Fatal(err)
	}

	if _, err := s.CreateAutomation(ctx, CreateAutomationParams{ID: "automation-1", Name: "Failure light"}); err != nil {
		t.Fatal(err)
	}
	if _, err := s.CreateAutomationNode(ctx, CreateAutomationNodeParams{
		ID:           "trigger-1",
		AutomationID: "automation-1",
		Type:         "trigger",
		Config:       `{"kind":"event","event_type":"webhook.received","endpoint_id":"hook-1"}`,
	}); err != nil {
		t.Fatal(err)
	}

	loaded, err := s.GetWebhookEndpoint(ctx, created.ID)
	if err != nil {
		t.Fatal(err)
	}
	if loaded.LastDeliveryAt == nil || !loaded.LastDeliveryAt.Equal(receivedAt) {
		t.Fatalf("unexpected endpoint aggregates: %+v", loaded)
	}
	references, err := s.ListWebhookEndpointAutomationReferences(ctx, created.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(references) != 1 || references[0].Name != "Failure light" {
		t.Fatalf("unexpected references: %+v", references)
	}
	deliveries, err := s.ListWebhookDeliveries(ctx, created.ID, nil, 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(deliveries) != 1 || deliveries[0].RequestID == nil || *deliveries[0].RequestID != requestID || deliveries[0].Body == nil || *deliveries[0].Body != body {
		t.Fatalf("unexpected deliveries: %+v", deliveries)
	}

	if _, err := s.CreateWebhookEndpoint(ctx, CreateWebhookEndpointParams{
		ID: "hook-2", Name: "Deploy complete", Enabled: true, SecretHash: "hash-2",
		RateLimitCount: 1, RateLimitWindowMs: 1000,
	}); err != nil {
		t.Fatal(err)
	}
	deleted, err := s.BatchDeleteWebhookEndpoints(ctx, []string{"hook-1", "hook-2", "missing"})
	if err != nil {
		t.Fatal(err)
	}
	if deleted != 1 {
		t.Fatalf("batch deleted %d endpoints, want 1", deleted)
	}
	if _, err := s.GetWebhookEndpoint(ctx, "hook-1"); err != nil {
		t.Fatalf("referenced endpoint was deleted: %v", err)
	}
	if _, err := s.GetWebhookEndpoint(ctx, "hook-2"); err == nil {
		t.Fatal("unreferenced endpoint was not deleted")
	}
}
