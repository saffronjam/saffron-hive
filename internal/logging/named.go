package logging

import (
	"context"
	"log/slog"
)

// Named returns a Logger tagged with a `pkg` attribute that resolves
// slog.Default() on every call. Package-level variables can use it without
// the Go-1.22 gotcha where a handler captured at package-init time gets
// pinned to the pre-Setup default and ignores later slog.SetDefault calls
// (which also filters out levels below Info and re-routes output through
// the stdlib log bridge).
func Named(pkg string) *slog.Logger {
	return slog.New(&lateHandler{pkg: pkg})
}

// lateHandler forwards every record to slog.Default().Handler() at call
// time. With/WithGroup calls are recorded and replayed against the resolved
// target so attribute/group composition survives the indirection.
type lateHandler struct {
	pkg string
	ops []op
}

type op struct {
	attrs []slog.Attr
	group string
}

func (h *lateHandler) resolved() slog.Handler {
	target := slog.Default().Handler().WithAttrs([]slog.Attr{slog.String("pkg", h.pkg)})
	for _, o := range h.ops {
		if o.group != "" {
			target = target.WithGroup(o.group)
		} else {
			target = target.WithAttrs(o.attrs)
		}
	}
	return target
}

func (h *lateHandler) Enabled(ctx context.Context, lvl slog.Level) bool {
	return slog.Default().Handler().Enabled(ctx, lvl)
}

func (h *lateHandler) Handle(ctx context.Context, r slog.Record) error {
	return h.resolved().Handle(ctx, r)
}

func (h *lateHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	ops := make([]op, len(h.ops)+1)
	copy(ops, h.ops)
	ops[len(h.ops)] = op{attrs: attrs}
	return &lateHandler{pkg: h.pkg, ops: ops}
}

func (h *lateHandler) WithGroup(name string) slog.Handler {
	ops := make([]op, len(h.ops)+1)
	copy(ops, h.ops)
	ops[len(h.ops)] = op{group: name}
	return &lateHandler{pkg: h.pkg, ops: ops}
}
