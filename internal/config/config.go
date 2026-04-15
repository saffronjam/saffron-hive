package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds all application configuration parsed from environment variables.
type Config struct {
	MQTTBroker   string
	MQTTUsername string
	MQTTPassword string
	MQTTUseWSS   bool
	DBPath       string
	ListenAddr   string
}

// Parse reads configuration from environment variables.
// HIVE_MQTT_BROKER is required. All other fields have sensible defaults.
func Parse() (Config, error) {
	broker := os.Getenv("HIVE_MQTT_BROKER")
	if broker == "" {
		return Config{}, fmt.Errorf("HIVE_MQTT_BROKER is required")
	}

	cfg := Config{
		MQTTBroker:   broker,
		MQTTUsername: os.Getenv("HIVE_MQTT_USERNAME"),
		MQTTPassword: os.Getenv("HIVE_MQTT_PASSWORD"),
		MQTTUseWSS:   strings.EqualFold(os.Getenv("HIVE_MQTT_USE_WSS"), "true"),
		DBPath:       envOrDefault("HIVE_DB_PATH", "saffron-hive.db"),
		ListenAddr:   envOrDefault("HIVE_LISTEN_ADDR", ":8080"),
	}

	return cfg, nil
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
