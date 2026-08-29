package lightfield

import "math"

// RGB is a normalized sRGB colour.
type RGB struct {
	R float64
	G float64
	B float64
}

type oklab struct {
	l float64
	a float64
	b float64
}

// OKLCHToSRGB converts a perceptual sample into sRGB and reduces chroma until
// the result fits the sRGB gamut. Lightness and hue remain unchanged.
func OKLCHToSRGB(sample ColorSample) RGB {
	if rgb := rawOKLCHToSRGB(sample); inGamut(rgb) {
		return rgb
	}
	low, high := 0.0, sample.Chroma
	for range 24 {
		mid := (low + high) / 2
		candidate := sample
		candidate.Chroma = mid
		if inGamut(rawOKLCHToSRGB(candidate)) {
			low = mid
		} else {
			high = mid
		}
	}
	sample.Chroma = low
	return clampRGB(rawOKLCHToSRGB(sample))
}

// SRGBToOKLCH converts a normalized sRGB colour into OKLCH.
func SRGBToOKLCH(rgb RGB) ColorSample {
	r := decodeSRGB(clamp(rgb.R, 0, 1))
	g := decodeSRGB(clamp(rgb.G, 0, 1))
	b := decodeSRGB(clamp(rgb.B, 0, 1))

	l := math.Cbrt(0.4122214708*r + 0.5363325363*g + 0.0514459929*b)
	m := math.Cbrt(0.2119034982*r + 0.6806995451*g + 0.1073969566*b)
	s := math.Cbrt(0.0883024619*r + 0.2817188376*g + 0.6299787005*b)
	lab := oklab{
		l: 0.2104542553*l + 0.793617785*m - 0.0040720468*s,
		a: 1.9779984951*l - 2.428592205*m + 0.4505937099*s,
		b: 0.0259040371*l + 0.7827717662*m - 0.808675766*s,
	}
	chroma := math.Hypot(lab.a, lab.b)
	hue := 0.0
	if chroma > 1e-12 {
		hue = math.Atan2(lab.b, lab.a) * 180 / math.Pi
		if hue < 0 {
			hue += 360
		}
	}
	return ColorSample{Lightness: clamp(lab.l, 0, 1), Chroma: min(chroma, maxChroma), Hue: hue}
}

// RGBToXY converts normalized sRGB to CIE 1931 xy coordinates.
func RGBToXY(rgb RGB) (float64, float64) {
	r := decodeSRGB(clamp(rgb.R, 0, 1))
	g := decodeSRGB(clamp(rgb.G, 0, 1))
	b := decodeSRGB(clamp(rgb.B, 0, 1))
	x := 0.4124564*r + 0.3575761*g + 0.1804375*b
	y := 0.2126729*r + 0.7151522*g + 0.072175*b
	z := 0.0193339*r + 0.119192*g + 0.9503041*b
	total := x + y + z
	if total <= 1e-12 {
		return 0.3127, 0.329
	}
	return x / total, y / total
}

// MiredsToSRGB approximates the black-body locus for a white temperature.
func MiredsToSRGB(mireds float64) RGB {
	temperature := clamp(1_000_000/mireds, 1000, 40000) / 100
	var r, g, b float64
	if temperature <= 66 {
		r = 255
		g = 99.4708025861*math.Log(temperature) - 161.1195681661
		if temperature <= 19 {
			b = 0
		} else {
			b = 138.5177312231*math.Log(temperature-10) - 305.0447927307
		}
	} else {
		r = 329.698727446 * math.Pow(temperature-60, -0.1332047592)
		g = 288.1221695283 * math.Pow(temperature-60, -0.0755148492)
		b = 255
	}
	return RGB{R: clamp(r/255, 0, 1), G: clamp(g/255, 0, 1), B: clamp(b/255, 0, 1)}
}

func rawOKLCHToSRGB(sample ColorSample) RGB {
	hue := sample.Hue * math.Pi / 180
	lab := oklab{
		l: sample.Lightness,
		a: sample.Chroma * math.Cos(hue),
		b: sample.Chroma * math.Sin(hue),
	}
	l := lab.l + 0.3963377774*lab.a + 0.2158037573*lab.b
	m := lab.l - 0.1055613458*lab.a - 0.0638541728*lab.b
	s := lab.l - 0.0894841775*lab.a - 1.291485548*lab.b
	l, m, s = l*l*l, m*m*m, s*s*s
	return RGB{
		R: encodeSRGB(4.0767416621*l - 3.3077115913*m + 0.2309699292*s),
		G: encodeSRGB(-1.2684380046*l + 2.6097574011*m - 0.3413193965*s),
		B: encodeSRGB(-0.0041960863*l - 0.7034186147*m + 1.707614701*s),
	}
}

func encodeSRGB(value float64) float64 {
	if value <= 0.0031308 {
		return 12.92 * value
	}
	return 1.055*math.Pow(value, 1/2.4) - 0.055
}

func decodeSRGB(value float64) float64 {
	if value <= 0.04045 {
		return value / 12.92
	}
	return math.Pow((value+0.055)/1.055, 2.4)
}

func inGamut(rgb RGB) bool {
	return rgb.R >= 0 && rgb.R <= 1 && rgb.G >= 0 && rgb.G <= 1 && rgb.B >= 0 && rgb.B <= 1
}

func clampRGB(rgb RGB) RGB {
	return RGB{R: clamp(rgb.R, 0, 1), G: clamp(rgb.G, 0, 1), B: clamp(rgb.B, 0, 1)}
}

func colorDistance(left, right RGB) float64 {
	a := SRGBToOKLCH(left)
	b := SRGBToOKLCH(right)
	ah := a.Hue * math.Pi / 180
	bh := b.Hue * math.Pi / 180
	alab := oklab{l: a.Lightness, a: a.Chroma * math.Cos(ah), b: a.Chroma * math.Sin(ah)}
	blab := oklab{l: b.Lightness, a: b.Chroma * math.Cos(bh), b: b.Chroma * math.Sin(bh)}
	return math.Sqrt(math.Pow(alab.l-blab.l, 2) + math.Pow(alab.a-blab.a, 2) + math.Pow(alab.b-blab.b, 2))
}
