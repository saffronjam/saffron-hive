package serve

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

// BootstrapTokenStore guards the first-boot setup flow. On a fresh install
// the createInitialUser mutation is publicly reachable until somebody claims
// the admin account; without a gate, the first stranger to hit the URL after
// a deploy wins. EnsureGenerated creates and persists a random token on first
// boot when no users exist yet; createInitialUser requires that token,
// blocking the land-grab. The token is removed after first successful use.
type BootstrapTokenStore struct {
	path string
	mu   sync.Mutex
}

// NewBootstrapTokenStore constructs a store backed by the file at path. The
// path is created with parents permitted; the file itself is written 0600 so
// only the owning process user can read it.
func NewBootstrapTokenStore(path string) *BootstrapTokenStore {
	return &BootstrapTokenStore{path: path}
}

// EnsureGenerated returns the current bootstrap token, generating one if the
// file does not yet exist. Idempotent — repeated calls during a single boot
// return the same token. Returns an error only on I/O failure.
func (s *BootstrapTokenStore) EnsureGenerated() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if existing, err := os.ReadFile(s.path); err == nil {
		return string(existing), nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return "", fmt.Errorf("read bootstrap token: %w", err)
	}

	var buf [24]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", fmt.Errorf("generate bootstrap token: %w", err)
	}
	tok := base64.RawURLEncoding.EncodeToString(buf[:])

	if err := os.MkdirAll(filepath.Dir(s.path), 0o755); err != nil {
		return "", fmt.Errorf("mkdir for bootstrap token: %w", err)
	}
	if err := os.WriteFile(s.path, []byte(tok), 0o600); err != nil {
		return "", fmt.Errorf("write bootstrap token: %w", err)
	}
	return tok, nil
}

// Read returns the current bootstrap token. Returns os.ErrNotExist when the
// file has been consumed (i.e. an initial user has been created).
func (s *BootstrapTokenStore) Read() (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, err := os.ReadFile(s.path)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// ConsumeAndDelete removes the token file once an initial user has been
// successfully created. A missing file is not an error — the bootstrap flow
// already completed and a subsequent caller raced the cleanup.
func (s *BootstrapTokenStore) ConsumeAndDelete() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := os.Remove(s.path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("remove bootstrap token: %w", err)
	}
	return nil
}
