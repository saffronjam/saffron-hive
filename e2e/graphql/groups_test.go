//go:build e2e

package graphql_test

import (
	"encoding/json"
	"testing"
)

func TestGroups_CreateAndQuery(t *testing.T) {
	data, err := graphqlMutation(`
		mutation {
			createGroup(input: { name: "Test Group" }) {
				id
				name
				members { id }
				resolvedDevices { id }
			}
		}
	`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}

	var result struct {
		CreateGroup struct {
			ID              string                `json:"id"`
			Name            string                `json:"name"`
			Members         []struct{ ID string } `json:"members"`
			ResolvedDevices []struct{ ID string } `json:"resolvedDevices"`
		} `json:"createGroup"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if result.CreateGroup.Name != "Test Group" {
		t.Errorf("name=%q, want %q", result.CreateGroup.Name, "Test Group")
	}
	if result.CreateGroup.ID == "" {
		t.Error("group ID is empty")
	}
	if len(result.CreateGroup.Members) != 0 {
		t.Errorf("expected 0 members, got %d", len(result.CreateGroup.Members))
	}

	groupID := result.CreateGroup.ID

	data, err = graphqlQuery(`query($id: ID!) {
		group(id: $id) { id name }
	}`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("query group: %v", err)
	}

	var queryResult struct {
		Group struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"group"`
	}
	if err := json.Unmarshal(data, &queryResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if queryResult.Group.ID != groupID {
		t.Errorf("queried group id=%q, want %q", queryResult.Group.ID, groupID)
	}

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`,
			map[string]any{"id": groupID})
	})
}

func TestGroups_AddDeviceMember(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Device Members Group" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group: %v", err)
	}
	var createResult struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	if err := json.Unmarshal(data, &createResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	groupID := createResult.CreateGroup.ID
	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`,
			map[string]any{"id": groupID})
	})

	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id memberType memberId }
	}`, map[string]any{
		"input": map[string]any{
			"groupId":    groupID,
			"memberType": "device",
			"memberId":   deviceID,
		},
	})
	if err != nil {
		t.Fatalf("add member: %v", err)
	}

	data, err = graphqlQuery(`query($id: ID!) {
		group(id: $id) {
			members { id memberType memberId }
			resolvedDevices { id name }
		}
	}`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("query group: %v", err)
	}

	var groupResult struct {
		Group struct {
			Members []struct {
				MemberType string `json:"memberType"`
				MemberID   string `json:"memberId"`
			} `json:"members"`
			ResolvedDevices []struct {
				ID   string
				Name string
			} `json:"resolvedDevices"`
		} `json:"group"`
	}
	if err := json.Unmarshal(data, &groupResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if len(groupResult.Group.Members) != 1 {
		t.Fatalf("expected 1 member, got %d", len(groupResult.Group.Members))
	}
	if groupResult.Group.Members[0].MemberID != deviceID {
		t.Errorf("member id=%q, want %q", groupResult.Group.Members[0].MemberID, deviceID)
	}
	if len(groupResult.Group.ResolvedDevices) != 1 {
		t.Fatalf("expected 1 resolved device, got %d", len(groupResult.Group.ResolvedDevices))
	}
}

func TestGroups_NestedGroupsAndResolvedDevices(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Parent" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create parent: %v", err)
	}
	var r1 struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &r1)
	parentID := r1.CreateGroup.ID

	data, err = graphqlMutation(`mutation { createGroup(input: { name: "Child" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create child: %v", err)
	}
	var r2 struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &r2)
	childID := r2.CreateGroup.ID

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": parentID})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": childID})
	})

	deviceID, err := queryDeviceIDByName("Kitchen Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) { addGroupMember(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"groupId": childID, "memberType": "device", "memberId": deviceID}})
	if err != nil {
		t.Fatalf("add device to child: %v", err)
	}

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) { addGroupMember(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"groupId": parentID, "memberType": "group", "memberId": childID}})
	if err != nil {
		t.Fatalf("add child to parent: %v", err)
	}

	data, err = graphqlQuery(`query($id: ID!) {
		group(id: $id) { resolvedDevices { id } }
	}`, map[string]any{"id": parentID})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	var resolved struct {
		Group struct{ ResolvedDevices []struct{ ID string } } `json:"group"`
	}
	if err := json.Unmarshal(data, &resolved); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(resolved.Group.ResolvedDevices) != 1 {
		t.Fatalf("expected 1 resolved device, got %d", len(resolved.Group.ResolvedDevices))
	}
	if resolved.Group.ResolvedDevices[0].ID != deviceID {
		t.Errorf("resolved device id=%q, want %q", resolved.Group.ResolvedDevices[0].ID, deviceID)
	}
}

func TestGroups_CircularDependencyRejection(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Group A" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create A: %v", err)
	}
	var ra struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &ra)
	aID := ra.CreateGroup.ID

	data, err = graphqlMutation(`mutation { createGroup(input: { name: "Group B" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create B: %v", err)
	}
	var rb struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &rb)
	bID := rb.CreateGroup.ID

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": aID})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": bID})
	})

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) { addGroupMember(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"groupId": aID, "memberType": "group", "memberId": bID}})
	if err != nil {
		t.Fatalf("add B to A: %v", err)
	}

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) { addGroupMember(input: $input) { id } }`,
		map[string]any{"input": map[string]any{"groupId": bID, "memberType": "group", "memberId": aID}})
	if err == nil {
		t.Fatal("expected circular dependency error, got nil")
	}
}

func TestGroups_DeleteCascade(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Delete Me" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	var r struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data, &r)
	groupID := r.CreateGroup.ID

	data, err = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("delete: %v", err)
	}

	data, err = graphqlQuery(`query($id: ID!) { group(id: $id) { id } }`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	var queryResult struct {
		Group *struct{ ID string } `json:"group"`
	}
	if err := json.Unmarshal(data, &queryResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if queryResult.Group != nil {
		t.Error("expected group to be nil after deletion")
	}
}
