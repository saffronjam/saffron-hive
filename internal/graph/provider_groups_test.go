package graph

import (
	"reflect"
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestProviderGroupMutationOwnership(t *testing.T) {
	env := newTestEnv(t)
	env.store.groups["z2m"] = store.Group{
		ID:           "z2m",
		FriendlyName: "Hall lights",
		Provider:     store.GroupProviderZigbee2MQTT,
	}
	env.store.groupMembers["z2m"] = []store.GroupMember{{
		ID:         "provider-member",
		GroupID:    "z2m",
		MemberType: "device",
		MemberID:   "a",
	}}

	resp := env.query(t, `mutation { updateGroup(id: "z2m", input: {icon: "lucide:lamp", tags: [LIGHT]}) { id source } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("Hive-owned metadata update failed: %v", resp.Errors)
	}
	updated, err := env.store.GetGroup(t.Context(), "z2m")
	if err != nil {
		t.Fatalf("load updated group: %v", err)
	}
	if updated.Name != nil || updated.FriendlyName != "Hall lights" || updated.Icon == nil || *updated.Icon != "lucide:lamp" || !reflect.DeepEqual(updated.Tags, []device.GroupTag{device.GroupTagLight}) {
		t.Fatalf("updated provider group = %+v", updated)
	}

	resp = env.query(t, `mutation { updateGroup(id: "z2m", input: {name: "Upstairs"}) { id name friendlyName } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("provider display-name update failed: %v", resp.Errors)
	}
	updated, err = env.store.GetGroup(t.Context(), "z2m")
	if err != nil || updated.Name == nil || *updated.Name != "Upstairs" || updated.FriendlyName != "Hall lights" {
		t.Fatalf("renamed provider group = %+v, %v", updated, err)
	}
	resp = env.query(t, `mutation { updateGroup(id: "z2m", input: {name: null}) { id name friendlyName } }`, nil)
	if len(resp.Errors) > 0 {
		t.Fatalf("provider display-name clear failed: %v", resp.Errors)
	}

	for name, mutation := range map[string]string{
		"delete":           `mutation { deleteGroup(id: "z2m") }`,
		"add member":       `mutation { addGroupMember(input: {groupId: "z2m", memberType: "device", memberId: "a"}) { id } }`,
		"remove member":    `mutation { removeGroupMember(id: "provider-member") { id } }`,
		"batch delete":     `mutation { batchDeleteGroups(ids: ["z2m"]) }`,
		"batch add device": `mutation { batchAddGroupDevices(groupId: "z2m", deviceIds: ["a"]) { id } }`,
	} {
		resp = env.query(t, mutation, nil)
		if len(resp.Errors) == 0 {
			t.Fatalf("%s succeeded for provider group", name)
		}
		if !strings.Contains(resp.Errors[0].Message, "managed by Zigbee2MQTT") {
			t.Fatalf("%s error = %q", name, resp.Errors[0].Message)
		}
	}
}
