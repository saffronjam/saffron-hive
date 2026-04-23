package config

import (
	"os"
	"testing"
)

func clearEnv(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"HIVE_MQTT_ADDRESS",
		"HIVE_MQTT_USER",
		"HIVE_MQTT_PASSWORD",
		"HIVE_MQTT_USE_WSS",
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
	t.Setenv("HIVE_MQTT_ADDRESS", "mqtt.example.com:1883")
	t.Setenv("HIVE_MQTT_USER", "user")
	t.Setenv("HIVE_MQTT_PASSWORD", "pass")
	t.Setenv("HIVE_MQTT_USE_WSS", "true")
	t.Setenv("HIVE_INIT_USER", "admin")
	t.Setenv("HIVE_INIT_PASSWORD", "hunter2")
	t.Setenv("HIVE_DB_PATH", "/data/test.db")
	t.Setenv("HIVE_LISTEN_ADDR", ":9090")

	cfg := Parse()

	if cfg.MQTTAddress != "mqtt.example.com:1883" {
		t.Errorf("MQTTAddress = %q, want %q", cfg.MQTTAddress, "mqtt.example.com:1883")
	}
	if cfg.MQTTUser != "user" {
		t.Errorf("MQTTUser = %q, want %q", cfg.MQTTUser, "user")
	}
	if cfg.MQTTPassword != "pass" {
		t.Errorf("MQTTPassword = %q, want %q", cfg.MQTTPassword, "pass")
	}
	if !cfg.MQTTUseWSS {
		t.Error("MQTTUseWSS = false, want true")
	}
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

func TestConfigOptionalMQTT(t *testing.T) {
	clearEnv(t)

	cfg := Parse()
	if cfg.MQTTAddress != "" {
		t.Errorf("MQTTAddress = %q, want empty", cfg.MQTTAddress)
	}
	if cfg.HasMQTTConfig() {
		t.Error("HasMQTTConfig() = true, want false when address is empty")
	}
	if cfg.HasInitUser() {
		t.Error("HasInitUser() = true, want false when init envs are empty")
	}
}

func TestConfigAnonymousMQTT(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_MQTT_ADDRESS", "mqtt.example.com:1883")

	cfg := Parse()

	if !cfg.HasMQTTConfig() {
		t.Error("HasMQTTConfig() = false, want true when only address is set (anonymous)")
	}
}

func TestConfigDefaults(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_MQTT_ADDRESS", "mqtt.example.com:1883")

	cfg := Parse()

	if cfg.DBPath != "saffron-hive.db" {
		t.Errorf("DBPath = %q, want default %q", cfg.DBPath, "saffron-hive.db")
	}
	if cfg.ListenAddr != ":8080" {
		t.Errorf("ListenAddr = %q, want default %q", cfg.ListenAddr, ":8080")
	}
	if cfg.MQTTUseWSS {
		t.Error("MQTTUseWSS = true, want false by default")
	}
	if !cfg.HasMQTTConfig() {
		t.Error("HasMQTTConfig() = false, want true when address is set")
	}
}
