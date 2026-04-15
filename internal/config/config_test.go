package config

import (
	"os"
	"testing"
)

func clearEnv(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"HIVE_MQTT_BROKER",
		"HIVE_MQTT_USERNAME",
		"HIVE_MQTT_PASSWORD",
		"HIVE_MQTT_USE_WSS",
		"HIVE_DB_PATH",
		"HIVE_LISTEN_ADDR",
	} {
		t.Setenv(key, "")
		_ = os.Unsetenv(key)
	}
}

func TestConfigFromEnv(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_MQTT_BROKER", "mqtt.example.com:1883")
	t.Setenv("HIVE_MQTT_USERNAME", "user")
	t.Setenv("HIVE_MQTT_PASSWORD", "pass")
	t.Setenv("HIVE_MQTT_USE_WSS", "true")
	t.Setenv("HIVE_DB_PATH", "/data/test.db")
	t.Setenv("HIVE_LISTEN_ADDR", ":9090")

	cfg, err := Parse()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.MQTTBroker != "mqtt.example.com:1883" {
		t.Errorf("MQTTBroker = %q, want %q", cfg.MQTTBroker, "mqtt.example.com:1883")
	}
	if cfg.MQTTUsername != "user" {
		t.Errorf("MQTTUsername = %q, want %q", cfg.MQTTUsername, "user")
	}
	if cfg.MQTTPassword != "pass" {
		t.Errorf("MQTTPassword = %q, want %q", cfg.MQTTPassword, "pass")
	}
	if !cfg.MQTTUseWSS {
		t.Error("MQTTUseWSS = false, want true")
	}
	if cfg.DBPath != "/data/test.db" {
		t.Errorf("DBPath = %q, want %q", cfg.DBPath, "/data/test.db")
	}
	if cfg.ListenAddr != ":9090" {
		t.Errorf("ListenAddr = %q, want %q", cfg.ListenAddr, ":9090")
	}
}

func TestConfigMissingRequired(t *testing.T) {
	clearEnv(t)

	_, err := Parse()
	if err == nil {
		t.Fatal("expected error for missing HIVE_MQTT_BROKER, got nil")
	}
	if got := err.Error(); got != "HIVE_MQTT_BROKER is required" {
		t.Errorf("error = %q, want %q", got, "HIVE_MQTT_BROKER is required")
	}
}

func TestConfigDefaults(t *testing.T) {
	clearEnv(t)
	t.Setenv("HIVE_MQTT_BROKER", "mqtt.example.com:1883")

	cfg, err := Parse()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if cfg.DBPath != "saffron-hive.db" {
		t.Errorf("DBPath = %q, want default %q", cfg.DBPath, "saffron-hive.db")
	}
	if cfg.ListenAddr != ":8080" {
		t.Errorf("ListenAddr = %q, want default %q", cfg.ListenAddr, ":8080")
	}
	if cfg.MQTTUseWSS {
		t.Error("MQTTUseWSS = true, want false by default")
	}
	if cfg.MQTTUsername != "" {
		t.Errorf("MQTTUsername = %q, want empty by default", cfg.MQTTUsername)
	}
	if cfg.MQTTPassword != "" {
		t.Errorf("MQTTPassword = %q, want empty by default", cfg.MQTTPassword)
	}
}
