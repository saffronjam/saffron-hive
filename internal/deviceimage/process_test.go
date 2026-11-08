package deviceimage

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/jpeg"
	"image/png"
	"testing"
)

func encodedPNG(t *testing.T, source image.Image) []byte {
	t.Helper()
	var buffer bytes.Buffer
	if err := png.Encode(&buffer, source); err != nil {
		t.Fatal(err)
	}
	return buffer.Bytes()
}

func TestTrimPaddingKeepsProductAndVisibleShadow(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 100, 100))
	draw.Draw(source, image.Rect(30, 25, 70, 75), image.NewUniform(color.NRGBA{R: 180, G: 180, B: 180, A: 255}), image.Point{}, draw.Src)
	draw.Draw(source, image.Rect(28, 72, 72, 78), image.NewUniform(color.NRGBA{A: 12}), image.Point{}, draw.Over)
	result, mime, format, err := trimPadding(encodedPNG(t, source))
	if err != nil || mime != "image/png" || format != "png" {
		t.Fatalf("result: %s %s %v", mime, format, err)
	}
	cropped, _, err := image.Decode(bytes.NewReader(result))
	if err != nil {
		t.Fatal(err)
	}
	if cropped.Bounds().Size() != image.Pt(48, 57) {
		t.Fatalf("crop bounds = %v", cropped.Bounds())
	}
	_, _, _, shadow := cropped.At(2, 53).RGBA()
	if shadow == 0 {
		t.Fatal("visible shadow was clipped")
	}
	_, _, _, margin := cropped.At(0, 0).RGBA()
	if margin != 0 {
		t.Fatal("safety margin was not retained")
	}
}

func TestTrimPaddingRecognizesUniformOpaqueBorder(t *testing.T) {
	source := image.NewNRGBA(image.Rect(0, 0, 80, 80))
	draw.Draw(source, source.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
	draw.Draw(source, image.Rect(20, 10, 60, 70), image.NewUniform(color.Black), image.Point{}, draw.Src)
	for _, format := range []string{"png", "jpeg"} {
		t.Run(format, func(t *testing.T) {
			var input bytes.Buffer
			if format == "png" {
				_ = png.Encode(&input, source)
			} else {
				_ = jpeg.Encode(&input, source, &jpeg.Options{Quality: 100})
			}
			result, _, _, err := trimPadding(input.Bytes())
			if err != nil {
				t.Fatal(err)
			}
			config, _, err := image.DecodeConfig(bytes.NewReader(result))
			if err != nil {
				t.Fatal(err)
			}
			if config.Width >= 80 || config.Height >= 80 || config.Width < 40 || config.Height < 60 {
				t.Fatalf("crop = %dx%d", config.Width, config.Height)
			}
		})
	}
}

func TestTrimPaddingPreservesAmbiguousAndEmptyImages(t *testing.T) {
	for _, fill := range []color.Color{color.Transparent, color.White} {
		source := image.NewNRGBA(image.Rect(0, 0, 50, 60))
		draw.Draw(source, source.Bounds(), image.NewUniform(fill), image.Point{}, draw.Src)
		input := encodedPNG(t, source)
		output, _, _, err := trimPadding(input)
		if err != nil || !bytes.Equal(input, output) {
			t.Fatal("empty or uniform image was changed")
		}
	}
	source := image.NewNRGBA(image.Rect(0, 0, 50, 50))
	draw.Draw(source, source.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
	source.Set(0, 0, color.Black)
	input := encodedPNG(t, source)
	output, _, _, err := trimPadding(input)
	if err != nil || !bytes.Equal(input, output) {
		t.Fatal("image with conflicting edge colors was changed")
	}
}

func TestImageProcessingVersionInvalidatesRawSourceFingerprint(t *testing.T) {
	source := ResolveSource([]string{"https://example.com/product.png"})
	original := hashString("url\x00https://example.com/product.png\n")
	if source.Fingerprint == original {
		t.Fatal("processed and unprocessed cache entries share a version")
	}
}

func TestTrimPaddingKeepsJPEGOrientationMetadata(t *testing.T) {
	source := image.NewRGBA(image.Rect(0, 0, 40, 60))
	draw.Draw(source, source.Bounds(), image.NewUniform(color.White), image.Point{}, draw.Src)
	draw.Draw(source, image.Rect(10, 10, 30, 50), image.NewUniform(color.Black), image.Point{}, draw.Src)
	var encoded bytes.Buffer
	if err := jpeg.Encode(&encoded, source, nil); err != nil {
		t.Fatal(err)
	}
	original := encoded.Bytes()
	metadata := []byte{0xff, 0xe1, 0, 8, 'E', 'x', 'i', 'f', 0, 0}
	withMetadata := append(append(append([]byte{}, original[:2]...), metadata...), original[2:]...)
	result, _, _, err := trimPadding(withMetadata)
	if err != nil || !bytes.Equal(result, withMetadata) {
		t.Fatal("JPEG orientation metadata was discarded")
	}
}
