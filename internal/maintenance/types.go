// Package maintenance derives concrete physical work from device and system state.
package maintenance

import "github.com/saffronjam/saffron-hive/internal/device"

// Kind groups maintenance tasks by the work they require.
type Kind string

const (
	KindBattery  Kind = "battery"
	KindFirmware Kind = "firmware"
	KindPosture  Kind = "posture"
	KindStorage  Kind = "storage"
)

// Task is one active, actionable condition.
type Task struct {
	ID                   string
	TaskKey              string
	ConditionFingerprint string
	Kind                 Kind
	Device               *device.Device
	CurrentValue         *string
	TargetValue          *string
	Value                *float64
	Context              *string
	ActionURL            *string
}
