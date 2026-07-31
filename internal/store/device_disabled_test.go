package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func mustCreateDeviceRow(ctx context.Context, t *testing.T, s *DB, id, name string) {
	t.Helper()
	if _, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID:     device.DeviceID(id),
		Name:   name,
		Source: device.SourceZigbee2MQTT,
		Type:   device.Light,
	}); err != nil {
		t.Fatalf("create device %s: %v", id, err)
	}
}

// TestSetDeviceDisabledRoundTrip checks the flag defaults off, survives a
// round-trip through both the single-device and list projections, and shows up
// in ListDisabledDeviceIDs.
func TestSetDeviceDisabledRoundTrip(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateDeviceRow(ctx, t, s, "d-1", "Portable AC")
	mustCreateDeviceRow(ctx, t, s, "d-2", "Ceiling light")

	d, err := s.GetDevice(ctx, "d-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if d.Disabled {
		t.Fatal("newly created device should be enabled")
	}

	d, err = s.SetDeviceDisabled(ctx, "d-1", true)
	if err != nil {
		t.Fatalf("set disabled: %v", err)
	}
	if !d.Disabled {
		t.Error("SetDeviceDisabled returned an enabled device")
	}

	all, err := s.ListDevices(ctx)
	if err != nil {
		t.Fatalf("list devices: %v", err)
	}
	if len(all) != 2 {
		t.Fatalf("got %d devices, want 2 (disabled devices stay listed)", len(all))
	}
	for _, got := range all {
		wantDisabled := got.ID == "d-1"
		if got.Disabled != wantDisabled {
			t.Errorf("device %s: Disabled=%v, want %v", got.ID, got.Disabled, wantDisabled)
		}
	}

	ids, err := s.ListDisabledDeviceIDs(ctx)
	if err != nil {
		t.Fatalf("list disabled ids: %v", err)
	}
	if len(ids) != 1 || ids[0] != "d-1" {
		t.Errorf("got disabled ids %v, want [d-1]", ids)
	}

	if _, err := s.SetDeviceDisabled(ctx, "d-1", false); err != nil {
		t.Fatalf("re-enable: %v", err)
	}
	ids, err = s.ListDisabledDeviceIDs(ctx)
	if err != nil {
		t.Fatalf("list disabled ids after re-enable: %v", err)
	}
	if len(ids) != 0 {
		t.Errorf("got disabled ids %v after re-enable, want none", ids)
	}
}

// TestDeviceRemovalKeepsDisabled protects the reason the flag has its own
// setter: UpdateDevice is a full-row overwrite that the removal path calls with
// an otherwise zero-value struct, so naming disabled there would silently
// re-enable a device the moment its adapter dropped it.
func TestDeviceRemovalKeepsDisabled(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateDeviceRow(ctx, t, s, "d-1", "Portable AC")
	if _, err := s.SetDeviceDisabled(ctx, "d-1", true); err != nil {
		t.Fatalf("set disabled: %v", err)
	}

	if _, err := s.UpdateDevice(ctx, UpdateDeviceParams{ID: "d-1", Removed: true}); err != nil {
		t.Fatalf("mark removed: %v", err)
	}

	d, err := s.GetDevice(ctx, "d-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if !d.Removed {
		t.Error("device should be marked removed")
	}
	if !d.Disabled {
		t.Error("removal re-enabled a disabled device")
	}
}

// TestDeviceUpsertKeepsDisabled covers the adapter re-sync path: rediscovery
// must not clear a user's disable.
func TestDeviceUpsertKeepsDisabled(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateDeviceRow(ctx, t, s, "d-1", "Portable AC")
	if _, err := s.SetDeviceDisabled(ctx, "d-1", true); err != nil {
		t.Fatalf("set disabled: %v", err)
	}

	if err := s.UpsertDevice(ctx, CreateDeviceParams{
		ID:     "d-1",
		Name:   "Portable AC",
		Source: device.SourceZigbee2MQTT,
		Type:   device.Climate,
	}); err != nil {
		t.Fatalf("upsert device: %v", err)
	}

	d, err := s.GetDevice(ctx, "d-1")
	if err != nil {
		t.Fatalf("get device: %v", err)
	}
	if !d.Disabled {
		t.Error("adapter re-sync re-enabled a disabled device")
	}
	if d.Type != device.Climate {
		t.Errorf("adapter-owned type not updated: got %q", d.Type)
	}
}

// TestResolveTargetDeviceIDsSkipsDisabled is the load-bearing guard for the
// whole feature: every runtime fan-out (scene apply, automation actions, effect
// runs, selector expressions) resolves through here, so a disabled device
// dropping out of this result is what keeps it out of all of them. Membership
// rows are untouched, so re-enabling restores it.
func TestResolveTargetDeviceIDsSkipsDisabled(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	mustCreateDeviceRow(ctx, t, s, "d-1", "Ceiling light")
	mustCreateDeviceRow(ctx, t, s, "d-2", "Portable AC")
	mustCreateRoom(ctx, t, s, "r-1", "Bedroom")
	mustCreateGroup(ctx, t, s, "g-1", "Bedroom lights")
	mustAddRoomMember(ctx, t, s, "r-1", device.RoomMemberGroup, "g-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-1")
	mustAddGroupMember(ctx, t, s, "g-1", device.GroupMemberDevice, "d-2")

	if got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1"); !sliceEqual(got, []device.DeviceID{"d-1", "d-2"}) {
		t.Fatalf("baseline room resolution: got %v, want [d-1 d-2]", got)
	}

	if _, err := s.SetDeviceDisabled(ctx, "d-2", true); err != nil {
		t.Fatalf("set disabled: %v", err)
	}

	if got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1"); !sliceEqual(got, []device.DeviceID{"d-1"}) {
		t.Errorf("room resolution: got %v, want [d-1]", got)
	}
	if got := s.ResolveTargetDeviceIDs(ctx, device.TargetGroup, "g-1"); !sliceEqual(got, []device.DeviceID{"d-1"}) {
		t.Errorf("group resolution: got %v, want [d-1]", got)
	}
	if got := s.ResolveTargetDeviceIDs(ctx, device.TargetDevice, "d-2"); len(got) != 0 {
		t.Errorf("direct device resolution: got %v, want none", got)
	}

	if _, err := s.SetDeviceDisabled(ctx, "d-2", false); err != nil {
		t.Fatalf("re-enable: %v", err)
	}
	if got := s.ResolveTargetDeviceIDs(ctx, device.TargetRoom, "r-1"); !sliceEqual(got, []device.DeviceID{"d-1", "d-2"}) {
		t.Errorf("after re-enable: got %v, want [d-1 d-2]", got)
	}
}
