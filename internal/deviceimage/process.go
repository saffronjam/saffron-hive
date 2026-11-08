package deviceimage

import (
	"bytes"
	"image"
	"image/color"
	"image/draw"
	"image/png"
)

const imagePipelineVersion = "content-bounds-v1"

// trimPadding removes transparent or uniform outer margins while retaining a small safety margin.
func trimPadding(data []byte) ([]byte, string, string, error) {
	mime, format, err := validateImage(data)
	if err != nil {
		return nil, "", "", err
	}
	// JPEG orientation metadata must retain its relationship to the original pixel matrix.
	if format == "jpeg" && bytes.Contains(data, []byte("Exif\x00\x00")) {
		return data, mime, format, nil
	}
	source, _, err := image.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, "", "", err
	}
	bounds := artworkBounds(source)
	if bounds.Empty() || bounds == source.Bounds() {
		return data, mime, format, nil
	}
	padding := max(2, (max(bounds.Dx(), bounds.Dy())+49)/50)
	bounds = bounds.Inset(-padding).Intersect(source.Bounds())
	if bounds == source.Bounds() {
		return data, mime, format, nil
	}
	cropped := image.NewNRGBA(image.Rect(0, 0, bounds.Dx(), bounds.Dy()))
	draw.Draw(cropped, cropped.Bounds(), source, bounds.Min, draw.Src)
	var output bytes.Buffer
	if err := png.Encode(&output, cropped); err != nil {
		return nil, "", "", err
	}
	if output.Len() > maxImageBytes {
		return data, mime, format, nil
	}
	return output.Bytes(), "image/png", "png", nil
}

func artworkBounds(source image.Image) image.Rectangle {
	bounds := source.Bounds()
	foreground := func(x, y int) bool { _, _, _, a := source.At(x, y).RGBA(); return a > 8*257 }
	content := pixelBounds(bounds, foreground)
	if content.Empty() || content != bounds {
		return content
	}
	background := color.NRGBAModel.Convert(source.At(bounds.Min.X, bounds.Min.Y)).(color.NRGBA)
	if background.A < 250 {
		return bounds
	}
	matches := func(x, y int) bool {
		pixel := color.NRGBAModel.Convert(source.At(x, y)).(color.NRGBA)
		return pixel.A >= 250 && channelDistance(pixel.R, background.R) <= 6 && channelDistance(pixel.G, background.G) <= 6 && channelDistance(pixel.B, background.B) <= 6
	}
	for _, point := range []image.Point{{bounds.Max.X - 1, bounds.Min.Y}, {bounds.Min.X, bounds.Max.Y - 1}, {bounds.Max.X - 1, bounds.Max.Y - 1}} {
		if !matches(point.X, point.Y) {
			return bounds
		}
	}
	total, different := 0, 0
	edge := func(x, y int) {
		total++
		if !matches(x, y) {
			different++
		}
	}
	for x := bounds.Min.X; x < bounds.Max.X; x++ {
		edge(x, bounds.Min.Y)
		edge(x, bounds.Max.Y-1)
	}
	for y := bounds.Min.Y + 1; y < bounds.Max.Y-1; y++ {
		edge(bounds.Min.X, y)
		edge(bounds.Max.X-1, y)
	}
	if different*100 > total {
		return bounds
	}
	return pixelBounds(bounds, func(x, y int) bool { return !matches(x, y) })
}

func pixelBounds(bounds image.Rectangle, foreground func(int, int) bool) image.Rectangle {
	result := image.Rectangle{Min: bounds.Max, Max: bounds.Min}
	found := false
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			if !foreground(x, y) {
				continue
			}
			found = true
			result.Min.X = min(result.Min.X, x)
			result.Min.Y = min(result.Min.Y, y)
			result.Max.X = max(result.Max.X, x+1)
			result.Max.Y = max(result.Max.Y, y+1)
		}
	}
	if !found {
		return image.Rectangle{}
	}
	return result
}

func channelDistance(a, b uint8) int { return max(int(a), int(b)) - min(int(a), int(b)) }
