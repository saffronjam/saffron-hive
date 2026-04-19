package logging

import (
	"context"
	"fmt"
	"log/slog"
	"os"
)

// TeeHandler is an slog.Handler that writes to both stderr and a ring buffer.
type TeeHandler struct {
	inner  slog.Handler
	buffer *Buffer
	attrs  []slog.Attr
	group  string
}

// Setup configures the global slog logger with a TeeHandler that writes to
// stderr and captures entries into a ring buffer. It returns the LevelVar
// (for runtime level changes) and the Buffer (for queries and subscriptions).
func Setup(level slog.Level) (*slog.LevelVar, *Buffer) {
	levelVar := &slog.LevelVar{}
	levelVar.Set(level)

	buf := NewBuffer()

	inner := slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{
		Level: levelVar,
	})

	handler := &TeeHandler{
		inner:  inner,
		buffer: buf,
	}

	slog.SetDefault(slog.New(handler))
	return levelVar, buf
}

// Enabled reports whether the handler handles records at the given level.
func (h *TeeHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.inner.Enabled(ctx, level)
}

// Handle processes the log record: writes to stderr via the inner handler
// and captures the entry into the ring buffer.
func (h *TeeHandler) Handle(ctx context.Context, r slog.Record) error {
	attrs := make(map[string]string, r.NumAttrs()+len(h.attrs))

	if h.group != "" {
		for _, a := range h.attrs {
			attrs[h.group+"."+a.Key] = a.Value.String()
		}
	} else {
		for _, a := range h.attrs {
			attrs[a.Key] = a.Value.String()
		}
	}

	r.Attrs(func(a slog.Attr) bool {
		key := a.Key
		if h.group != "" {
			key = h.group + "." + key
		}
		attrs[key] = fmt.Sprintf("%v", a.Value.Any())
		return true
	})

	h.buffer.Write(Entry{
		Timestamp: r.Time,
		Level:     r.Level,
		Message:   r.Message,
		Attrs:     attrs,
	})

	return h.inner.Handle(ctx, r)
}

// WithAttrs returns a new handler with the given attributes pre-attached.
func (h *TeeHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	newAttrs := make([]slog.Attr, len(h.attrs)+len(attrs))
	copy(newAttrs, h.attrs)
	copy(newAttrs[len(h.attrs):], attrs)
	return &TeeHandler{
		inner:  h.inner.WithAttrs(attrs),
		buffer: h.buffer,
		attrs:  newAttrs,
		group:  h.group,
	}
}

// WithGroup returns a new handler with the given group name.
func (h *TeeHandler) WithGroup(name string) slog.Handler {
	g := name
	if h.group != "" {
		g = h.group + "." + name
	}
	return &TeeHandler{
		inner:  h.inner.WithGroup(name),
		buffer: h.buffer,
		attrs:  h.attrs,
		group:  g,
	}
}
