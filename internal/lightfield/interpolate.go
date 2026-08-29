package lightfield

import (
	"fmt"
	"math"
)

// SampleSpatial samples a validated field at a normalized point without
// temporal motion.
func SampleSpatial(field Field, point Point) (Sample, error) {
	if err := field.Validate(); err != nil {
		return Sample{}, err
	}
	if err := point.validate(); err != nil {
		return Sample{}, err
	}
	return sampleSpatial(field, point), nil
}

func sampleSpatial(field Field, point Point) Sample {
	x := point.X * float64(field.Width-1)
	y := point.Y * float64(field.Height-1)
	x0 := min(int(math.Floor(x)), field.Width-1)
	y0 := min(int(math.Floor(y)), field.Height-1)
	x1 := min(x0+1, field.Width-1)
	y1 := min(y0+1, field.Height-1)
	tx := smoothstep(x - float64(x0))
	ty := smoothstep(y - float64(y0))

	top := mixSample(field.Samples[y0*field.Width+x0], field.Samples[y0*field.Width+x1], tx)
	bottom := mixSample(field.Samples[y1*field.Width+x0], field.Samples[y1*field.Width+x1], tx)
	return mixSample(top, bottom, ty)
}

func mixSample(left, right Sample, amount float64) Sample {
	amount = clamp(amount, 0, 1)
	if left.Color != nil && right.Color != nil {
		value := mixColor(*left.Color, *right.Color, amount)
		return Sample{Color: &value}
	}
	if left.White != nil && right.White != nil {
		value := WhiteSample{
			Brightness: mix(left.White.Brightness, right.White.Brightness, amount),
			Mireds:     mix(left.White.Mireds, right.White.Mireds, amount),
		}
		return Sample{White: &value}
	}
	panic(fmt.Sprintf("cannot interpolate mismatched samples: %#v and %#v", left, right))
}

func mixColor(left, right ColorSample, amount float64) ColorSample {
	hue := left.Hue
	switch {
	case left.Chroma < 1e-8 && right.Chroma >= 1e-8:
		hue = right.Hue
	case right.Chroma < 1e-8:
		hue = left.Hue
	default:
		delta := math.Mod(right.Hue-left.Hue+540, 360) - 180
		hue = math.Mod(left.Hue+amount*delta+360, 360)
	}
	return ColorSample{
		Lightness: mix(left.Lightness, right.Lightness, amount),
		Chroma:    mix(left.Chroma, right.Chroma, amount),
		Hue:       hue,
	}
}

func smoothstep(value float64) float64 {
	value = clamp(value, 0, 1)
	return value * value * (3 - 2*value)
}

func mix(left, right, amount float64) float64 {
	return left + (right-left)*amount
}
