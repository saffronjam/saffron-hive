// Package webhook accepts authenticated external events and publishes them to
// Hive's event bus.
package webhook

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/pubsub"
	"github.com/saffronjam/saffron-hive/internal/store"
)

const (
	PathPrefix       = "/api/webhooks/"
	MaxRequestBytes  = 64 * 1024
	DefaultRateCount = 1
	DefaultRateMs    = 1000
)

var logger = logging.Named("webhook")

// DeliveryStore is the persistence surface used by incoming webhook handling.
type DeliveryStore interface {
	GetWebhookEndpointBySecretHash(ctx context.Context, secretHash string) (store.WebhookEndpointAuth, error)
	CountWebhookDeliveriesSince(ctx context.Context, endpointID string, since time.Time) (int64, error)
	HasWebhookRateLimitDeliverySince(ctx context.Context, endpointID string, since time.Time) (bool, error)
	InsertWebhookDelivery(ctx context.Context, params store.InsertWebhookDeliveryParams) (store.WebhookDelivery, error)
	PruneWebhookDeliveriesOlderThan(ctx context.Context, cutoff time.Time) (int64, error)
}

// EndpointStore is the management surface used by GraphQL.
type EndpointStore interface {
	CreateWebhookEndpoint(ctx context.Context, params store.CreateWebhookEndpointParams) (store.WebhookEndpoint, error)
	GetWebhookEndpoint(ctx context.Context, id string) (store.WebhookEndpoint, error)
	ListWebhookEndpoints(ctx context.Context) ([]store.WebhookEndpoint, error)
	UpdateWebhookEndpoint(ctx context.Context, params store.UpdateWebhookEndpointParams) (store.WebhookEndpoint, error)
	UpdateWebhookEndpointSecretHash(ctx context.Context, id, secretHash string) error
	DeleteWebhookEndpoint(ctx context.Context, id string) error
	ListWebhookEndpointAutomationReferences(ctx context.Context, id string) ([]store.WebhookAutomationReference, error)
	ListWebhookDeliveries(ctx context.Context, endpointID string, before *time.Time, limit int) ([]store.WebhookDelivery, error)
}

// Buffer fans persisted delivery metadata out to GraphQL subscriptions.
type Buffer = pubsub.Fanout[store.WebhookDelivery]

// NewBuffer creates a webhook delivery fan-out.
func NewBuffer() *Buffer { return pubsub.NewFanout[store.WebhookDelivery]() }

// Event is the transient payload carried by webhook.received. Request values
// are available to automation evaluation but are never persisted as delivery
// metadata or activity payload.
type Event struct {
	EndpointID   string              `json:"endpointId"`
	EndpointName string              `json:"endpointName"`
	DeliveryID   string              `json:"deliveryId"`
	Body         any                 `json:"body"`
	Text         *string             `json:"text"`
	Query        map[string][]string `json:"query"`
	Headers      map[string][]string `json:"headers"`
	ReceivedAt   time.Time           `json:"receivedAt"`
	ClientIP     string              `json:"clientIp"`
	UserAgent    string              `json:"userAgent"`
	ContentType  string              `json:"contentType"`
	BodySize     int64               `json:"bodySize"`
}

// ActivityPayload is the sanitized webhook.received payload retained in the
// activity log.
type ActivityPayload struct {
	EndpointID  string    `json:"endpointId"`
	DeliveryID  string    `json:"deliveryId"`
	ReceivedAt  time.Time `json:"receivedAt"`
	ClientIP    string    `json:"clientIp,omitempty"`
	UserAgent   string    `json:"userAgent,omitempty"`
	ContentType string    `json:"contentType,omitempty"`
	BodySize    int64     `json:"bodySize"`
}

// SafeActivityPayload returns the persistable subset of an incoming event.
func (e Event) SafeActivityPayload() ActivityPayload {
	return ActivityPayload{
		EndpointID:  e.EndpointID,
		DeliveryID:  e.DeliveryID,
		ReceivedAt:  e.ReceivedAt,
		ClientIP:    e.ClientIP,
		UserAgent:   e.UserAgent,
		ContentType: e.ContentType,
		BodySize:    e.BodySize,
	}
}

