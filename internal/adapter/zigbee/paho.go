package zigbee

import (
	"fmt"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// PahoClient wraps the paho MQTT client to implement MQTTClient.
type PahoClient struct {
	client mqtt.Client
}

// PahoConfig holds the configuration for creating a PahoClient.
type PahoConfig struct {
	Broker   string
	Username string
	Password string
	UseWSS   bool
	ClientID string
}

// NewPahoClient creates a new PahoClient from the given configuration.
func NewPahoClient(cfg PahoConfig) *PahoClient {
	scheme := "tcp"
	if cfg.UseWSS {
		scheme = "wss"
	}
	brokerURL := fmt.Sprintf("%s://%s", scheme, cfg.Broker)

	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID(cfg.ClientID).
		SetAutoReconnect(true).
		SetConnectTimeout(10 * time.Second).
		SetKeepAlive(30 * time.Second)

	if cfg.Username != "" {
		opts.SetUsername(cfg.Username)
	}
	if cfg.Password != "" {
		opts.SetPassword(cfg.Password)
	}

	return &PahoClient{
		client: mqtt.NewClient(opts),
	}
}

// Connect establishes the MQTT connection.
func (p *PahoClient) Connect() error {
	token := p.client.Connect()
	token.Wait()
	return token.Error()
}

// Disconnect gracefully disconnects from the broker.
func (p *PahoClient) Disconnect(quiesce uint) {
	p.client.Disconnect(quiesce)
}

// IsConnected returns whether the client is currently connected.
func (p *PahoClient) IsConnected() bool {
	return p.client.IsConnected()
}

// Subscribe registers a callback for the given topic.
func (p *PahoClient) Subscribe(topic string, qos byte, callback MessageHandler) error {
	token := p.client.Subscribe(topic, qos, func(_ mqtt.Client, msg mqtt.Message) {
		callback(&pahoMessage{msg: msg})
	})
	token.Wait()
	return token.Error()
}

// Publish sends a message to the given topic.
func (p *PahoClient) Publish(topic string, qos byte, retained bool, payload []byte) error {
	token := p.client.Publish(topic, qos, retained, payload)
	token.Wait()
	return token.Error()
}

type pahoMessage struct {
	msg mqtt.Message
}

func (m *pahoMessage) Topic() string   { return m.msg.Topic() }
func (m *pahoMessage) Payload() []byte { return m.msg.Payload() }
