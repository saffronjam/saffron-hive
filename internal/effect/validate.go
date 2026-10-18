package effect

import (
	"fmt"
	"sort"
	"strings"
)

// Validate checks the configuration used by both saved effects and the runner.
func Validate(e Effect) error {
	switch e.Kind {
	case KindNative:
		if strings.TrimSpace(e.NativeName) == "" {
			return fmt.Errorf("native effect requires a non-empty nativeName")
		}
		if len(e.Tracks) > 0 {
			return fmt.Errorf("native effect must not have tracks")
		}
	case KindTimeline:
		if strings.TrimSpace(e.NativeName) != "" {
			return fmt.Errorf("timeline effect must not set nativeName")
		}
	default:
		return fmt.Errorf("unknown effect kind %q", e.Kind)
	}
	if e.DurationMs < 0 {
		return fmt.Errorf("durationMs must be non-negative")
	}
	if e.Kind == KindTimeline && e.Loop && e.DurationMs == 0 {
		return fmt.Errorf("loop duration must be positive")
	}
	tracks := map[string]bool{}
	clips := map[string]bool{}
	for ti, t := range e.Tracks {
		if t.ID != "" {
			if tracks[t.ID] {
				return fmt.Errorf("duplicate track ID %q", t.ID)
			}
			tracks[t.ID] = true
		}
		type interval struct{ start, end int }
		intervals := make([]interval, 0, len(t.Clips))
		for ci, c := range t.Clips {
			if c.ID != "" {
				if clips[c.ID] {
					return fmt.Errorf("duplicate clip ID %q", c.ID)
				}
				clips[c.ID] = true
			}
			raw, err := EncodeClipConfig(c.Kind, c.Config)
			if err == nil {
				_, err = DecodeClipConfig(c.Kind, raw)
			}
			if err != nil {
				return fmt.Errorf("track %d clip %d: %w", ti, ci, err)
			}
			if c.StartMs < 0 {
				return fmt.Errorf("track %d clip %d: startMs must be non-negative", ti, ci)
			}
			if c.TransitionMinMs < 0 || c.TransitionMaxMs < c.TransitionMinMs {
				return fmt.Errorf("track %d clip %d: transition bounds are invalid", ti, ci)
			}
			end := c.StartMs + c.TransitionMaxMs
			if end < c.StartMs {
				return fmt.Errorf("track %d clip %d: duration overflows", ti, ci)
			}
			if e.Loop && end > e.DurationMs {
				return fmt.Errorf("track %d clip %d extends past durationMs", ti, ci)
			}
			intervals = append(intervals, interval{c.StartMs, end})
		}
		sort.Slice(intervals, func(i, j int) bool { return intervals[i].start < intervals[j].start })
		for i := 1; i < len(intervals); i++ {
			if intervals[i].start < intervals[i-1].end {
				return fmt.Errorf("track %d clips overlap", ti)
			}
		}
	}
	return nil
}
