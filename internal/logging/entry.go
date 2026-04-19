package logging

import (
	"log/slog"
	"time"
)

// Entry represents a single captured log record.
type Entry struct {
	Timestamp time.Time
	Level     slog.Level
	Message   string
	Attrs     map[string]string
}
