package lightfield

import "time"

const (
	maximumWarp                  = 0.6
	motionSpatialScale           = 0.22
	minimumSamplesPerOscillation = 4
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
	return sampleAtValidated(field, point, motion, at, 3), nil
}

// SampleAtCadence samples a field using only temporal detail that the output
// cadence can render smoothly. A cadence at or above the cycle duration holds
// the field still instead of aliasing motion into abrupt reversals.
func SampleAtCadence(field Field, point Point, motion Motion, at time.Time, cadence time.Duration) (Sample, error) {
	if err := field.Validate(); err != nil {
		return Sample{}, err
	}
	if err := point.validate(); err != nil {
		return Sample{}, err
	}
	if err := motion.Validate(); err != nil {
		return Sample{}, err
	}
	return sampleAtValidated(field, point, motion, at, maximumTemporalFrequency(motion.Cycle, cadence)), nil
}

func sampleAtValidated(field Field, point Point, motion Motion, at time.Time, maximumFrequency int) Sample {
	base := sampleSpatial(field, point)
	if motion.Movement == 0 || maximumFrequency < 1 {
		return base
	}
	phase := periodicPhase(at.UTC(), motion.Cycle)
	distance := maximumWarp * motion.Movement * (0.35 + 0.65*motion.Movement)
	warpedPoint := Point{
		X: clamp(point.X+distance*periodicNoiseLimited(motion.Seed, point.X*motionSpatialScale, point.Y*motionSpatialScale, phase, 1, maximumFrequency), 0, 1),
		Y: clamp(point.Y+distance*periodicNoiseLimited(motion.Seed, point.X*motionSpatialScale, point.Y*motionSpatialScale, phase, 2, maximumFrequency), 0, 1),
	}
	warped := sampleSpatial(field, warpedPoint)
	return mixSample(base, warped, motion.Movement)
}

func maximumTemporalFrequency(cycle, cadence time.Duration) int {
	if cadence <= 0 {
		return 3
	}
	frequency := int(cycle / (minimumSamplesPerOscillation * cadence))
	return min(3, max(0, frequency))
}

func periodicPhase(at time.Time, cycle time.Duration) float64 {
	cycleNanos := cycle.Nanoseconds()
	remainder := at.UnixNano() % cycleNanos
	if remainder < 0 {
		remainder += cycleNanos
	}
	return float64(remainder) / float64(cycleNanos)
}
