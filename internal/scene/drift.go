package scene

import (
	"math"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func memberMatchesCurrent(member store.ActiveSceneMember, current *device.DeviceState) bool {
	if current == nil {
		return false
	}
	expected := member.Expected
	owned := member.Owned
	if owned.On && !equalBool(expected.On, current.On) {
		return false
	}
	if owned.Brightness && !nearInt(expected.Brightness, current.Brightness, 3) {
		return false
	}
	if owned.ColorTemp && !nearInt(expected.ColorTemp, current.ColorTemp, 3) {
		return false
	}
	if owned.Color && !nearColor(expected.Color, current.Color) {
		return false
	}
	if owned.TargetTemperature && !nearFloat(expected.TargetTemperature, current.TargetTemperature, 0.1) {
		return false
	}
	if owned.HvacMode && !equalString(expected.HvacMode, current.HvacMode) {
		return false
	}
	if owned.FanMode && !equalString(expected.FanMode, current.FanMode) {
		return false
	}
	if owned.Swing && !equalString(expected.Swing, current.Swing) {
		return false
	}
	return true
}

func memberConflictsWithChange(member store.ActiveSceneMember, change device.DeviceState) bool {
	expected := member.Expected
	owned := member.Owned
	if owned.On && change.On != nil && !equalBool(expected.On, change.On) {
		return true
	}
	if owned.Brightness && change.Brightness != nil && !nearInt(expected.Brightness, change.Brightness, 3) {
		return true
	}
	if owned.ColorTemp && change.ColorTemp != nil && !nearInt(expected.ColorTemp, change.ColorTemp, 3) {
		return true
	}
	if owned.Color && change.Color != nil && !nearColor(expected.Color, change.Color) {
		return true
	}
	if owned.TargetTemperature && change.TargetTemperature != nil && !nearFloat(expected.TargetTemperature, change.TargetTemperature, 0.1) {
		return true
	}
	if owned.HvacMode && change.HvacMode != nil && !equalString(expected.HvacMode, change.HvacMode) {
		return true
	}
	if owned.FanMode && change.FanMode != nil && !equalString(expected.FanMode, change.FanMode) {
		return true
	}
	return owned.Swing && change.Swing != nil && !equalString(expected.Swing, change.Swing)
}

func equalBool(left, right *bool) bool {
	return left != nil && right != nil && *left == *right
}

func equalString(left, right *string) bool {
	return left != nil && right != nil && *left == *right
}

func nearInt(left, right *int, tolerance int) bool {
	return left != nil && right != nil && abs(*left-*right) <= tolerance
}

func nearFloat(left, right *float64, tolerance float64) bool {
	return left != nil && right != nil && math.Abs(*left-*right) <= tolerance
}

func nearColor(left, right *device.Color) bool {
	if left == nil || right == nil {
		return false
	}
	return abs(left.R-right.R) <= 3 && abs(left.G-right.G) <= 3 && abs(left.B-right.B) <= 3
}

func abs(value int) int {
	if value < 0 {
		return -value
	}
	return value
}
