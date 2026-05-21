package config

import (
	"os"
	"strings"
)

// Config holds all application configuration parsed from environment variables.
type Config struct {
	MQTTAddress       string
	MQTTUser          string
	MQTTPassword      string
	MQTTUseWSS        bool
	InitUser          string
	InitPassword      string
	DBPath            string
	DataDir           string
	ListenAddr        string
	LogLevel          string
	TrustProxyHeaders bool
	AllowedOrigins    []string
}

// Parse reads configuration from environment variables.
// HIVE_MQTT_ADDRESS is optional — MQTT config can also come from the database.
// HIVE_INIT_USER/HIVE_INIT_PASSWORD are optional — used to seed the initial
// user on first boot when the users table is empty.
// HIVE_DATA_DIR is the base directory for persistent files (user avatars, etc.);
// defaults to the current working directory.
// HIVE_LOG_LEVEL is optional ("debug", "info", "warn", "error"); when set it
// overrides the log_level database setting.
//
// HIVE_TRUST_PROXY toggles whether ClientIP reads X-Real-IP / X-Forwarded-For
// (default true, matching the typical reverse-proxy deployment). Set to "false"
// when running with no proxy in front so spoofed headers cannot bypass the
// per-IP login limiter.
//
// HIVE_ALLOWED_ORIGINS is a comma-separated allowlist of Origin headers
// accepted for WebSocket upgrades. Defaults to https://hive.saffronbun.com.
func Parse() Config {
	return Config{
		MQTTAddress:       os.Getenv("HIVE_MQTT_ADDRESS"),
		MQTTUser:          os.Getenv("HIVE_MQTT_USER"),
		MQTTPassword:      os.Getenv("HIVE_MQTT_PASSWORD"),
		MQTTUseWSS:        strings.EqualFold(os.Getenv("HIVE_MQTT_USE_WSS"), "true"),
		InitUser:          os.Getenv("HIVE_INIT_USER"),
		InitPassword:      os.Getenv("HIVE_INIT_PASSWORD"),
		DBPath:            envOrDefault("HIVE_DB_PATH", "saffron-hive.db"),
		DataDir:           envOrDefault("HIVE_DATA_DIR", "."),
		ListenAddr:        envOrDefault("HIVE_LISTEN_ADDR", ":8080"),
		LogLevel:          os.Getenv("HIVE_LOG_LEVEL"),
		TrustProxyHeaders: parseBoolDefault(os.Getenv("HIVE_TRUST_PROXY"), true),
		AllowedOrigins:    parseOrigins(os.Getenv("HIVE_ALLOWED_ORIGINS"), "https://hive.saffronbun.com"),
	}
}

func parseBoolDefault(s string, fallback bool) bool {
	if s == "" {
		return fallback
	}
	return strings.EqualFold(s, "true") || s == "1"
}

func parseOrigins(s, fallback string) []string {
	if s == "" {
		s = fallback
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
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
