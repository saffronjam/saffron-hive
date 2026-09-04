package graph

import (
	"context"
	"testing"

	"github.com/vektah/gqlparser/v2/gqlerror"
)

func TestInvalidDeviceIdReturnsError(t *testing.T) {
	env := newTestEnv(t)

	resp := env.query(t, `mutation { setTargetState(target: {type: DEVICE, id: "nonexistent"}, state: {brightness: 100}) }`, nil)
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

func TestErrorPresenterUsesStableCodes(t *testing.T) {
	ctx := context.Background()

	for _, code := range []string{"GRAPHQL_VALIDATION_FAILED", "GRAPHQL_PARSE_FAILED"} {
		leaky := &gqlerror.Error{
			Message:    "Cannot query field \"secretField\" on type \"Mutation\".",
			Extensions: map[string]any{"code": code},
		}
		out := ErrorPresenter(ctx, leaky)
		if out.Message != "request failed" {
			t.Errorf("code %s: message = %q, want generic", code, out.Message)
		}
		if out.Extensions["code"] != code {
			t.Errorf("code %s dropped: %v", code, out.Extensions["code"])
		}
	}

	resolverErr := &gqlerror.Error{Message: "too many login attempts; try again in 60s"}
	out := ErrorPresenter(ctx, resolverErr)
	if out.Message != "request failed" || out.Extensions["code"] != "RATE_LIMITED" {
		t.Fatalf("rate-limit error = %+v", out)
	}
	arguments, ok := out.Extensions["arguments"].(map[string]any)
	if !ok || arguments["seconds"] != 60 {
		t.Fatalf("rate-limit arguments = %#v", out.Extensions["arguments"])
	}

	for _, code := range []string{"UNAUTHENTICATED", "PASSWORD_CHANGE_REQUIRED", "BAD_REQUEST"} {
		preserved := &gqlerror.Error{
			Message:    "specific message about " + code,
			Extensions: map[string]any{"code": code},
		}
		out := ErrorPresenter(ctx, preserved)
		if out.Message != "request failed" || out.Extensions["code"] != code {
			t.Errorf("code %s: presented error = %+v", code, out)
		}
	}
}
