package lightfield

import (
	"errors"
	"image"
	"math"
	"strconv"
)

const (
	photoGridSize   = 6
	maxRasterPixels = 16_777_216
	maxRasterSide   = 8192
)

// RasterPixel is a non-premultiplied eight-bit sRGB pixel.
type RasterPixel struct {
	R uint8
	G uint8
	B uint8
	A uint8
}

// Raster is a bounded, orientation-normalized, row-major sRGB image.
type Raster struct {
	Width  int
	Height int
	Pixels []RasterPixel
}

// CompositeRaster converts an oriented Go image into an opaque raster using a
// caller-selected background for transparent pixels.
func CompositeRaster(source image.Image, background RGB) (Raster, error) {
	if source == nil {
		return Raster{}, errors.New("photo image is required")
	}
	bounds := source.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	if err := validateRasterShape(width, height, width*height); err != nil {
		return Raster{}, err
	}
	background = clampRGB(background)
	pixels := make([]RasterPixel, width*height)
	for y := range height {
		for x := range width {
			r16, g16, b16, a16 := source.At(bounds.Min.X+x, bounds.Min.Y+y).RGBA()
			alpha := float64(a16) / 65535
			r := float64(r16) / 65535
			g := float64(g16) / 65535
			b := float64(b16) / 65535
			if alpha > 0 {
				r /= alpha
				g /= alpha
				b /= alpha
			}
			rgb := RGB{
				R: r*alpha + background.R*(1-alpha),
				G: g*alpha + background.G*(1-alpha),
				B: b*alpha + background.B*(1-alpha),
			}
			pixels[y*width+x] = RasterPixel{
				R: uint8(math.Round(clamp(rgb.R, 0, 1) * 255)),
				G: uint8(math.Round(clamp(rgb.G, 0, 1) * 255)),
				B: uint8(math.Round(clamp(rgb.B, 0, 1) * 255)),
				A: 255,
			}
		}
	}
	return Raster{Width: width, Height: height, Pixels: pixels}, nil
}

// Validate checks raster bounds and row-major storage.
func (r Raster) Validate() error {
	if err := validateRasterShape(r.Width, r.Height, len(r.Pixels)); err != nil {
		return err
	}
	for i, pixel := range r.Pixels {
		if pixel.A != 255 {
			return errors.New("raster pixel " + strconv.Itoa(i) + " is not opacity-composited")
		}
	}
	return nil
}

// CompilePhoto reduces a bounded raster to a low-frequency canonical field.
// Saliency weights preserve broad saturated and high-contrast regions while a
// local spatial filter suppresses isolated pixel noise.
func CompilePhoto(raster Raster, domain Domain) (Field, error) {
	if err := raster.Validate(); err != nil {
		return Field{}, err
	}
	if domain != DomainFullColor && domain != DomainWhiteAmbience {
		return Field{}, errors.New("unsupported photo field domain")
	}
	accumulators := make([]photoAccumulator, photoGridSize*photoGridSize)
	for y := range raster.Height {
		for x := range raster.Width {
			rgb := smoothedRasterRGB(raster, x, y)
			colour := SRGBToOKLCH(rgb)
			contrast := localLightnessContrast(raster, x, y, colour.Lightness)
			saliency := 0.35 + 1.2*clamp(colour.Chroma/0.25, 0, 1) + 2*clamp(contrast, 0, 0.3)
			gx := normalizedIndex(x, raster.Width) * (photoGridSize - 1)
			gy := normalizedIndex(y, raster.Height) * (photoGridSize - 1)
			distributePhotoSample(accumulators, gx, gy, colour, rgb, saliency)
		}
	}
	if domain == DomainFullColor {
		samples := make([]ColorSample, len(accumulators))
		for i, accumulator := range accumulators {
			samples[i] = accumulator.colorSample()
		}
		field := NewFullColor(photoGridSize, photoGridSize, samples)
		return field, field.Validate()
	}
	samples := make([]WhiteSample, len(accumulators))
	for i, accumulator := range accumulators {
		samples[i] = accumulator.whiteSample()
	}
	field := NewWhiteAmbience(photoGridSize, photoGridSize, samples)
	return field, field.Validate()
}

type photoAccumulator struct {
	weight float64
	l      float64
	a      float64
	b      float64
	r      float64
	g      float64
	bl     float64
}

