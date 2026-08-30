package lightfield

import "math"

func periodicNoise(seed int64, x, y, phase float64, channel uint64) float64 {
	return periodicNoiseLimited(seed, x, y, phase, channel, 3)
}

func periodicNoiseLimited(seed int64, x, y, phase float64, channel uint64, maximumTemporalFrequency int) float64 {
	if maximumTemporalFrequency < 1 {
		return 0
	}
	value := 0.0
	weight := 1.0
	totalWeight := 0.0
	for octave := uint64(0); octave < 4; octave++ {
		h := splitmix64(uint64(seed) ^ channel*0x9e3779b97f4a7c15 ^ octave*0xbf58476d1ce4e5b9)
		frequency := float64(uint64(1) << octave)
		fx := float64(1 + h%3)
		fy := float64(1 + (h>>8)%3)
		ft := float64(min(1+int((h>>16)%3), maximumTemporalFrequency))
		offset := hashUnit(h>>24) * 2 * math.Pi
		value += math.Sin(2*math.Pi*(frequency*(fx*x+fy*y)+ft*phase)+offset) * weight
		totalWeight += weight
		weight *= 0.5
	}
	return value / totalWeight
}

func splitmix64(value uint64) uint64 {
	value += 0x9e3779b97f4a7c15
	value = (value ^ (value >> 30)) * 0xbf58476d1ce4e5b9
	value = (value ^ (value >> 27)) * 0x94d049bb133111eb
	return value ^ (value >> 31)
}

func hashUnit(value uint64) float64 {
	return float64(splitmix64(value)>>11) / float64(uint64(1)<<53)
}
