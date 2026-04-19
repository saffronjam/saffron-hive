package logging

import (
	"log/slog"
	"testing"
)

func TestParseLevel(t *testing.T) {
	cases := []struct {
		in        string
		wantLevel slog.Level
		wantOk    bool
	}{
		{"DEBUG", slog.LevelDebug, true},
		{"debug", slog.LevelDebug, true},
		{"INFO", slog.LevelInfo, true},
		{"WARN", slog.LevelWarn, true},
		{"ERROR", slog.LevelError, true},
		{"", slog.LevelInfo, false},
		{"verbose", slog.LevelInfo, false},
	}
	for _, c := range cases {
		t.Run(c.in, func(t *testing.T) {
			gotLevel, gotOk := ParseLevel(c.in)
			if gotLevel != c.wantLevel || gotOk != c.wantOk {
				t.Errorf("ParseLevel(%q) = (%v, %v); want (%v, %v)", c.in, gotLevel, gotOk, c.wantLevel, c.wantOk)
			}
		})
	}
}
