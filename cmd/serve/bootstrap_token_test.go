package serve

import (
	"errors"
	"os"
	"path/filepath"
	"testing"
)

func TestBootstrapTokenEnsureGeneratedIsIdempotent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bootstrap.token")
	store := NewBootstrapTokenStore(path)

	first, err := store.EnsureGenerated()
	if err != nil {
		t.Fatalf("first EnsureGenerated: %v", err)
	}
	if first == "" {
		t.Fatal("generated token is empty")
	}
	second, err := store.EnsureGenerated()
	if err != nil {
		t.Fatalf("second EnsureGenerated: %v", err)
	}
	if first != second {
		t.Errorf("second call returned a different token (%q vs %q) — must be idempotent", second, first)
	}

	info, err := os.Stat(path)
	if err != nil {
		t.Fatalf("stat token file: %v", err)
	}
	if info.Mode()&0o077 != 0 {
		t.Errorf("token file mode = %v, want owner-only", info.Mode())
	}
}

func TestBootstrapTokenConsumeAndDeleteRemovesFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bootstrap.token")
	store := NewBootstrapTokenStore(path)
	if _, err := store.EnsureGenerated(); err != nil {
		t.Fatalf("generate: %v", err)
	}
	if err := store.ConsumeAndDelete(); err != nil {
		t.Fatalf("consume: %v", err)
	}
	if _, err := store.Read(); !errors.Is(err, os.ErrNotExist) {
		t.Errorf("read after consume err = %v, want ErrNotExist", err)
	}
	// Second consume tolerated.
	if err := store.ConsumeAndDelete(); err != nil {
		t.Errorf("second consume should not error, got %v", err)
	}
}
