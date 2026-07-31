package store

import (
	"context"
	"sort"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// ResolveTargetDeviceIDs resolves a target (device, group, or room) to a flat
// list of device IDs. Groups and rooms are expanded recursively, walking
// through any nested rooms inside groups and groups inside rooms. The walk
// shares a single visited set keyed by "kind:id" so cycles between the two
// kinds — group→room→group→room — terminate. Each device appears at most once
// in the returned slice; the result is sorted by device ID for stable output.
//
// Disabled devices are dropped from the result. This is the resolution every
// runtime fan-out goes through (scene apply, automation actions, effect runs,
// selector expressions), so excluding them here is what keeps a disabled device
// out of all of them. The membership rows themselves are untouched, so
// re-enabling restores the device everywhere it was.
func (s *DB) ResolveTargetDeviceIDs(ctx context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	seen := map[string]bool{}
	devSeen := map[device.DeviceID]bool{}
	var out []device.DeviceID

	switch targetType {
	case device.TargetDevice:
		id := device.DeviceID(targetID)
		if !devSeen[id] {
			devSeen[id] = true
			out = append(out, id)
		}
	case device.TargetGroup:
		s.collectGroupDeviceIDs(ctx, targetID, seen, devSeen, &out)
	case device.TargetRoom:
		s.collectRoomDeviceIDs(ctx, targetID, seen, devSeen, &out)
	}

	out = s.withoutDisabled(ctx, out)
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

// withoutDisabled removes disabled devices from ids. The disabled set is read
// once per resolution rather than joined per member, because the walk visits
// each membership table separately and the disabled set is expected to be tiny.
// A read failure returns ids unchanged: the adapter command gate is the
// authoritative check, so failing open here cannot command a disabled device.
func (s *DB) withoutDisabled(ctx context.Context, ids []device.DeviceID) []device.DeviceID {
	if len(ids) == 0 {
		return ids
	}
	disabled, err := s.ListDisabledDeviceIDs(ctx)
	if err != nil || len(disabled) == 0 {
		return ids
	}
	skip := make(map[device.DeviceID]struct{}, len(disabled))
	for _, id := range disabled {
		skip[id] = struct{}{}
	}
	out := make([]device.DeviceID, 0, len(ids))
	for _, id := range ids {
		if _, ok := skip[id]; ok {
			continue
		}
		out = append(out, id)
	}
	return out
}

func (s *DB) collectRoomDeviceIDs(
	ctx context.Context,
	roomID string,
	seen map[string]bool,
	devSeen map[device.DeviceID]bool,
	out *[]device.DeviceID,
) {
	key := "room:" + roomID
	if seen[key] {
		return
	}
	seen[key] = true

	members, err := s.ListRoomMembers(ctx, roomID)
	if err != nil {
		return
	}
	for _, m := range members {
		switch m.MemberType {
		case device.RoomMemberDevice:
			id := device.DeviceID(m.MemberID)
			if !devSeen[id] {
				devSeen[id] = true
				*out = append(*out, id)
			}
		case device.RoomMemberGroup:
			s.collectGroupDeviceIDs(ctx, m.MemberID, seen, devSeen, out)
		}
	}
}

func (s *DB) collectGroupDeviceIDs(
	ctx context.Context,
	groupID string,
	seen map[string]bool,
	devSeen map[device.DeviceID]bool,
	out *[]device.DeviceID,
) {
	key := "group:" + groupID
	if seen[key] {
		return
	}
	seen[key] = true

	members, err := s.ListGroupMembers(ctx, groupID)
	if err != nil {
		return
	}
	for _, m := range members {
		switch m.MemberType {
		case device.GroupMemberDevice:
			id := device.DeviceID(m.MemberID)
			if !devSeen[id] {
				devSeen[id] = true
				*out = append(*out, id)
			}
		case device.GroupMemberGroup:
			s.collectGroupDeviceIDs(ctx, m.MemberID, seen, devSeen, out)
		case device.GroupMemberRoom:
			s.collectRoomDeviceIDs(ctx, m.MemberID, seen, devSeen, out)
		}
	}
}
