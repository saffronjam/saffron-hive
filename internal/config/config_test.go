package config

import (
	"os"
	"strings"
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
		"HIVE_MQTT_CLIENT_ID",
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

func TestMQTTClientIDFromEnv(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_MQTT_CLIENT_ID", "hive-kitchen")

	if got := Parse().MQTTClientID; got != "hive-kitchen" {
		t.Errorf("MQTTClientID = %q, want %q", got, "hive-kitchen")
	}
}

// A broker evicts whichever client already holds an ID when a second client
// presents it, so the default must not be a value two hosts can both land on.
func TestMQTTClientIDDefaultCarriesHostname(t *testing.T) {
	clearEnv(t)

	host, err := os.Hostname()
	if err != nil || host == "" {
		t.Skip("hostname unavailable")
	}

	got := Parse().MQTTClientID
	want := truncateClientID("saffron-hive-" + sanitizeClientID(host))
	if got != want {
		t.Errorf("MQTTClientID = %q, want %q", got, want)
	}
	if got == "saffron-hive" {
		t.Error("MQTTClientID fell back to the bare prefix despite a usable hostname")
	}
}

func TestSubClientIDStaysDistinctFromBase(t *testing.T) {
	base := "saffron-hive-nuc"

	got := SubClientID(base, "test")
	if got != "saffron-hive-nuc-test" {
		t.Errorf("SubClientID = %q, want %q", got, "saffron-hive-nuc-test")
	}
	if got == base {
		t.Error("SubClientID collided with the base client ID")
	}
}

func TestClientIDSanitizedAndBounded(t *testing.T) {
	got := SubClientID("saffron-hive", "wei rd/hö:st")
	if want := "saffron-hive-wei-rd-h--st"; got != want {
		t.Errorf("SubClientID = %q, want %q", got, want)
	}

	long := SubClientID("saffron-hive", strings.Repeat("x", 200))
	if len(long) != maxMQTTClientID {
		t.Errorf("len(SubClientID) = %d, want %d", len(long), maxMQTTClientID)
	}
}
