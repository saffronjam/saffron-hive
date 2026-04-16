//go:build e2e

package graphql_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type graphqlRequest struct {
	Query     string         `json:"query"`
	Variables map[string]any `json:"variables,omitempty"`
}

type graphqlResponse struct {
	Data   json.RawMessage `json:"data"`
	Errors []graphqlError  `json:"errors"`
}

type graphqlError struct {
	Message string `json:"message"`
}

func graphqlQuery(query string, variables map[string]any) (json.RawMessage, error) {
	return graphqlPost(query, variables)
}

func graphqlMutation(query string, variables map[string]any) (json.RawMessage, error) {
	return graphqlPost(query, variables)
}

func graphqlPost(query string, variables map[string]any) (json.RawMessage, error) {
	body, err := json.Marshal(graphqlRequest{
		Query:     query,
		Variables: variables,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	resp, err := http.Post(graphqlURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("post: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(respBody))
	}

	var gqlResp graphqlResponse
	if err := json.Unmarshal(respBody, &gqlResp); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}

	if len(gqlResp.Errors) > 0 {
		return nil, fmt.Errorf("graphql errors: %v", gqlResp.Errors[0].Message)
	}

	return gqlResp.Data, nil
}

func pollUntil(timeout time.Duration, interval time.Duration, fn func() bool) bool {
	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		if fn() {
			return true
		}
		time.Sleep(interval)
	}
	return false
}