// ExpressionPayload returns the request context exposed as trigger.payload.
func (e Event) ExpressionPayload() map[string]any {
	var text any
	if e.Text != nil {
		text = *e.Text
	}
	return map[string]any{
		"endpointId":   e.EndpointID,
		"endpointName": e.EndpointName,
		"deliveryId":   e.DeliveryID,
		"body":         e.Body,
		"text":         text,
		"query":        e.Query,
		"headers":      e.Headers,
		"receivedAt":   e.ReceivedAt,
		"clientIp":     e.ClientIP,
		"userAgent":    e.UserAgent,
		"contentType":  e.ContentType,
		"bodySize":     e.BodySize,
	}
}

// SecretResult pairs an endpoint with its one-time secret path.
type SecretResult struct {
	Endpoint   store.WebhookEndpoint
	SecretPath string
}

// ReferencedError prevents deleting an endpoint used by automations.
type ReferencedError struct {
	References []store.WebhookAutomationReference
}

func (e *ReferencedError) Error() string {
	names := make([]string, 0, len(e.References))
	for _, ref := range e.References {
		names = append(names, ref.Name)
	}
	return fmt.Sprintf("webhook is used by automations: %s", strings.Join(names, ", "))
}

// Service owns endpoint credentials, delivery recording, and publication.
type Service struct {
	deliveries DeliveryStore
	endpoints  EndpointStore
	publisher  eventbus.Publisher
	buffer     *Buffer
	now        func() time.Time
	mu         sync.Mutex
}

// NewService creates an incoming webhook service.
func NewService(s interface {
	DeliveryStore
	EndpointStore
}, publisher eventbus.Publisher, buffer *Buffer) *Service {
	return &Service{deliveries: s, endpoints: s, publisher: publisher, buffer: buffer, now: time.Now}
}

// CreateEndpoint creates an endpoint and returns its credential exactly once.
func (s *Service) CreateEndpoint(ctx context.Context, params store.CreateWebhookEndpointParams) (SecretResult, error) {
	if err := ValidateEndpointFields(params.Name, params.RateLimitCount, params.RateLimitWindowMs); err != nil {
		return SecretResult{}, err
	}
	token, hash, err := newSecret()
	if err != nil {
		return SecretResult{}, err
	}
	params.ID = uuid.NewString()
	params.SecretHash = hash
	endpoint, err := s.endpoints.CreateWebhookEndpoint(ctx, params)
	if err != nil {
		return SecretResult{}, err
	}
	return SecretResult{Endpoint: endpoint, SecretPath: PathPrefix + token}, nil
}

// RotateEndpointSecret invalidates the current credential immediately.
func (s *Service) RotateEndpointSecret(ctx context.Context, id string) (SecretResult, error) {
	endpoint, err := s.endpoints.GetWebhookEndpoint(ctx, id)
	if err != nil {
		return SecretResult{}, err
	}
	token, hash, err := newSecret()
	if err != nil {
		return SecretResult{}, err
	}
	if err := s.endpoints.UpdateWebhookEndpointSecretHash(ctx, id, hash); err != nil {
		return SecretResult{}, err
	}
	endpoint, err = s.endpoints.GetWebhookEndpoint(ctx, id)
	if err != nil {
		return SecretResult{}, err
	}
	return SecretResult{Endpoint: endpoint, SecretPath: PathPrefix + token}, nil
}

// DeleteEndpoint refuses to break automation trigger references.
func (s *Service) DeleteEndpoint(ctx context.Context, id string) error {
	refs, err := s.endpoints.ListWebhookEndpointAutomationReferences(ctx, id)
	if err != nil {
		return err
	}
	if len(refs) > 0 {
		return &ReferencedError{References: refs}
	}
	return s.endpoints.DeleteWebhookEndpoint(ctx, id)
}

