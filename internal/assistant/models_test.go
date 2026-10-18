package assistant

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestModelDiscoveryUsesControlProtocolAndToken(t *testing.T) {
	path := filepath.Join(t.TempDir(), "claude")
	script := `#!/bin/sh
[ "$CLAUDE_CODE_OAUTH_TOKEN" = "catalog-token" ] || exit 2
[ "$HOME" = "$PWD" ] || exit 3
[ -z "$ANTHROPIC_API_KEY" ] || exit 4
read -r request
case "$request" in *'"type":"control_request"'*'"subtype":"initialize"'*) ;; *) exit 5;; esac
printf '%s\n' '{"type":"control_response","response":{"request_id":"hive-model-catalog","subtype":"success","response":{"models":[{"value":"default","displayName":"Default"},{"value":"claude-fable-test[1m]","displayName":"Fable","resolvedModel":"claude-fable-test[1m]"},{"value":"blocked","disabled":true}]}}}'
read -r unexpected
exit 9
`
	if err := os.WriteFile(path, []byte(script), 0700); err != nil {
		t.Fatal(err)
	}
	t.Setenv("ANTHROPIC_API_KEY", "not-inherited")
	models, err := (&CLIRunner{Binary: path}).Models(t.Context(), "catalog-token")
	if err != nil {
		t.Fatal(err)
	}
	if len(models) != 2 || models[1].ID != "claude-fable-test[1m]" || models[1].Name != "Fable" {
		t.Fatalf("unexpected catalog: %+v", models)
	}
}

func TestModelDiscoveryRejectsMissingCatalogAndCancels(t *testing.T) {
	for _, body := range []string{"read request\nprintf '%s\\n' '{\"type\":\"control_response\",\"response\":{\"request_id\":\"hive-model-catalog\",\"subtype\":\"success\",\"response\":{\"models\":[]}}}'", "read request\nread forever"} {
		path := filepath.Join(t.TempDir(), "claude")
		if err := os.WriteFile(path, []byte("#!/bin/sh\n"+body), 0700); err != nil {
			t.Fatal(err)
		}
		ctx, cancel := context.WithTimeout(t.Context(), 100*time.Millisecond)
		_, err := (&CLIRunner{Binary: path}).Models(ctx, "token")
		cancel()
		if err == nil {
			t.Fatal("accepted missing catalog")
		}
		if strings.Contains(body, "forever") && !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("cancellation: %v", err)
		}
	}
}

func TestDiscoveredModelPersistsUnchanged(t *testing.T) {
	s, _, ctx, _ := testService(t, runnerFunc(func(context.Context, Invocation) (Result, error) { return Result{}, nil }))
	config, err := s.Config(ctx)
	if err != nil {
		t.Fatal(err)
	}
	config.Model = "claude-fable-test[1m]"
	if err := s.UpdateConfig(ctx, *config); err != nil {
		t.Fatal(err)
	}
	got, err := s.Config(ctx)
	if err != nil || got.Model != config.Model {
		t.Fatalf("config: %+v %v", got, err)
	}
}
