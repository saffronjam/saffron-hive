package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

const webhookDeliveryLimit = 1000

// CreateWebhookEndpoint inserts an incoming webhook endpoint.
func (s *DB) CreateWebhookEndpoint(ctx context.Context, params CreateWebhookEndpointParams) (WebhookEndpoint, error) {
	if err := s.q.CreateWebhookEndpoint(ctx, sqlite.CreateWebhookEndpointParams{
		ID:                params.ID,
		Name:              params.Name,
		Enabled:           params.Enabled,
		SecretHash:        params.SecretHash,
		RateLimitCount:    int64(params.RateLimitCount),
		RateLimitWindowMs: int64(params.RateLimitWindowMs),
		CreatedBy:         params.CreatedBy,
	}); err != nil {
		return WebhookEndpoint{}, fmt.Errorf("create webhook endpoint: %w", err)
	}
	return s.GetWebhookEndpoint(ctx, params.ID)
}

// GetWebhookEndpoint returns an endpoint without its secret hash.
func (s *DB) GetWebhookEndpoint(ctx context.Context, id string) (WebhookEndpoint, error) {
	row, err := s.q.GetWebhookEndpoint(ctx, id)
	if err != nil {
		return WebhookEndpoint{}, fmt.Errorf("get webhook endpoint: %w", err)
	}
	return WebhookEndpoint{
		ID:                row.ID,
		Name:              row.Name,
		Enabled:           row.Enabled,
		RateLimitCount:    int(row.RateLimitCount),
		RateLimitWindowMs: int(row.RateLimitWindowMs),
		CreatedAt:         row.CreatedAt,
		UpdatedAt:         row.UpdatedAt,
		CreatedBy:         userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
		LastDeliveryAt:    row.LastDeliveryAt,
	}, nil
}

// GetWebhookEndpointBySecretHash authenticates an endpoint without exposing
// that hash to GraphQL-facing domain types.
func (s *DB) GetWebhookEndpointBySecretHash(ctx context.Context, secretHash string) (WebhookEndpointAuth, error) {
	row, err := s.q.GetWebhookEndpointBySecretHash(ctx, secretHash)
	if err != nil {
		return WebhookEndpointAuth{}, fmt.Errorf("get webhook endpoint by secret hash: %w", err)
	}
	return WebhookEndpointAuth{
		ID:                row.ID,
		Name:              row.Name,
		Enabled:           row.Enabled,
		SecretHash:        row.SecretHash,
		RateLimitCount:    int(row.RateLimitCount),
		RateLimitWindowMs: int(row.RateLimitWindowMs),
	}, nil
}

// ListWebhookEndpoints returns every endpoint without secret material.
func (s *DB) ListWebhookEndpoints(ctx context.Context) ([]WebhookEndpoint, error) {
	rows, err := s.q.ListWebhookEndpoints(ctx)
	if err != nil {
		return nil, fmt.Errorf("list webhook endpoints: %w", err)
	}
	endpoints := make([]WebhookEndpoint, 0, len(rows))
	for _, row := range rows {
		endpoints = append(endpoints, WebhookEndpoint{
			ID:                row.ID,
			Name:              row.Name,
			Enabled:           row.Enabled,
			RateLimitCount:    int(row.RateLimitCount),
			RateLimitWindowMs: int(row.RateLimitWindowMs),
			CreatedAt:         row.CreatedAt,
			UpdatedAt:         row.UpdatedAt,
			CreatedBy:         userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
			LastDeliveryAt:    row.LastDeliveryAt,
		})
	}
	return endpoints, nil
}

// UpdateWebhookEndpoint replaces editable endpoint fields.
func (s *DB) UpdateWebhookEndpoint(ctx context.Context, params UpdateWebhookEndpointParams) (WebhookEndpoint, error) {
	if err := s.q.UpdateWebhookEndpoint(ctx, sqlite.UpdateWebhookEndpointParams{
		Name:              params.Name,
		Enabled:           params.Enabled,
		RateLimitCount:    int64(params.RateLimitCount),
		RateLimitWindowMs: int64(params.RateLimitWindowMs),
		ID:                params.ID,
	}); err != nil {
		return WebhookEndpoint{}, fmt.Errorf("update webhook endpoint: %w", err)
	}
	return s.GetWebhookEndpoint(ctx, params.ID)
}

// UpdateWebhookEndpointSecretHash rotates an endpoint credential.
func (s *DB) UpdateWebhookEndpointSecretHash(ctx context.Context, id, secretHash string) error {
	if err := s.q.UpdateWebhookEndpointSecretHash(ctx, sqlite.UpdateWebhookEndpointSecretHashParams{
		SecretHash: secretHash,
		ID:         id,
	}); err != nil {
		return fmt.Errorf("rotate webhook endpoint secret: %w", err)
	}
	return nil
}

// DeleteWebhookEndpoint deletes an endpoint and its deliveries.
func (s *DB) DeleteWebhookEndpoint(ctx context.Context, id string) error {
	if err := s.q.DeleteWebhookEndpoint(ctx, id); err != nil {
		return fmt.Errorf("delete webhook endpoint: %w", err)
	}
	return nil
}

