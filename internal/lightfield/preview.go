package lightfield

import (
	"errors"
	"math"
	"time"
)

const maxPreviewDimension = 256

// Pixel is an opaque eight-bit sRGB preview pixel.
type Pixel struct {
	R uint8
	G uint8
	B uint8
}

// Swatch is a representative preview colour and its source position.
type Swatch struct {
	Point Point
	Pixel Pixel
}

// PreviewData is image-encoder-independent preview output.
type PreviewData struct {
	Width    int
	Height   int
	Pixels   []Pixel
	Swatches []Swatch
}

// Preview samples a bounded raster and chooses deterministic, spatially
// diverse representative swatches.
func Preview(field Field, motion Motion, at time.Time, width, height, swatchCount int) (PreviewData, error) {
	if err := field.Validate(); err != nil {
		return PreviewData{}, err
	}
	if err := motion.Validate(); err != nil {
		return PreviewData{}, err
	}
	if width < 1 || height < 1 || width > maxPreviewDimension || height > maxPreviewDimension {
		return PreviewData{}, errors.New("preview dimensions must each be between 1 and 256")
	}
	if swatchCount < 0 || swatchCount > 32 {
		return PreviewData{}, errors.New("swatch count must be between 0 and 32")
	}
	result := PreviewData{Width: width, Height: height, Pixels: make([]Pixel, width*height)}
	for y := range height {
		for x := range width {
			point := rasterPoint(x, y, width, height)
			sample := sampleAtValidated(field, point, motion, at, 3)
			result.Pixels[y*width+x] = pixelForSample(sample)
		}
	}
	result.Swatches = representativeSwatches(result.Pixels, width, height, swatchCount)
	return result, nil
}

func rasterPoint(x, y, width, height int) Point {
	point := Point{X: 0.5, Y: 0.5}
	if width > 1 {
		point.X = float64(x) / float64(width-1)
	}
	if height > 1 {
		point.Y = float64(y) / float64(height-1)
	}
	return point
}

func pixelForSample(sample Sample) Pixel {
	var rgb RGB
	if sample.Color != nil {
		rgb = OKLCHToSRGB(*sample.Color)
	} else {
		rgb = scaleLinearRGB(MiredsToSRGB(sample.White.Mireds), sample.White.Brightness)
	}
	return pixelFromRGB(rgb)
}

func scaleLinearRGB(rgb RGB, amount float64) RGB {
	return RGB{
		R: encodeSRGB(decodeSRGB(rgb.R) * amount),
		G: encodeSRGB(decodeSRGB(rgb.G) * amount),
		B: encodeSRGB(decodeSRGB(rgb.B) * amount),
	}
}

func pixelFromRGB(rgb RGB) Pixel {
	return Pixel{
		R: uint8(math.Round(clamp(rgb.R, 0, 1) * 255)),
		G: uint8(math.Round(clamp(rgb.G, 0, 1) * 255)),
		B: uint8(math.Round(clamp(rgb.B, 0, 1) * 255)),
	}
}

func representativeSwatches(pixels []Pixel, width, height, count int) []Swatch {
	count = min(count, len(pixels))
	if count == 0 {
		return nil
	}
	selected := make([]int, 0, count)
	selected = append(selected, (height/2)*width+width/2)
	for len(selected) < count {
		bestIndex, bestScore := -1, -1.0
		for index, candidate := range pixels {
			if containsIndex(selected, index) {
				continue
			}
			minimum := math.MaxFloat64
			candidatePoint := rasterPoint(index%width, index/width, width, height)
			for _, chosenIndex := range selected {
				chosenPoint := rasterPoint(chosenIndex%width, chosenIndex/width, width, height)
				spatial := math.Hypot(candidatePoint.X-chosenPoint.X, candidatePoint.Y-chosenPoint.Y)
				colour := pixelDistance(candidate, pixels[chosenIndex])
				minimum = min(minimum, colour+0.18*spatial)
			}
			if minimum > bestScore {
				bestIndex, bestScore = index, minimum
			}
		}
		selected = append(selected, bestIndex)
	}
	swatches := make([]Swatch, len(selected))
	for i, index := range selected {
		swatches[i] = Swatch{
			Point: rasterPoint(index%width, index/width, width, height),
			Pixel: pixels[index],
		}
	}
	return swatches
}

func pixelDistance(left, right Pixel) float64 {
	return colorDistance(
		RGB{R: float64(left.R) / 255, G: float64(left.G) / 255, B: float64(left.B) / 255},
		RGB{R: float64(right.R) / 255, G: float64(right.G) / 255, B: float64(right.B) / 255},
	)
}

func containsIndex(indices []int, want int) bool {
	for _, index := range indices {
		if index == want {
			return true
		}
	}
	return false
}
