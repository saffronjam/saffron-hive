package config

import (
	"os"
	"strings"
)

// Config holds all application configuration parsed from environment variables.
type Config struct {
	MQTTAddress  string
	MQTTUser     string
	MQTTPassword string
	MQTTUseWSS   bool
	InitUser     string
	InitPassword string
	DBPath       string
	ListenAddr   string
}

// Parse reads configuration from environment variables.
// HIVE_MQTT_ADDRESS is optional — MQTT config can also come from the database.
// HIVE_INIT_USER/HIVE_INIT_PASSWORD are optional — used to seed the initial
// user on first boot when the users table is empty.
func Parse() Config {
	return Config{
		MQTTAddress:  os.Getenv("HIVE_MQTT_ADDRESS"),
		MQTTUser:     os.Getenv("HIVE_MQTT_USER"),
		MQTTPassword: os.Getenv("HIVE_MQTT_PASSWORD"),
		MQTTUseWSS:   strings.EqualFold(os.Getenv("HIVE_MQTT_USE_WSS"), "true"),
		InitUser:     os.Getenv("HIVE_INIT_USER"),
		InitPassword: os.Getenv("HIVE_INIT_PASSWORD"),
		DBPath:       envOrDefault("HIVE_DB_PATH", "saffron-hive.db"),
		ListenAddr:   envOrDefault("HIVE_LISTEN_ADDR", ":8080"),
	}
}

// HasMQTTConfig reports whether MQTT broker configuration was provided via
// environment variables. Only the address is required — user and password are
// optional (empty values indicate anonymous MQTT).
func (c Config) HasMQTTConfig() bool {
	return c.MQTTAddress != ""
}

// HasInitUser reports whether both initial user credentials were provided via
// environment variables.
func (c Config) HasInitUser() bool {
	return c.InitUser != "" && c.InitPassword != ""
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
