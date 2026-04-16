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

func TestGroups_QueryAll(t *testing.T) {
	data1, err := graphqlMutation(`mutation { createGroup(input: { name: "QueryAll Group A" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group A: %v", err)
	}
	var ra struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data1, &ra)
	groupAID := ra.CreateGroup.ID

	data2, err := graphqlMutation(`mutation { createGroup(input: { name: "QueryAll Group B" }) { id } }`, nil)
	if err != nil {
		t.Fatalf("create group B: %v", err)
	}
	var rb struct {
		CreateGroup struct{ ID string } `json:"createGroup"`
	}
	_ = json.Unmarshal(data2, &rb)
	groupBID := rb.CreateGroup.ID

	t.Cleanup(func() {
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupAID})
		_, _ = graphqlMutation(`mutation($id: ID!) { deleteGroup(id: $id) }`, map[string]any{"id": groupBID})
	})

	data, err := graphqlQuery(`{ groups { id name } }`, nil)
	if err != nil {
		t.Fatalf("query groups: %v", err)
	}

	var result struct {
		Groups []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"groups"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	foundA := false
	foundB := false
	for _, g := range result.Groups {
		if g.ID == groupAID {
			foundA = true
		}
		if g.ID == groupBID {
			foundB = true
		}
	}
	if !foundA {
		t.Error("group A not found in groups query")
	}
	if !foundB {
		t.Error("group B not found in groups query")
	}
}

func TestGroups_UpdateGroup(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Before Update" }) { id } }`, nil)
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

	data, err = graphqlMutation(`mutation($id: ID!, $input: UpdateGroupInput!) {
		updateGroup(id: $id, input: $input) { id name }
	}`, map[string]any{
		"id":    groupID,
		"input": map[string]any{"name": "After Update"},
	})
	if err != nil {
		t.Fatalf("update group: %v", err)
	}

	var result struct {
		UpdateGroup struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"updateGroup"`
	}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if result.UpdateGroup.Name != "After Update" {
		t.Errorf("name=%q, want %q", result.UpdateGroup.Name, "After Update")
	}
}

func TestGroups_UpdateGroup_InvalidID(t *testing.T) {
	err := graphqlMutationExpectError(`mutation($id: ID!, $input: UpdateGroupInput!) {
		updateGroup(id: $id, input: $input) { id name }
	}`, map[string]any{
		"id":    "nonexistent-group-id",
		"input": map[string]any{"name": "Nope"},
	})
	if err != nil {
		t.Fatalf("expected GraphQL error for invalid group ID, got: %v", err)
	}
}

func TestGroups_RemoveGroupMember(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Remove Member Group" }) { id } }`, nil)
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

	deviceID, err := queryDeviceIDByName("Bedroom Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	data, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id }
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
	var memberResult struct {
		AddGroupMember struct{ ID string } `json:"addGroupMember"`
	}
	if err := json.Unmarshal(data, &memberResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	memberID := memberResult.AddGroupMember.ID

	_, err = graphqlMutation(`mutation($id: ID!) { removeGroupMember(id: $id) }`, map[string]any{"id": memberID})
	if err != nil {
		t.Fatalf("remove member: %v", err)
	}

	data, err = graphqlQuery(`query($id: ID!) {
		group(id: $id) { members { id } }
	}`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("query group: %v", err)
	}
	var groupResult struct {
		Group struct {
			Members []struct{ ID string } `json:"members"`
		} `json:"group"`
	}
	if err := json.Unmarshal(data, &groupResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if len(groupResult.Group.Members) != 0 {
		t.Errorf("expected 0 members after removal, got %d", len(groupResult.Group.Members))
	}
}

func TestGroups_DuplicateGroupMember(t *testing.T) {
	data, err := graphqlMutation(`mutation { createGroup(input: { name: "Dup Member Group" }) { id } }`, nil)
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

	deviceID, err := queryDeviceIDByName("Living Room Light")
	if err != nil {
		t.Fatalf("find device: %v", err)
	}

	addInput := map[string]any{
		"input": map[string]any{
			"groupId":    groupID,
			"memberType": "device",
			"memberId":   deviceID,
		},
	}

	_, err = graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id }
	}`, addInput)
	if err != nil {
		t.Fatalf("first add: %v", err)
	}

	_, secondErr := graphqlMutation(`mutation($input: AddGroupMemberInput!) {
		addGroupMember(input: $input) { id }
	}`, addInput)

	data, err = graphqlQuery(`query($id: ID!) {
		group(id: $id) { members { id memberId } }
	}`, map[string]any{"id": groupID})
	if err != nil {
		t.Fatalf("query group: %v", err)
	}
	var groupResult struct {
		Group struct {
			Members []struct {
				ID       string `json:"id"`
				MemberID string `json:"memberId"`
			} `json:"members"`
		} `json:"group"`
	}
	if err := json.Unmarshal(data, &groupResult); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	if secondErr != nil {
		t.Logf("duplicate add returned error (rejected): %v", secondErr)
		if len(groupResult.Group.Members) != 1 {
			t.Errorf("expected 1 member after rejected duplicate, got %d", len(groupResult.Group.Members))
		}
	} else {
		t.Logf("duplicate add succeeded — server allows duplicate members (got %d members)", len(groupResult.Group.Members))
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
