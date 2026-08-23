//go:build e2e

package graphql_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
)

func TestIncomingWebhooksLifecycleAndDelivery(t *testing.T) {
	createdData, err := graphqlMutation(`mutation($input: CreateWebhookEndpointInput!) {
		createWebhookEndpoint(input: $input) {
			secretPath
			endpoint { id name enabled rateLimitCount rateLimitWindowMs }
		}
	}`, map[string]any{"input": map[string]any{
		"name": "Pipeline failed", "enabled": true,
		"rateLimitCount": 10, "rateLimitWindowMs": 1000,
	}})
	if err != nil {
		t.Fatalf("create webhook: %v", err)
	}
	var created struct {
		CreateWebhookEndpoint struct {
			SecretPath string `json:"secretPath"`
			Endpoint   struct {
				ID                string `json:"id"`
				Name              string `json:"name"`
				Enabled           bool   `json:"enabled"`
				RateLimitCount    int    `json:"rateLimitCount"`
				RateLimitWindowMs int    `json:"rateLimitWindowMs"`
			} `json:"endpoint"`
		} `json:"createWebhookEndpoint"`
	}
	if err := json.Unmarshal(createdData, &created); err != nil {
		t.Fatal(err)
	}
	endpoint := created.CreateWebhookEndpoint.Endpoint
	secretPath := created.CreateWebhookEndpoint.SecretPath
	if endpoint.ID == "" || endpoint.Name != "Pipeline failed" || !endpoint.Enabled {
		t.Fatalf("unexpected endpoint: %+v", endpoint)
	}
	if !strings.HasPrefix(secretPath, "/api/webhooks/") || strings.Contains(string(createdData), "secretHash") {
		t.Fatalf("unexpected secret result: %s", createdData)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteWebhookEndpoint(id: $id) }`, map[string]any{"id": endpoint.ID})
	})

	webhookURL := strings.TrimSuffix(graphqlURL, "/graphql") + secretPath + "?branch=main"
	req, err := http.NewRequest(http.MethodPost, webhookURL, bytes.NewReader([]byte(`{"pipeline":{"status":"failed"}}`)))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "e2e-ci-runner")
	req.Header.Set("Authorization", "Bearer must-not-persist")
	req.Header.Set("X-Request-ID", "e2e-request-1")
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	responseBody, readErr := io.ReadAll(response.Body)
	_ = response.Body.Close()
	if readErr != nil {
		t.Fatal(readErr)
	}
	if response.StatusCode != http.StatusAccepted {
		t.Fatalf("webhook status = %d: %s", response.StatusCode, responseBody)
	}

	deliveryData, err := graphqlQuery(`query($id: ID!) {
		webhookEndpoint(id: $id) { id lastDeliveryAt }
		webhookDeliveries(endpointId: $id) {
			outcome httpStatus userAgent contentType bodySize requestId queryKeys headerNames
		}
	}`, map[string]any{"id": endpoint.ID})
	if err != nil {
		t.Fatalf("query deliveries: %v", err)
	}
	var deliveries struct {
		WebhookEndpoint struct {
			ID             string  `json:"id"`
			LastDeliveryAt *string `json:"lastDeliveryAt"`
		} `json:"webhookEndpoint"`
		WebhookDeliveries []struct {
			Outcome     string   `json:"outcome"`
			HTTPStatus  int      `json:"httpStatus"`
			UserAgent   string   `json:"userAgent"`
			ContentType string   `json:"contentType"`
			BodySize    int      `json:"bodySize"`
			RequestID   *string  `json:"requestId"`
			QueryKeys   []string `json:"queryKeys"`
			HeaderNames []string `json:"headerNames"`
		} `json:"webhookDeliveries"`
	}
	if err := json.Unmarshal(deliveryData, &deliveries); err != nil {
		t.Fatal(err)
	}
	if deliveries.WebhookEndpoint.LastDeliveryAt == nil || len(deliveries.WebhookDeliveries) != 1 {
		t.Fatalf("missing delivery data: %s", deliveryData)
	}
	delivery := deliveries.WebhookDeliveries[0]
	if delivery.Outcome != "accepted" || delivery.HTTPStatus != http.StatusAccepted || delivery.UserAgent != "e2e-ci-runner" || delivery.RequestID == nil || *delivery.RequestID != "e2e-request-1" {
		t.Fatalf("unexpected delivery: %+v", delivery)
	}
	if strings.Contains(strings.Join(delivery.HeaderNames, " "), "Authorization") || strings.Contains(string(deliveryData), "must-not-persist") {
		t.Fatalf("delivery exposed request secrets: %s", deliveryData)
	}

	updatedData, err := graphqlMutation(`mutation($id: ID!, $input: UpdateWebhookEndpointInput!) {
		updateWebhookEndpoint(id: $id, input: $input) { id name enabled rateLimitCount rateLimitWindowMs }
	}`, map[string]any{
		"id": endpoint.ID,
		"input": map[string]any{
			"name": "CI failure", "enabled": false,
			"rateLimitCount": 2, "rateLimitWindowMs": 2000,
		},
	})
	if err != nil {
		t.Fatalf("update webhook: %v", err)
	}
	if !strings.Contains(string(updatedData), `"name":"CI failure"`) || !strings.Contains(string(updatedData), `"enabled":false`) {
		t.Fatalf("unexpected update: %s", updatedData)
	}

	rotatedData, err := graphqlMutation(`mutation($id: ID!) {
		rotateWebhookEndpointSecret(id: $id) { secretPath endpoint { id } }
	}`, map[string]any{"id": endpoint.ID})
	if err != nil {
		t.Fatalf("rotate webhook: %v", err)
	}
	var rotated struct {
		RotateWebhookEndpointSecret struct {
			SecretPath string `json:"secretPath"`
		} `json:"rotateWebhookEndpointSecret"`
	}
	if err := json.Unmarshal(rotatedData, &rotated); err != nil {
		t.Fatal(err)
	}
	if rotated.RotateWebhookEndpointSecret.SecretPath == secretPath {
		t.Fatal("rotation did not replace the secret path")
	}
	oldResponse, err := http.Post(webhookURL, "application/json", bytes.NewReader([]byte(`{}`)))
	if err != nil {
		t.Fatal(err)
	}
	_ = oldResponse.Body.Close()
	if oldResponse.StatusCode != http.StatusNotFound {
		t.Fatalf("old secret status = %d", oldResponse.StatusCode)
	}
}

func TestIncomingWebhookCannotBeDeletedWhileUsedByAutomation(t *testing.T) {
	createdData, err := graphqlMutation(`mutation {
		createWebhookEndpoint(input: {name: "Build event"}) { secretPath endpoint { id } }
	}`, nil)
	if err != nil {
		t.Fatal(err)
	}
	var created struct {
		CreateWebhookEndpoint struct {
			Endpoint struct {
				ID string `json:"id"`
			} `json:"endpoint"`
		} `json:"createWebhookEndpoint"`
	}
	if err := json.Unmarshal(createdData, &created); err != nil {
		t.Fatal(err)
	}
	endpointID := created.CreateWebhookEndpoint.Endpoint.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteWebhookEndpoint(id: $id) }`, map[string]any{"id": endpointID})
	})

	triggerConfig, _ := json.Marshal(map[string]any{
		"kind": "event", "event_type": "webhook.received", "filter_expr": "true",
		"endpoint_id": endpointID, "webhook_filters": []any{},
	})
	automationData, err := graphqlMutation(`mutation($input: CreateAutomationInput!) {
		createAutomation(input: $input) { id }
	}`, map[string]any{"input": map[string]any{
		"name": "Build light", "enabled": false,
		"nodes": []map[string]any{{"id": "webhook-trigger", "type": "trigger", "config": string(triggerConfig)}},
		"edges": []any{},
	}})
	if err != nil {
		t.Fatalf("create automation: %v", err)
	}
	var automation struct {
		CreateAutomation struct {
			ID string `json:"id"`
		} `json:"createAutomation"`
	}
	if err := json.Unmarshal(automationData, &automation); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteAutomation(id: $id) }`, map[string]any{"id": automation.CreateAutomation.ID})
	})

	if err := graphqlMutationExpectError(`mutation($id: ID!) { deleteWebhookEndpoint(id: $id) }`, map[string]any{"id": endpointID}); err != nil {
		t.Fatal(err)
	}
	batchData, err := graphqlMutation(`mutation($ids: [ID!]!) {
		batchDeleteWebhookEndpoints(ids: $ids)
	}`, map[string]any{"ids": []string{endpointID}})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(batchData), `"batchDeleteWebhookEndpoints":0`) {
		t.Fatalf("batch delete removed a referenced endpoint: %s", batchData)
	}
}
