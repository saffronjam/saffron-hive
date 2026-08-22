package device

import "context"

// TargetType identifies what kind of entity a target refers to.
type TargetType string

const (
	TargetDevice TargetType = "device"
	TargetGroup  TargetType = "group"
	TargetRoom   TargetType = "room"
	// TargetExpression marks a target defined by a rule Expression rather than
	// a single device/group/room id. The resolver does not handle it; callers
	// evaluate the expression via EvaluateExpression.
	TargetExpression TargetType = "expression"
)

// TargetResolver resolves a target (device, group, or room) to a flat list of device IDs.
type TargetResolver interface {
	ResolveTargetDeviceIDs(ctx context.Context, targetType TargetType, targetID string) []DeviceID
}

// TargetCommand describes one desired operation against a structural target.
// State and NativeEffect are mutually exclusive.
type TargetCommand struct {
	TargetType   TargetType
	TargetID     string
	State        Command
	NativeEffect string
}

// TargetCommander sends state and native-effect operations to devices,
// groups, or rooms through the most suitable provider path.
type TargetCommander interface {
	CommandTarget(context.Context, TargetCommand) error
}

// ProviderGroupCommand is a provider-addressed multicast operation. Adapters
// consume it at the protocol boundary while ordinary device commands continue
// to use Command.
type ProviderGroupCommand struct {
	Provider        string
	ProviderGroupID string
	FriendlyName    string
	MemberIDs       []DeviceID
	State           Command
	NativeEffect    string
}