// BatchDeleteWebhookEndpoints deletes unreferenced endpoints with the given IDs.
func (s *DB) BatchDeleteWebhookEndpoints(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete webhook endpoints: %w", err)
	}
	n, err := s.q.BatchDeleteWebhookEndpoints(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("batch delete webhook endpoints: %w", err)
	}
	return n, nil
}

// ListWebhookEndpointAutomationReferences returns automations whose trigger
// configuration refers to the endpoint.
func (s *DB) ListWebhookEndpointAutomationReferences(ctx context.Context, id string) ([]WebhookAutomationReference, error) {
	rows, err := s.q.ListWebhookEndpointAutomationReferences(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("list webhook endpoint automation references: %w", err)
	}
	refs := make([]WebhookAutomationReference, 0, len(rows))
	for _, row := range rows {
		refs = append(refs, WebhookAutomationReference{ID: row.ID, Name: row.Name})
	}
	return refs, nil
}

// InsertWebhookDelivery persists a delivery and enforces the per-endpoint row
// cap.
func (s *DB) InsertWebhookDelivery(ctx context.Context, params InsertWebhookDeliveryParams) (WebhookDelivery, error) {
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.InsertWebhookDelivery(ctx, sqlite.InsertWebhookDeliveryParams{
			ID:              params.ID,
			EndpointID:      params.EndpointID,
			ReceivedAt:      params.ReceivedAt,
			Outcome:         params.Outcome,
			HttpStatus:      int64(params.HTTPStatus),
			ClientIp:        params.ClientIP,
			UserAgent:       params.UserAgent,
			ContentType:     params.ContentType,
			BodySize:        params.BodySize,
			Body:            params.Body,
			DurationMs:      params.DurationMs,
			RequestID:       params.RequestID,
			QueryKeysJson:   params.QueryKeysJSON,
			HeaderNamesJson: params.HeaderNamesJSON,
		}); err != nil {
			return err
		}
		_, err := q.PruneWebhookDeliveriesOverLimit(ctx, sqlite.PruneWebhookDeliveriesOverLimitParams{
			EndpointID: params.EndpointID,
			KeepCount:  webhookDeliveryLimit,
		})
		return err
	})
	if err != nil {
		return WebhookDelivery{}, fmt.Errorf("insert webhook delivery: %w", err)
	}
	return params, nil
}

// ListWebhookDeliveries returns recent deliveries.
func (s *DB) ListWebhookDeliveries(ctx context.Context, endpointID string, before *time.Time, limit int) ([]WebhookDelivery, error) {
	rows, err := s.q.ListWebhookDeliveries(ctx, sqlite.ListWebhookDeliveriesParams{
		EndpointID: endpointID,
		Before:     before,
		Lim:        int64(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("list webhook deliveries: %w", err)
	}
	deliveries := make([]WebhookDelivery, 0, len(rows))
	for _, row := range rows {
		deliveries = append(deliveries, mapWebhookDelivery(row))
	}
	return deliveries, nil
}

// CountWebhookDeliveriesSince returns requests that consume the rolling limit.
func (s *DB) CountWebhookDeliveriesSince(ctx context.Context, endpointID string, since time.Time) (int64, error) {
	return s.q.CountWebhookDeliveriesSince(ctx, sqlite.CountWebhookDeliveriesSinceParams{
		EndpointID: endpointID,
		ReceivedAt: since,
	})
}

// HasWebhookRateLimitDeliverySince reports whether the active rate-limit
// window already has a diagnostic row.
func (s *DB) HasWebhookRateLimitDeliverySince(ctx context.Context, endpointID string, since time.Time) (bool, error) {
	return s.q.HasWebhookRateLimitDeliverySince(ctx, sqlite.HasWebhookRateLimitDeliverySinceParams{
		EndpointID: endpointID,
		ReceivedAt: since,
	})
}

// PruneWebhookDeliveriesOlderThan deletes expired deliveries.
func (s *DB) PruneWebhookDeliveriesOlderThan(ctx context.Context, cutoff time.Time) (int64, error) {
	n, err := s.q.PruneWebhookDeliveriesOlderThan(ctx, cutoff)
	if err != nil {
		return 0, fmt.Errorf("prune webhook deliveries: %w", err)
	}
	return n, nil
}

func mapWebhookDelivery(row sqlite.WebhookDelivery) WebhookDelivery {
	return WebhookDelivery{
		ID:              row.ID,
		EndpointID:      row.EndpointID,
		ReceivedAt:      row.ReceivedAt,
		Outcome:         row.Outcome,
		HTTPStatus:      int(row.HttpStatus),
		ClientIP:        row.ClientIp,
		UserAgent:       row.UserAgent,
		ContentType:     row.ContentType,
		BodySize:        row.BodySize,
		Body:            row.Body,
		DurationMs:      row.DurationMs,
		RequestID:       row.RequestID,
		QueryKeysJSON:   row.QueryKeysJson,
		HeaderNamesJSON: row.HeaderNamesJson,
	}
}
