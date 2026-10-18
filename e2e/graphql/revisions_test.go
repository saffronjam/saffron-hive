//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
)

func configurationRevision(t *testing.T, field, id string) int {
	t.Helper()
	query := "{ " + field + " { revision } }"
	var variables map[string]any
	if id != "" {
		query = "query($id: ID!) { " + field + "(id: $id) { revision } }"
		variables = map[string]any{"id": id}
	}
	data, err := graphqlQuery(query, variables)
	if err != nil {
		t.Fatalf("read %s revision: %v", field, err)
	}
	var result map[string]*struct{ Revision int }
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatal(err)
	}
	if result[field] == nil {
		return 0
	}
	return result[field].Revision
}
