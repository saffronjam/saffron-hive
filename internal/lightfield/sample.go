package lightfield

import "time"

const (
	maximumWarp        = 0.6
	motionSpatialScale = 0.22
)

// SampleAt samples a field at a point and absolute UTC time. Motion is
// periodic, deterministic, and independent of process start time.
func SampleAt(field Field, point Point, motion Motion, at time.Time) (Sample, error) {
	if err := field.Validate(); err != nil {
		return Sample{}, err
	}
	if err := point.validate(); err != nil {
		return Sample{}, err
	}
	if err := motion.Validate(); err != nil {
		return Sample{}, err
	}
	return sampleAtValidated(field, point, motion, at), nil
}

func sampleAtValidated(field Field, point Point, motion Motion, at time.Time) Sample {
	base := sampleSpatial(field, point)
	if motion.Movement == 0 {
		return base
	}
	phase := periodicPhase(at.UTC(), motion.Cycle)
	distance := maximumWarp * motion.Movement * (0.35 + 0.65*motion.Movement)
	warpedPoint := Point{
		X: clamp(point.X+distance*periodicNoise(motion.Seed, point.X*motionSpatialScale, point.Y*motionSpatialScale, phase, 1), 0, 1),
		Y: clamp(point.Y+distance*periodicNoise(motion.Seed, point.X*motionSpatialScale, point.Y*motionSpatialScale, phase, 2), 0, 1),
	}
	warped := sampleSpatial(field, warpedPoint)
	return mixSample(base, warped, motion.Movement)
}

func periodicPhase(at time.Time, cycle time.Duration) float64 {
	cycleNanos := cycle.Nanoseconds()
	remainder := at.UnixNano() % cycleNanos
	if remainder < 0 {
		remainder += cycleNanos
	}
	return float64(remainder) / float64(cycleNanos)
}
