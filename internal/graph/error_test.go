package graph

import (
	"testing"
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