func (a *photoAccumulator) add(colour ColorSample, rgb RGB, weight float64) {
	hue := colour.Hue * math.Pi / 180
	a.weight += weight
	a.l += colour.Lightness * weight
	a.a += colour.Chroma * math.Cos(hue) * weight
	a.b += colour.Chroma * math.Sin(hue) * weight
	a.r += rgb.R * weight
	a.g += rgb.G * weight
	a.bl += rgb.B * weight
}

func (a photoAccumulator) colorSample() ColorSample {
	if a.weight == 0 {
		return ColorSample{Lightness: 0.5}
	}
	l := a.l / a.weight
	av, bv := a.a/a.weight, a.b/a.weight
	chroma := math.Hypot(av, bv)
	hue := math.Atan2(bv, av) * 180 / math.Pi
	if hue < 0 {
		hue += 360
	}
	return ColorSample{
		Lightness: clamp(0.16+0.76*l, 0.16, 0.92),
		Chroma:    clamp(chroma*1.15, 0, 0.2),
		Hue:       hue,
	}
}

func (a photoAccumulator) whiteSample() WhiteSample {
	if a.weight == 0 {
		return WhiteSample{Brightness: 0.5, Mireds: 300}
	}
	l := a.l / a.weight
	r, b := a.r/a.weight, a.bl/a.weight
	warmth := clamp((r-b+1)/2, 0, 1)
	return WhiteSample{
		Brightness: clamp(0.12+0.83*l, 0.12, 0.95),
		Mireds:     mix(170, 480, warmth),
	}
}

func distributePhotoSample(accumulators []photoAccumulator, gx, gy float64, colour ColorSample, rgb RGB, saliency float64) {
	x0, y0 := int(math.Floor(gx)), int(math.Floor(gy))
	x1, y1 := min(x0+1, photoGridSize-1), min(y0+1, photoGridSize-1)
	tx, ty := gx-float64(x0), gy-float64(y0)
	for _, contribution := range []struct {
		x, y   int
		weight float64
	}{
		{x0, y0, (1 - tx) * (1 - ty)},
		{x1, y0, tx * (1 - ty)},
		{x0, y1, (1 - tx) * ty},
		{x1, y1, tx * ty},
	} {
		if contribution.weight > 0 {
			accumulators[contribution.y*photoGridSize+contribution.x].add(colour, rgb, saliency*contribution.weight)
		}
	}
}

func smoothedRasterRGB(raster Raster, x, y int) RGB {
	var r, g, b, weight float64
	for dy := -1; dy <= 1; dy++ {
		for dx := -1; dx <= 1; dx++ {
			sx := min(max(x+dx, 0), raster.Width-1)
			sy := min(max(y+dy, 0), raster.Height-1)
			pixel := raster.Pixels[sy*raster.Width+sx]
			w := 1.0
			if dx == 0 && dy == 0 {
				w = 2
			}
			r += float64(pixel.R) / 255 * w
			g += float64(pixel.G) / 255 * w
			b += float64(pixel.B) / 255 * w
			weight += w
		}
	}
	return RGB{R: r / weight, G: g / weight, B: b / weight}
}

func localLightnessContrast(raster Raster, x, y int, center float64) float64 {
	var total float64
	for _, offset := range [][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}} {
		sx := min(max(x+offset[0], 0), raster.Width-1)
		sy := min(max(y+offset[1], 0), raster.Height-1)
		pixel := raster.Pixels[sy*raster.Width+sx]
		colour := SRGBToOKLCH(RGB{R: float64(pixel.R) / 255, G: float64(pixel.G) / 255, B: float64(pixel.B) / 255})
		total += math.Abs(center - colour.Lightness)
	}
	return total / 4
}

func normalizedIndex(index, size int) float64 {
	if size == 1 {
		return 0.5
	}
	return float64(index) / float64(size-1)
}

func validateRasterShape(width, height, count int) error {
	if width < 1 || height < 1 || width > maxRasterSide || height > maxRasterSide {
		return errors.New("photo dimensions must each be between 1 and 8192")
	}
	if width > maxRasterPixels/height || width*height > maxRasterPixels {
		return errors.New("photo has too many pixels")
	}
	if count != width*height {
		return errors.New("photo pixel count does not match its dimensions")
	}
	return nil
}
