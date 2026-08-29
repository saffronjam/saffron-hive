package lightfield

import (
	"math"
	"time"
)

// DeltaThresholds defines the smallest command change worth rendering.
type DeltaThresholds struct {
	Brightness int
	Mireds     int
	Color      float64
}

// DefaultDeltaThresholds suppresses changes that are ordinarily below a
// person's perceptual threshold while preserving gentle motion.
var DefaultDeltaThresholds = DeltaThresholds{
	Brightness: 2,
	Mireds:     3,
	Color:      0.012,
}

// SignificantDelta reports whether two intents differ enough to send another
// device command.
func SignificantDelta(left, right LightIntent, thresholds DeltaThresholds) bool {
	if !equalOptionalBool(left.On, right.On) {
		return true
	}
	if optionalIntDelta(left.Brightness, right.Brightness, thresholds.Brightness) {
		return true
	}
	if optionalIntDelta(left.ColorTemp, right.ColorTemp, thresholds.Mireds) {
		return true
	}
	if (left.Color == nil) != (right.Color == nil) {
		return true
	}
	if left.Color != nil {
		leftRGB := RGB{R: float64(left.Color.R) / 255, G: float64(left.Color.G) / 255, B: float64(left.Color.B) / 255}
		rightRGB := RGB{R: float64(right.Color.R) / 255, G: float64(right.Color.G) / 255, B: float64(right.Color.B) / 255}
		distance := colorDistance(leftRGB, rightRGB)
		if distance > 0 && distance >= max(0, thresholds.Color) {
			return true
		}
	}
	return false
}

// TransitionDuration derives a fade from renderer cadence and caps it at the
// next scheduled sample.
func TransitionDuration(cadence, untilNext time.Duration) time.Duration {
	if cadence <= 0 || untilNext <= 0 {
		return 0
	}
	transition := cadence * 9 / 10
	return min(transition, untilNext)
}

func equalOptionalBool(left, right *bool) bool {
	if left == nil || right == nil {
		return left == nil && right == nil
	}
	return *left == *right
}

func optionalIntDelta(left, right *int, threshold int) bool {
	if left == nil || right == nil {
		return left != nil || right != nil
	}
	delta := int(math.Abs(float64(*left - *right)))
	return delta > 0 && delta >= max(0, threshold)
}
