//go:build e2e

package graphql_test

import (
	"github.com/saffronjam/saffron-hive/internal/automation"
	"testing"
)

func authoredNode(t *testing.T, kind string, raw []byte) automation.AuthoringConfig {
	t.Helper()
	value, err := automation.InterpretAuthoring(automation.NodeType(kind), string(raw))
	if err != nil {
		t.Fatal(err)
	}
	return value
}
