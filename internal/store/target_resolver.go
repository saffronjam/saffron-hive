package store

import (
	"context"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// ResolveTargetDeviceIDs resolves a target (device, group, or room) to a flat
// list of device IDs. Groups are expanded recursively, including any rooms
// nested inside groups.
func (s *SQLiteStore) ResolveTargetDeviceIDs(ctx context.Context, targetType device.TargetType, targetID string) []device.DeviceID {
	switch targetType {
	case device.TargetRoom:
		return s.resolveRoomDeviceIDs(ctx, targetID)
	case device.TargetGroup:
		seen := make(map[string]bool)
		return s.collectGroupDeviceIDs(ctx, targetID, seen)
	default:
		return []device.DeviceID{device.DeviceID(targetID)}
	}
}

func (s *SQLiteStore) resolveRoomDeviceIDs(ctx context.Context, roomID string) []device.DeviceID {
	devices, err := s.ListRoomDevices(ctx, roomID)
	if err != nil {
		return nil
	}
	result := make([]device.DeviceID, len(devices))
	for i, d := range devices {
		result[i] = device.DeviceID(d.DeviceID)
	}
	return result
}

func (s *SQLiteStore) collectGroupDeviceIDs(ctx context.Context, groupID string, seen map[string]bool) []device.DeviceID {
	if seen[groupID] {
		return nil
	}
	seen[groupID] = true

	members, err := s.ListGroupMembers(ctx, groupID)
	if err != nil {
		return nil
	}

	var result []device.DeviceID
	for _, m := range members {
		switch m.MemberType {
		case device.GroupMemberDevice:
			result = append(result, device.DeviceID(m.MemberID))
		case device.GroupMemberGroup:
			result = append(result, s.collectGroupDeviceIDs(ctx, m.MemberID, seen)...)
		case device.GroupMemberRoom:
			result = append(result, s.resolveRoomDeviceIDs(ctx, m.MemberID)...)
		}
	}
	return result
}
