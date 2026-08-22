package store

import (
	"context"
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestSyncProviderGroupsLifecycle(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()
	if _, err := s.CreateGroup(ctx, CreateGroupParams{ID: "hive-group", Name: "Hive group"}); err != nil {
		t.Fatalf("create Hive group: %v", err)
	}

	first := device.ProviderGroupsSnapshot{
		Provider: GroupProviderZigbee2MQTT,
		Groups: []device.ProviderGroup{{
			ProviderGroupID: "7",
			Name:            "Hall",
			Members: []device.ProviderGroupMember{
				{DeviceID: "0xaaa", Endpoint: 1},
				{DeviceID: "0xaaa", Endpoint: 2},
				{DeviceID: "0xaaa", Endpoint: 2},
				{DeviceID: "0xunknown", Endpoint: 1},
			},
		}},
	}
	changed, err := s.SyncProviderGroups(ctx, first)
	if err != nil {
		t.Fatalf("first sync: %v", err)
	}
	groupID := ProviderGroupID(GroupProviderZigbee2MQTT, "7")
	if !reflect.DeepEqual(changed, []string{groupID}) {
		t.Fatalf("first changed IDs = %v", changed)
	}
	g, err := s.GetGroup(ctx, groupID)
	if err != nil {
		t.Fatalf("get provider group: %v", err)
	}
	if g.Provider != GroupProviderZigbee2MQTT || g.ProviderGroupID == nil || *g.ProviderGroupID != "7" || g.Removed {
		t.Fatalf("provider group metadata = %+v", g)
	}
	members, err := s.ListGroupMembers(ctx, groupID)
	if err != nil {
		t.Fatalf("list provider members: %v", err)
	}
	if len(members) != 3 {
		t.Fatalf("members = %d, want 3", len(members))
	}
	if members[0].ProviderEndpoint == nil {
		t.Fatal("provider endpoint is nil")
	}

	icon := "sparkles"
	if _, err := s.UpdateGroup(ctx, UpdateGroupParams{
		ID:      groupID,
		Name:    g.Name,
		SetIcon: true,
		Icon:    &icon,
		SetTags: true,
		Tags:    []device.GroupTag{device.GroupTagLight},
	}); err != nil {
		t.Fatalf("set Hive-owned fields: %v", err)
	}

	second := device.ProviderGroupsSnapshot{
		Provider: GroupProviderZigbee2MQTT,
		Groups: []device.ProviderGroup{{
			ProviderGroupID: "7",
			Name:            "Hall lamps",
			Members: []device.ProviderGroupMember{
				{DeviceID: "0xaaa", Endpoint: 3},
			},
		}},
	}
	changed, err = s.SyncProviderGroups(ctx, second)
	if err != nil {
		t.Fatalf("replacement sync: %v", err)
	}
	if !reflect.DeepEqual(changed, []string{groupID}) {
		t.Fatalf("replacement changed IDs = %v", changed)
	}
	g, err = s.GetGroup(ctx, groupID)
	if err != nil {
		t.Fatalf("get renamed provider group: %v", err)
	}
	if g.Name != nil || g.FriendlyName != "Hall lamps" || g.DisplayName() != "Hall lamps" || g.Icon == nil || *g.Icon != icon || !reflect.DeepEqual(g.Tags, []device.GroupTag{device.GroupTagLight}) {
		t.Fatalf("renamed provider group = %+v", g)
	}
	members, err = s.ListGroupMembers(ctx, groupID)
	if err != nil || len(members) != 1 || members[0].ProviderEndpoint == nil || *members[0].ProviderEndpoint != 3 {
		t.Fatalf("replacement members = %+v, err=%v", members, err)
	}

	changed, err = s.SyncProviderGroups(ctx, second)
	if err != nil {
		t.Fatalf("idempotent sync: %v", err)
	}
	if len(changed) != 0 {
		t.Fatalf("idempotent changed IDs = %v", changed)
	}

	changed, err = s.SyncProviderGroups(ctx, device.ProviderGroupsSnapshot{Provider: GroupProviderZigbee2MQTT})
	if err != nil {
		t.Fatalf("removal sync: %v", err)
	}
	if !reflect.DeepEqual(changed, []string{groupID}) {
		t.Fatalf("removal changed IDs = %v", changed)
	}
	if groups, err := s.ListGroups(ctx); err != nil {
		t.Fatalf("list groups after removal: %v", err)
	} else if len(groups) != 1 || groups[0].ID != "hive-group" {
		t.Fatalf("visible groups after removal = %+v", groups)
	}
	g, err = s.GetGroup(ctx, groupID)
	if err != nil || !g.Removed {
		t.Fatalf("removed group = %+v, err=%v", g, err)
	}
	if resolved := s.ResolveTargetDeviceIDs(ctx, device.TargetGroup, groupID); len(resolved) != 0 {
		t.Fatalf("removed group resolved devices = %v", resolved)
	}
	if members, err = s.ListGroupMembers(ctx, groupID); err != nil || len(members) != 1 {
		t.Fatalf("retained removed memberships = %+v, err=%v", members, err)
	}

	changed, err = s.SyncProviderGroups(ctx, second)
	if err != nil {
		t.Fatalf("reappearance sync: %v", err)
	}
	if !reflect.DeepEqual(changed, []string{groupID}) {
		t.Fatalf("reappearance changed IDs = %v", changed)
	}
	g, err = s.GetGroup(ctx, groupID)
	if err != nil || g.Removed || g.Icon == nil || *g.Icon != icon || !reflect.DeepEqual(g.Tags, []device.GroupTag{device.GroupTagLight}) {
		t.Fatalf("reappeared group = %+v, err=%v", g, err)
	}
	if resolved := s.ResolveTargetDeviceIDs(ctx, device.TargetGroup, groupID); !reflect.DeepEqual(resolved, []device.DeviceID{"0xaaa"}) {
		t.Fatalf("reappeared group resolved devices = %v", resolved)
	}
}
