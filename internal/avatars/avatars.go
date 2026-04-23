// Package avatars serves and accepts per-user avatar images. Files live on the
// filesystem under a configurable data directory; the users table stores the
// filename only (a UUID plus image extension). This keeps GraphQL focused on
// structured data and lets browsers cache images via standard HTTP semantics.
package avatars

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("avatars")

// MaxUploadBytes caps a single upload at 10 MiB. Covers phone-camera shots
// without forcing the user to resize, while still protecting the server from
// accidental large uploads.
const MaxUploadBytes = 10 << 20

// allowedMIMEs are the image types we accept. Detected via http.DetectContentType
// on the actual file bytes, not the client-provided Content-Type header.
var allowedMIMEs = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
}

// ProfileWriter is the store surface needed to persist the new filename, clear
// it, and look up the previous one. *store.DB satisfies it structurally.
type ProfileWriter interface {
	UpdateUserProfile(ctx context.Context, params store.UpdateUserProfileParams) (store.User, error)
	GetUserAvatarPath(ctx context.Context, id string) (*string, error)
	ClearUserAvatar(ctx context.Context, id string) error
}

// NewUploadHandler returns the /api/avatars handler. It expects to be wrapped
// in auth.RequireAuth so the current user can be read from the request
// context. POST uploads a new avatar; DELETE clears the current user's avatar
// (removes the file from disk and nulls the column).
func NewUploadHandler(dir string, writer ProfileWriter) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			handleDelete(w, r, dir, writer)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		cu, ok := auth.UserFromContext(r.Context())
		if !ok {
			http.Error(w, "authentication required", http.StatusUnauthorized)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, MaxUploadBytes)
		if err := r.ParseMultipartForm(MaxUploadBytes); err != nil {
			http.Error(w, "file too large (max 10 MB) or invalid multipart form", http.StatusBadRequest)
			return
		}
		file, _, err := r.FormFile("file")
		if err != nil {
			http.Error(w, "missing file field", http.StatusBadRequest)
			return
		}
		defer func() { _ = file.Close() }()

		head := make([]byte, 512)
		n, err := io.ReadFull(file, head)
		if err != nil && !errors.Is(err, io.ErrUnexpectedEOF) && !errors.Is(err, io.EOF) {
			http.Error(w, "failed to read upload", http.StatusBadRequest)
			return
		}
		head = head[:n]
		mime := http.DetectContentType(head)
		ext, okExt := allowedMIMEs[mime]
		if !okExt {
			http.Error(w, "unsupported image type (use JPEG, PNG or WebP)", http.StatusUnsupportedMediaType)
			return
		}

		if err := os.MkdirAll(dir, 0o755); err != nil {
			logger.Error("mkdir avatars dir failed", "dir", dir, "error", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}

		filename := uuid.New().String() + ext
		fullPath := filepath.Join(dir, filename)
		tmpPath := fullPath + ".tmp"

		out, err := os.OpenFile(tmpPath, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
		if err != nil {
			logger.Error("create avatar tempfile failed", "path", tmpPath, "error", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}
		if _, err := out.Write(head); err != nil {
			_ = out.Close()
			_ = os.Remove(tmpPath)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}
		if _, err := io.Copy(out, file); err != nil {
			_ = out.Close()
			_ = os.Remove(tmpPath)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}
		if err := out.Close(); err != nil {
			_ = os.Remove(tmpPath)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}
		if err := os.Rename(tmpPath, fullPath); err != nil {
			_ = os.Remove(tmpPath)
			logger.Error("rename avatar file failed", "src", tmpPath, "dst", fullPath, "error", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}

		prev, _ := writer.GetUserAvatarPath(r.Context(), cu.ID)

		if _, err := writer.UpdateUserProfile(r.Context(), store.UpdateUserProfileParams{
			ID:         cu.ID,
			AvatarPath: &filename,
		}); err != nil {
			_ = os.Remove(fullPath)
			logger.Error("persist avatar path failed", "user_id", cu.ID, "error", err)
			http.Error(w, "server error", http.StatusInternalServerError)
			return
		}

		if prev != nil && *prev != "" && *prev != filename {
			oldPath := filepath.Join(dir, *prev)
			if rmErr := os.Remove(oldPath); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
				logger.Warn("failed to remove prior avatar", "path", oldPath, "error", rmErr)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"avatarPath": filename})
	})
}

func handleDelete(w http.ResponseWriter, r *http.Request, dir string, writer ProfileWriter) {
	cu, ok := auth.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "authentication required", http.StatusUnauthorized)
		return
	}
	prev, _ := writer.GetUserAvatarPath(r.Context(), cu.ID)
	if err := writer.ClearUserAvatar(r.Context(), cu.ID); err != nil {
		logger.Error("clear avatar failed", "user_id", cu.ID, "error", err)
		http.Error(w, "server error", http.StatusInternalServerError)
		return
	}
	if prev != nil && *prev != "" {
		oldPath := filepath.Join(dir, *prev)
		if rmErr := os.Remove(oldPath); rmErr != nil && !errors.Is(rmErr, os.ErrNotExist) {
			logger.Warn("failed to remove avatar file on clear", "path", oldPath, "error", rmErr)
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

// NewServeHandler returns the GET /avatars/{filename} handler. Unauthenticated
// (filenames are unguessable UUIDs and the content is not sensitive), with
// directory traversal guarded by rejecting any segment containing a path
// separator or dot-dot reference.
func NewServeHandler(dir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		name := strings.TrimPrefix(r.URL.Path, "/avatars/")
		if name == "" || strings.ContainsAny(name, "/\\") || strings.Contains(name, "..") {
			http.NotFound(w, r)
			return
		}
		full := filepath.Join(dir, name)
		f, err := os.Stat(full)
		if err != nil || f.IsDir() {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "private, max-age=300")
		http.ServeFile(w, r, full)
	})
}

// Dir returns the avatars subdirectory under the application data directory.
// Centralised so callers in cmd/serve and the graph resolver stay in sync on
// the location of uploaded files.
func Dir(dataDir string) string {
	return filepath.Join(dataDir, "avatars")
}
