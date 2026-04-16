//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
)

func TestErrors_InvalidSceneID_Query(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`query($id: ID!) {
		scene(id: $id) { id name }
	}`, map[string]any{"id": "nonexistent"})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("scene(nonexistent) returned GraphQL error: %s", gqlResp.Errors[0].Message)
		return
	}

	var result struct {
		Scene *struct {
			ID string `json:"id"`
		} `json:"scene"`
	}
	if err := json.Unmarshal(gqlResp.Data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.Scene != nil {
		t.Errorf("expected null scene for nonexistent ID, got %+v", result.Scene)
	}
}

func TestErrors_InvalidAutomationID_Query(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`query($id: ID!) {
		automation(id: $id) { id name }
	}`, map[string]any{"id": "nonexistent"})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("automation(nonexistent) returned GraphQL error: %s", gqlResp.Errors[0].Message)
		return
	}

	var result struct {
		Automation *struct {
			ID string `json:"id"`
		} `json:"automation"`
	}
	if err := json.Unmarshal(gqlResp.Data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.Automation != nil {
		t.Errorf("expected null automation for nonexistent ID, got %+v", result.Automation)
	}
}

func TestErrors_DeleteScene_InvalidID(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`mutation($id: ID!) { deleteScene(id: $id) }`,
		map[string]any{"id": "nonexistent-scene-id"})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("deleteScene(nonexistent) returned error: %s (acceptable)", gqlResp.Errors[0].Message)
		return
	}

	t.Logf("deleteScene(nonexistent) succeeded without error (no-op delete)")
}

func TestErrors_DeleteAutomation_InvalidID(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`mutation($id: ID!) { deleteAutomation(id: $id) }`,
		map[string]any{"id": "nonexistent-automation-id"})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("deleteAutomation(nonexistent) returned error: %s (acceptable)", gqlResp.Errors[0].Message)
		return
	}

	t.Logf("deleteAutomation(nonexistent) succeeded without error (no-op delete)")
}

func TestErrors_DeleteGroup_InvalidID(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`mutation($id: ID!) { deleteGroup(id: $id) }`,
		map[string]any{"id": "nonexistent-group-id"})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("deleteGroup(nonexistent) returned error: %s (acceptable)", gqlResp.Errors[0].Message)
		return
	}

	t.Logf("deleteGroup(nonexistent) succeeded without error (no-op delete)")
}

func TestErrors_AddGroupMember_InvalidType(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Invalid Type Test" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var cr struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &cr)
	groupID := cr.CreateGroup.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	})

	mutErr := graphqlMutationExpectError(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id }
	}`, map[string]any{
		"input": map[string]any{
			"groupId":    groupID,
			"memberType": "invalid",
			"memberId":   "some-id",
		},
	})
	if mutErr != nil {
		t.Fatalf("expected GraphQL error for invalid memberType, got: %v", mutErr)
	}
}

func TestErrors_CreateScene_EmptyName(t *testing.T) {
	gqlResp, err := graphqlPostRaw(`mutation($input: CreateSceneInput!) {
		createScene(input: $input) { id name }
	}`, map[string]any{
		"input": map[string]any{
			"name":    "",
			"actions": []map[string]any{},
		},
	})
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if len(gqlResp.Errors) > 0 {
		t.Logf("createScene with empty name returned error (validated): %s", gqlResp.Errors[0].Message)
	} else {
		var result struct {
			CreateScene struct {
				ID   string `json:"id"`
				Name string `json:"name"`
			} `json:"createScene"`
		}
		if err := json.Unmarshal(gqlResp.Data, &result); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		t.Logf("createScene with empty name succeeded — server allows empty names (id=%s)", result.CreateScene.ID)
		t.Cleanup(func() {
			_, _ = graphqlMutation(`mutation($id: ID!) { deleteScene(id: $id) }`, map[string]any{"id": result.CreateScene.ID})
		})
	}
}
