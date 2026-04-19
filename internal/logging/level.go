package logging

import (
	"log/slog"
	"strings"
)

// ParseLevel parses a case-insensitive log-level string ("DEBUG", "INFO",
// "WARN", "ERROR"). The second return indicates whether the input matched a
// known level; unknown inputs map to slog.LevelInfo.
func ParseLevel(s string) (slog.Level, bool) {
	switch strings.ToUpper(s) {
	case "DEBUG":
		return slog.LevelDebug, true
	case "INFO":
		return slog.LevelInfo, true
	case "WARN":
		return slog.LevelWarn, true
	case "ERROR":
		return slog.LevelError, true
	default:
		return slog.LevelInfo, false
	}
}
