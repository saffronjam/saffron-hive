package config

import (
	"os"
	"testing"
)

func clearEnv(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"HIVE_INIT_USER",
		"HIVE_INIT_PASSWORD",
		"HIVE_DB_PATH",
		"HIVE_LISTEN_ADDR",
		"HIVE_LOG_LEVEL",
	} {
		t.Setenv(key, "")
		_ = os.Unsetenv(key)
	}
}

func TestConfigFromEnv(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_INIT_USER", "admin")
	t.Setenv("HIVE_INIT_PASSWORD", "hunter2")
	t.Setenv("HIVE_DB_PATH", "/data/test.db")
	t.Setenv("HIVE_LISTEN_ADDR", ":9090")

	cfg := Parse()

	if cfg.InitUser != "admin" {
		t.Errorf("InitUser = %q, want %q", cfg.InitUser, "admin")
	}
	if cfg.InitPassword != "hunter2" {
		t.Errorf("InitPassword = %q, want %q", cfg.InitPassword, "hunter2")
	}
	if !cfg.HasInitUser() {
		t.Error("HasInitUser() = false, want true")
	}
	if cfg.DBPath != "/data/test.db" {
		t.Errorf("DBPath = %q, want %q", cfg.DBPath, "/data/test.db")
	}
	if cfg.ListenAddr != ":9090" {
		t.Errorf("ListenAddr = %q, want %q", cfg.ListenAddr, ":9090")
	}
}

func TestConfigDefaults(t *testing.T) {
	clearEnv(t)

	cfg := Parse()

	if cfg.DBPath != "saffron-hive.db" {
		t.Errorf("DBPath = %q, want default %q", cfg.DBPath, "saffron-hive.db")
	}
	if cfg.ListenAddr != ":8080" {
		t.Errorf("ListenAddr = %q, want default %q", cfg.ListenAddr, ":8080")
	}
	if cfg.DataDir != "." {
		t.Errorf("DataDir = %q, want default %q", cfg.DataDir, ".")
	}
	if !cfg.TrustProxyHeaders {
		t.Error("TrustProxyHeaders = false, want true by default")
	}
	if cfg.HasInitUser() {
		t.Error("HasInitUser() = true, want false when init envs are empty")
	}
}
