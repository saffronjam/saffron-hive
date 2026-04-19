package device

import "context"

// TargetType identifies what kind of entity a target refers to.
type TargetType string

const (
	TargetDevice TargetType = "device"
	TargetGroup  TargetType = "group"
	TargetRoom   TargetType = "room"
)

// TargetResolver resolves a target (device, group, or room) to a flat list of device IDs.
type TargetResolver interface {
	ResolveTargetDeviceIDs(ctx context.Context, targetType TargetType, targetID string) []DeviceID
}
