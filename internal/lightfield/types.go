// Package lightfield models a smooth lighting field over normalized space and
// continuous time. It is deterministic and independent of persistence,
// transports, and device protocols.
package lightfield

import (
	"errors"
	"fmt"
	"math"
	"time"
)

const (
	minDimension = 2
	maxDimension = 64
	maxChroma    = 0.4
	minMireds    = 100.0
	maxMireds    = 1000.0
)

// Domain selects the perceptual space represented by a field.
type Domain string

const (
	DomainFullColor     Domain = "full_color"
	DomainWhiteAmbience Domain = "white_ambience"
)

// Point is a normalized location in a field.
type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// ColorSample stores an OKLCH colour. Hue is expressed in degrees.
type ColorSample struct {
	Lightness float64 `json:"lightness"`
	Chroma    float64 `json:"chroma"`
	Hue       float64 `json:"hue"`
}

// WhiteSample stores brightness and colour temperature in reciprocal
// megakelvins (mireds).
type WhiteSample struct {
	Brightness float64 `json:"brightness"`
	Mireds     float64 `json:"mireds"`
}

// Sample contains exactly one domain-specific value.
type Sample struct {
	Color *ColorSample `json:"color,omitempty"`
	White *WhiteSample `json:"white,omitempty"`
}

// Field is a row-major regular grid.
type Field struct {
	Domain  Domain   `json:"domain"`
	Width   int      `json:"width"`
	Height  int      `json:"height"`
	Samples []Sample `json:"samples"`
}

// Motion controls deterministic temporal coordinate warping.
type Motion struct {
	Seed     int64         `json:"seed"`
	Movement float64       `json:"movement"`
	Cycle    time.Duration `json:"cycle"`
}

// NewFullColor constructs a full-colour field from row-major samples.
func NewFullColor(width, height int, samples []ColorSample) Field {
	values := make([]Sample, len(samples))
	for i := range samples {
		value := samples[i]
		values[i].Color = &value
	}
	return Field{Domain: DomainFullColor, Width: width, Height: height, Samples: values}
}

// NewWhiteAmbience constructs a white-ambience field from row-major samples.
func NewWhiteAmbience(width, height int, samples []WhiteSample) Field {
	values := make([]Sample, len(samples))
	for i := range samples {
		value := samples[i]
		values[i].White = &value
	}
	return Field{Domain: DomainWhiteAmbience, Width: width, Height: height, Samples: values}
}

// Validate checks that the field is finite, bounded, and internally
// consistent.
func (f Field) Validate() error {
	if f.Domain != DomainFullColor && f.Domain != DomainWhiteAmbience {
		return fmt.Errorf("unknown field domain %q", f.Domain)
	}
	if f.Width < minDimension || f.Height < minDimension || f.Width > maxDimension || f.Height > maxDimension {
		return fmt.Errorf("field dimensions must each be between %d and %d", minDimension, maxDimension)
	}
	if len(f.Samples) != f.Width*f.Height {
		return fmt.Errorf("field has %d samples, want %d", len(f.Samples), f.Width*f.Height)
	}
	for i, sample := range f.Samples {
		switch f.Domain {
		case DomainFullColor:
			if sample.Color == nil || sample.White != nil {
				return fmt.Errorf("sample %d does not contain exactly one full-colour value", i)
			}
			if err := sample.Color.validate(); err != nil {
				return fmt.Errorf("sample %d: %w", i, err)
			}
		case DomainWhiteAmbience:
			if sample.White == nil || sample.Color != nil {
				return fmt.Errorf("sample %d does not contain exactly one white-ambience value", i)
			}
			if err := sample.White.validate(); err != nil {
				return fmt.Errorf("sample %d: %w", i, err)
			}
		}
	}
	return nil
}

// Validate checks motion bounds. A positive cycle is required even for static
// motion so turning movement up never reveals an invalid dormant setting.
func (m Motion) Validate() error {
	if !finite(m.Movement) || m.Movement < 0 || m.Movement > 1 {
		return errors.New("movement must be finite and between 0 and 1")
	}
	if m.Cycle <= 0 {
		return errors.New("motion cycle must be positive")
	}
	return nil
}

func (p Point) validate() error {
	if !finite(p.X) || !finite(p.Y) || p.X < 0 || p.X > 1 || p.Y < 0 || p.Y > 1 {
		return errors.New("point coordinates must be finite and between 0 and 1")
	}
	return nil
}

func (s ColorSample) validate() error {
	if !finite(s.Lightness) || !finite(s.Chroma) || !finite(s.Hue) {
		return errors.New("colour channels must be finite")
	}
	if s.Lightness < 0 || s.Lightness > 1 {
		return errors.New("lightness must be between 0 and 1")
	}
	if s.Chroma < 0 || s.Chroma > maxChroma {
		return fmt.Errorf("chroma must be between 0 and %.1f", maxChroma)
	}
	if s.Hue < 0 || s.Hue >= 360 {
		return errors.New("hue must be between 0 inclusive and 360 exclusive")
	}
	return nil
}

func (s WhiteSample) validate() error {
	if !finite(s.Brightness) || !finite(s.Mireds) {
		return errors.New("white channels must be finite")
	}
	if s.Brightness < 0 || s.Brightness > 1 {
		return errors.New("brightness must be between 0 and 1")
	}
	if s.Mireds < minMireds || s.Mireds > maxMireds {
		return fmt.Errorf("mireds must be between %.0f and %.0f", minMireds, maxMireds)
	}
	return nil
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

func clamp(value, low, high float64) float64 {
	return min(max(value, low), high)
}
