package lightfield

import (
	"image"
	"image/color"
	"reflect"
	"testing"
)

func generatedRaster(width, height int, pixel func(x, y int) RasterPixel) Raster {
	pixels := make([]RasterPixel, width*height)
	for y := range height {
		for x := range width {
			pixels[y*width+x] = pixel(x, y)
		}
	}
	return Raster{Width: width, Height: height, Pixels: pixels}
}

func TestCompilePhotoDeterminismStructureAndDomains(t *testing.T) {
	gradient := generatedRaster(48, 24, func(x, y int) RasterPixel {
		return RasterPixel{R: uint8(x * 255 / 47), G: uint8(y * 255 / 23), B: uint8((47 - x) * 255 / 47), A: 255}
	})
	first, err := CompilePhoto(gradient, DomainFullColor)
	if err != nil {
		t.Fatal(err)
	}
	second, _ := CompilePhoto(gradient, DomainFullColor)
	if !reflect.DeepEqual(first, second) {
		t.Fatal("photo compilation is nondeterministic")
	}
	if first.Width != photoGridSize || first.Height != photoGridSize || first.Domain != DomainFullColor {
		t.Fatalf("field shape = %#v", first)
	}
	if fieldColorDiversity(first) < 0.08 || maximumNeighbourDelta(first) > 0.45 {
		t.Fatalf("gradient summary diversity=%v neighbour=%v", fieldColorDiversity(first), maximumNeighbourDelta(first))
	}
	white, err := CompilePhoto(gradient, DomainWhiteAmbience)
	if err != nil {
		t.Fatal(err)
	}
	for _, sample := range white.Samples {
		if sample.White == nil || sample.Color != nil {
			t.Fatalf("white compiler emitted hue sample: %#v", sample)
		}
	}
}

func TestCompilePhotoSaliencyDarkMonochromeAndAspectRatio(t *testing.T) {
	subject := generatedRaster(40, 40, func(x, y int) RasterPixel {
		if x >= 27 && x <= 32 && y >= 8 && y <= 13 {
			return RasterPixel{R: 255, G: 20, B: 20, A: 255}
		}
		return RasterPixel{R: 145, G: 145, B: 145, A: 255}
	})
	field, err := CompilePhoto(subject, DomainFullColor)
	if err != nil {
		t.Fatal(err)
	}
	if field.Samples[1*photoGridSize+4].Color.Chroma <= field.Samples[4*photoGridSize+1].Color.Chroma+0.03 {
		t.Fatalf("salient subject was lost: subject=%v background=%v", field.Samples[10].Color.Chroma, field.Samples[25].Color.Chroma)
	}
	dark := generatedRaster(8, 8, func(_, _ int) RasterPixel { return RasterPixel{R: 8, G: 8, B: 8, A: 255} })
	darkField, _ := CompilePhoto(dark, DomainFullColor)
	if darkField.Samples[0].Color.Lightness >= 0.3 {
		t.Fatalf("dark image raised too far: %v", darkField.Samples[0].Color.Lightness)
	}
	mono := generatedRaster(8, 8, func(x, _ int) RasterPixel {
		value := uint8(x * 255 / 7)
		return RasterPixel{R: value, G: value, B: value, A: 255}
	})
	monoField, _ := CompilePhoto(mono, DomainFullColor)
	for _, sample := range monoField.Samples {
		if sample.Color.Chroma > 1e-5 {
			t.Fatalf("monochrome image gained chroma: %v", sample.Color.Chroma)
		}
	}
	for _, dimensions := range [][2]int{{1, 128}, {128, 1}} {
		extreme := generatedRaster(dimensions[0], dimensions[1], func(_, _ int) RasterPixel { return RasterPixel{R: 20, G: 100, B: 220, A: 255} })
		if _, err := CompilePhoto(extreme, DomainFullColor); err != nil {
			t.Fatalf("extreme aspect %v: %v", dimensions, err)
		}
	}
}

func TestCompositeRasterHandlesTransparency(t *testing.T) {
	input := image.NewNRGBA(image.Rect(0, 0, 1, 1))
	input.SetNRGBA(0, 0, color.NRGBA{R: 255, A: 128})
	raster, err := CompositeRaster(input, RGB{R: 1, G: 1, B: 1})
	if err != nil {
		t.Fatal(err)
	}
	pixel := raster.Pixels[0]
	if pixel.A != 255 || pixel.R < 250 || pixel.G < 120 || pixel.G > 135 || pixel.B < 120 || pixel.B > 135 {
		t.Fatalf("composited pixel = %#v", pixel)
	}
}

func fieldColorDiversity(field Field) float64 {
	maximum := 0.0
	for i, left := range field.Samples {
		for _, right := range field.Samples[i+1:] {
			maximum = max(maximum, colourSampleDistance(*left.Color, *right.Color))
		}
	}
	return maximum
}

func maximumNeighbourDelta(field Field) float64 {
	maximum := 0.0
	for y := range field.Height {
		for x := range field.Width {
			index := y*field.Width + x
			if x+1 < field.Width {
				maximum = max(maximum, colourSampleDistance(*field.Samples[index].Color, *field.Samples[index+1].Color))
			}
			if y+1 < field.Height {
				maximum = max(maximum, colourSampleDistance(*field.Samples[index].Color, *field.Samples[index+field.Width].Color))
			}
		}
	}
	return maximum
}

func FuzzRasterValidationAndPhotoCompilation(f *testing.F) {
	f.Add(2, 2, byte(20), byte(40), byte(60), byte(255))
	f.Add(-1, 9, byte(0), byte(0), byte(0), byte(0))
	f.Fuzz(func(t *testing.T, width, height int, r, g, b, a byte) {
		if width < 1 || height < 1 || width > 8 || height > 8 {
			return
		}
		raster := generatedRaster(width, height, func(_, _ int) RasterPixel { return RasterPixel{R: r, G: g, B: b, A: a} })
		_, _ = CompilePhoto(raster, DomainFullColor)
	})
}

func FuzzCompositeRaster(f *testing.F) {
	f.Add(byte(255), byte(30), byte(80), byte(128))
	f.Fuzz(func(t *testing.T, r, g, b, a byte) {
		input := image.NewNRGBA(image.Rect(0, 0, 2, 2))
		for y := range 2 {
			for x := range 2 {
				input.SetNRGBA(x, y, color.NRGBA{R: r, G: g, B: b, A: a})
			}
		}
		raster, err := CompositeRaster(input, RGB{R: 0.2, G: 0.4, B: 0.6})
		if err != nil {
			t.Fatal(err)
		}
		if _, err := CompilePhoto(raster, DomainFullColor); err != nil {
			t.Fatal(err)
		}
	})
}
