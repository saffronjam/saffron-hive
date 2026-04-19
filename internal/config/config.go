package config

import (
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
// HIVE_MQTT_BROKER is optional — MQTT config can also come from the database.
func Parse() Config {
	return Config{
		MQTTBroker:   os.Getenv("HIVE_MQTT_BROKER"),
		MQTTUsername: os.Getenv("HIVE_MQTT_USERNAME"),
		MQTTPassword: os.Getenv("HIVE_MQTT_PASSWORD"),
		MQTTUseWSS:   strings.EqualFold(os.Getenv("HIVE_MQTT_USE_WSS"), "true"),
		DBPath:       envOrDefault("HIVE_DB_PATH", "saffron-hive.db"),
		ListenAddr:   envOrDefault("HIVE_LISTEN_ADDR", ":8080"),
	}
}

// HasMQTTConfig reports whether MQTT broker configuration was provided via
// environment variables.
func (c Config) HasMQTTConfig() bool {
	return c.MQTTBroker != ""
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
