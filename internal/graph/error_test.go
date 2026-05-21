package graph

import (
	"context"
	"errors"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

func TestInvalidDeviceIdReturnsError(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation { setDeviceState(deviceId: "nonexistent", state: {brightness: 100}) { id } }`, nil)
	if len(resp.Errors) == 0 {
		t.Fatal("expected GraphQL error for non-existent device")
	}
	for _, e := range resp.Errors {
		if e.Message == "" {
			t.Error("expected non-empty error message")
		}
	}
}

func TestInvalidSceneIdReturnsError(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation { applyScene(sceneId: "nonexistent") { id } }`, nil)
	if len(resp.Errors) == 0 {
		t.Fatal("expected GraphQL error for non-existent scene")
	}
}

// TestErrorPresenterScrubsValidationOnly pins the H2 fix: gqlgen
// validation / parse errors raised on a no-user context collapse to a
// generic "request rejected" so the response cannot be used to enumerate
// schema field or type names. Resolver-side errors (login failures, bootstrap
// rejection, rate-limit messages) pass through unchanged — those are
// composed by our own code and are the only signal a legitimate operator has
// to diagnose a failed request.
func TestErrorPresenterScrubsValidationOnly(t *testing.T) {
	ctx := context.Background()

	for _, code := range []string{"GRAPHQL_VALIDATION_FAILED", "GRAPHQL_PARSE_FAILED"} {
		leaky := &gqlerror.Error{
			Message:    "Cannot query field \"secretField\" on type \"Mutation\".",
			Extensions: map[string]any{"code": code},
		}
		out := ErrorPresenter(ctx, leaky)
		if out.Message != "request rejected" {
			t.Errorf("code %s: message = %q, want generic", code, out.Message)
		}
		if out.Extensions["code"] != code {
			t.Errorf("code %s dropped: %v", code, out.Extensions["code"])
		}
	}

	resolverErr := &gqlerror.Error{Message: "too many login attempts; try again in 60s"}
	out := ErrorPresenter(ctx, resolverErr)
	if out.Message != resolverErr.Message {
		t.Errorf("resolver error message rewritten to %q", out.Message)
	}

	for _, code := range []string{"UNAUTHENTICATED", "PASSWORD_CHANGE_REQUIRED", "BAD_REQUEST"} {
		preserved := &gqlerror.Error{
			Message:    "specific message about " + code,
			Extensions: map[string]any{"code": code},
		}
		out := ErrorPresenter(ctx, preserved)
		if out.Message != preserved.Message {
			t.Errorf("code %s: message rewritten to %q", code, out.Message)
		}
	}

	authCtx := auth.WithUser(ctx, auth.CtxUser{ID: "u-1", Username: "alice"})
	out = ErrorPresenter(authCtx, errors.New("specific validator detail"))
	if out.Message != "specific validator detail" {
		t.Errorf("auth context: message scrubbed = %q", out.Message)
	}
}