// ServeHTTP handles POST /api/webhooks/{token}.
func (s *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := s.now()
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	token := strings.TrimPrefix(r.URL.Path, PathPrefix)
	if token == "" || token == r.URL.Path || strings.Contains(token, "/") {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	endpoint, err := s.deliveries.GetWebhookEndpointBySecretHash(r.Context(), hashSecret(token))
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "not found"})
		return
	}
	if !endpoint.Enabled {
		delivery := s.deliveryFor(r, endpoint.ID, start, "disabled", http.StatusGone, 0)
		s.record(r.Context(), delivery)
		writeJSON(w, http.StatusGone, map[string]string{"error": "webhook disabled"})
		return
	}

	body, tooLarge, err := readBody(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "read request body"})
		return
	}

	window := time.Duration(endpoint.RateLimitWindowMs) * time.Millisecond
	s.mu.Lock()
	count, countErr := s.deliveries.CountWebhookDeliveriesSince(r.Context(), endpoint.ID, start.Add(-window))
	if countErr == nil && count >= int64(endpoint.RateLimitCount) {
		alreadyRecorded, checkErr := s.deliveries.HasWebhookRateLimitDeliverySince(r.Context(), endpoint.ID, start.Add(-window))
		if checkErr == nil && !alreadyRecorded {
			delivery := s.deliveryFor(r, endpoint.ID, start, "rate_limited", http.StatusTooManyRequests, int64(len(body)))
			s.record(r.Context(), delivery)
		}
		s.mu.Unlock()
		retryAfter := int(math.Max(1, math.Ceil(window.Seconds())))
		w.Header().Set("Retry-After", fmt.Sprintf("%d", retryAfter))
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "rate limit exceeded"})
		return
	}
	if countErr != nil {
		s.mu.Unlock()
		logger.Error("check webhook rate limit", "endpoint_id", endpoint.ID, "error", countErr)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if tooLarge {
		delivery := s.deliveryFor(r, endpoint.ID, start, "too_large", http.StatusRequestEntityTooLarge, int64(len(body)))
		s.record(r.Context(), delivery)
		s.mu.Unlock()
		writeJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": "request body exceeds 64 KiB"})
		return
	}

	var parsed any
	var textBody *string
	contentType := strings.ToLower(strings.TrimSpace(strings.Split(r.Header.Get("Content-Type"), ";")[0]))
	if contentType == "application/json" || strings.HasSuffix(contentType, "+json") {
		if len(body) == 0 || json.Unmarshal(body, &parsed) != nil {
			delivery := s.deliveryFor(r, endpoint.ID, start, "invalid_json", http.StatusBadRequest, int64(len(body)))
			s.record(r.Context(), delivery)
			s.mu.Unlock()
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "malformed JSON body"})
			return
		}
	} else if len(body) > 0 {
		value := string(body)
		textBody = &value
	}

	delivery := s.deliveryFor(r, endpoint.ID, start, "accepted", http.StatusAccepted, int64(len(body)))
	if _, err := s.deliveries.InsertWebhookDelivery(r.Context(), delivery); err != nil {
		s.mu.Unlock()
		logger.Error("record webhook delivery", "endpoint_id", endpoint.ID, "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	s.mu.Unlock()

	event := Event{
		EndpointID:   endpoint.ID,
		EndpointName: endpoint.Name,
		DeliveryID:   delivery.ID,
		Body:         parsed,
		Text:         textBody,
		Query:        r.URL.Query(),
		Headers:      safeHeaders(r.Header),
		ReceivedAt:   start,
		ClientIP:     delivery.ClientIP,
		UserAgent:    delivery.UserAgent,
		ContentType:  delivery.ContentType,
		BodySize:     delivery.BodySize,
	}
	if s.buffer != nil {
		s.buffer.Publish(delivery)
	}
	if s.publisher != nil {
		s.publisher.Publish(eventbus.Event{Type: eventbus.EventWebhookReceived, Timestamp: start, Payload: event})
	}
	writeJSON(w, http.StatusAccepted, map[string]string{"deliveryId": delivery.ID})
}

func (s *Service) record(ctx context.Context, delivery store.WebhookDelivery) {
	row, err := s.deliveries.InsertWebhookDelivery(ctx, delivery)
	if err != nil {
		logger.Error("record webhook delivery", "endpoint_id", delivery.EndpointID, "outcome", delivery.Outcome, "error", err)
		return
	}
	if s.buffer != nil {
		s.buffer.Publish(row)
	}
}

func (s *Service) deliveryFor(r *http.Request, endpointID string, started time.Time, outcome string, status int, bodySize int64) store.WebhookDelivery {
	requestID := strings.TrimSpace(r.Header.Get("X-Request-ID"))
	if len(requestID) > 200 {
		requestID = requestID[:200]
	}
	var requestIDPtr *string
	if requestID != "" {
		requestIDPtr = &requestID
	}
	queryKeys := make([]string, 0, len(r.URL.Query()))
	for key := range r.URL.Query() {
		queryKeys = append(queryKeys, key)
	}
	sort.Strings(queryKeys)
	headerNames := make([]string, 0)
	for key := range safeHeaders(r.Header) {
		headerNames = append(headerNames, key)
	}
	sort.Strings(headerNames)
	queryJSON, _ := json.Marshal(queryKeys)
	headerJSON, _ := json.Marshal(headerNames)
	return store.WebhookDelivery{
		ID:              uuid.NewString(),
		EndpointID:      endpointID,
		ReceivedAt:      started,
		Outcome:         outcome,
		HTTPStatus:      status,
		ClientIP:        truncate(auth.ClientIPFromContext(r.Context()), 128),
		UserAgent:       truncate(r.UserAgent(), 512),
		ContentType:     truncate(r.Header.Get("Content-Type"), 200),
		BodySize:        bodySize,
		DurationMs:      max(0, s.now().Sub(started).Milliseconds()),
		RequestID:       requestIDPtr,
		QueryKeysJSON:   string(queryJSON),
		HeaderNamesJSON: string(headerJSON),
	}
}

// RunRetention removes delivery metadata beyond the 30-day retention window.
func RunRetention(ctx context.Context, s DeliveryStore) {
	prune := func() {
		if _, err := s.PruneWebhookDeliveriesOlderThan(ctx, time.Now().Add(-30*24*time.Hour)); err != nil && !errors.Is(err, context.Canceled) {
			logger.Warn("prune webhook deliveries", "error", err)
		}
	}
	prune()
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			prune()
		}
	}
}

