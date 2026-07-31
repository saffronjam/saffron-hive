// Package mqttprint implements the mqttprint subcommand: a debug subscriber that
// prints every MQTT message matching a topic filter.
package mqttprint

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"

	"github.com/saffronjam/saffron-hive/internal/adapter/zigbee"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
	_ "modernc.org/sqlite"
)

var logger = logging.Named("mqttprint")

// DefaultTopic is the filter used when the caller does not supply one.
const DefaultTopic = "zigbee2mqtt/#"

// Run subscribes to topic using the broker credentials stored by the
// Zigbee2MQTT integration and prints each message until ctx is cancelled.
func Run(ctx context.Context, topic string) error {
	if topic == "" {
		topic = DefaultTopic
	}

	dbPath := os.Getenv("HIVE_DB_PATH")
	if dbPath == "" {
		dbPath = "saffron-hive.db"
	}

	db, err := sql.Open("sqlite", dbPath+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer func() { _ = db.Close() }()

	cfg, err := store.New(db).GetZigbee2MQTTConfig(ctx)
	if err != nil {
		return fmt.Errorf("read zigbee2mqtt config: %w", err)
	}
	if cfg == nil || cfg.Broker == "" {
		return fmt.Errorf("the Zigbee2MQTT integration is not configured; add it from the Integrations page first")
	}

	client := zigbee.NewPahoClient(zigbee.PahoConfig{
		Broker:   cfg.Broker,
		Username: cfg.Username,
		Password: cfg.Password,
		UseWSS:   cfg.UseWSS,
		ClientID: "saffron-hive-mqttprint",
	})

	// Subscriptions must be registered before Connect so they are issued from
	// inside paho's post-CONNACK callback.
	if err := client.Subscribe(topic, 0, func(msg zigbee.Message) {
		fmt.Printf("%s\n  %s\n\n", msg.Topic(), prettyJSON(msg.Payload()))
	}); err != nil {
		return fmt.Errorf("subscribe to %s: %w", topic, err)
	}

	if err := client.Connect(); err != nil {
		return fmt.Errorf("connect to %s: %w", cfg.Broker, err)
	}
	defer client.Disconnect(250)

	logger.Info("subscribed", "broker", cfg.Broker, "topic", topic)
	<-ctx.Done()
	return nil
}

// prettyJSON indents payloads that parse as JSON and passes anything else
// through unchanged.
func prettyJSON(payload []byte) string {
	var raw json.RawMessage
	if json.Unmarshal(payload, &raw) != nil {
		return string(payload)
	}
	indented, err := json.MarshalIndent(raw, "  ", "  ")
	if err != nil {
		return string(payload)
	}
	return string(indented)
}
