package config

import (
	"os"
	"strings"
)

// Config holds all application configuration parsed from environment variables.
type Config struct {
	InitUser          string
	InitPassword      string
	DBPath            string
	DataDir           string
	ListenAddr        string
	LogLevel          string
	TrustProxyHeaders bool
	AllowedOrigins    []string
	MQTTClientID      string
}

// Parse reads configuration from environment variables.
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
//
// HIVE_MQTT_CLIENT_ID is the identity presented to the MQTT broker; it defaults
// to a per-host value. Set it only when a broker ACL needs a fixed name, and
// keep it distinct across every Hive process pointed at one broker.
func Parse() Config {
	return Config{
		InitUser:          os.Getenv("HIVE_INIT_USER"),
		InitPassword:      os.Getenv("HIVE_INIT_PASSWORD"),
		DBPath:            envOrDefault("HIVE_DB_PATH", "saffron-hive.db"),
		DataDir:           envOrDefault("HIVE_DATA_DIR", "."),
		ListenAddr:        envOrDefault("HIVE_LISTEN_ADDR", ":8080"),
		LogLevel:          os.Getenv("HIVE_LOG_LEVEL"),
		TrustProxyHeaders: parseBoolDefault(os.Getenv("HIVE_TRUST_PROXY"), true),
		AllowedOrigins:    parseOrigins(os.Getenv("HIVE_ALLOWED_ORIGINS"), "https://hive.saffronbun.com"),
		MQTTClientID:      envOrDefault("HIVE_MQTT_CLIENT_ID", defaultMQTTClientID()),
	}
}

// mqttClientIDPrefix opens every client ID this process derives, so all Hive
// connections sort together in a broker's client list.
const mqttClientIDPrefix = "saffron-hive"

// maxMQTTClientID bounds a derived client ID. Brokers accept far longer
// identifiers than the 23 bytes MQTT 3.1 guaranteed, but a bound keeps broker
// logs and client lists readable.
const maxMQTTClientID = 64

// defaultMQTTClientID derives a client ID from the hostname. A broker
// disconnects whichever client already holds an ID when a second one presents
// it, so two Hive processes sharing an ID take turns evicting each other —
// keying on the host keeps them apart with no configuration. Falls back to the
// bare prefix when the hostname is unavailable.
func defaultMQTTClientID() string {
	host, err := os.Hostname()
	if err != nil || host == "" {
		return mqttClientIDPrefix
	}
	return truncateClientID(mqttClientIDPrefix + "-" + sanitizeClientID(host))
}

// SubClientID derives a companion identity for a second connection opened
// alongside the adapter's — a connection test or a debug subscriber — so it
// never evicts the session the adapter is running on.
func SubClientID(base, suffix string) string {
	return truncateClientID(base + "-" + sanitizeClientID(suffix))
}

// sanitizeClientID reduces s to characters brokers accept unambiguously in a
// client ID, so the result is safe to log, filter and slice by byte.
func sanitizeClientID(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '-', r == '_', r == '.':
			b.WriteRune(r)
		default:
			b.WriteByte('-')
		}
	}
	return b.String()
}

func truncateClientID(id string) string {
	if len(id) > maxMQTTClientID {
		return id[:maxMQTTClientID]
	}
	return id
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