func newSecret() (token, hash string, err error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", fmt.Errorf("generate webhook secret: %w", err)
	}
	token = base64.RawURLEncoding.EncodeToString(raw)
	return token, hashSecret(token), nil
}

func hashSecret(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func readBody(body io.Reader) ([]byte, bool, error) {
	data, err := io.ReadAll(io.LimitReader(body, MaxRequestBytes+1))
	if err != nil {
		return nil, false, err
	}
	if len(data) > MaxRequestBytes {
		return data, true, nil
	}
	return data, false, nil
}

func safeHeaders(headers http.Header) map[string][]string {
	result := make(map[string][]string)
	for name, values := range headers {
		lower := strings.ToLower(name)
		if strings.Contains(lower, "authorization") || strings.Contains(lower, "cookie") ||
			strings.Contains(lower, "api-key") || strings.Contains(lower, "apikey") ||
			strings.Contains(lower, "token") || strings.Contains(lower, "secret") ||
			strings.Contains(lower, "signature") {
			continue
		}
		copied := make([]string, 0, len(values))
		for _, value := range values {
			copied = append(copied, truncate(value, 1024))
		}
		result[http.CanonicalHeaderKey(name)] = copied
	}
	return result
}

// ValidateEndpointFields checks the user-editable endpoint limits.
func ValidateEndpointFields(name string, rateCount, rateWindowMs int) error {
	if strings.TrimSpace(name) == "" {
		return fmt.Errorf("name is required")
	}
	if rateCount <= 0 {
		return fmt.Errorf("rate limit count must be positive")
	}
	if rateWindowMs <= 0 {
		return fmt.Errorf("rate limit window must be positive")
	}
	return nil
}

func truncate(value string, limit int) string {
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
