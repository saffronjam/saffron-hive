package zigbee

import (
	"fmt"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// readyTimeout bounds how long Connect will block waiting for paho's
// OnConnectHandler to fire after CONNACK. Generous because the TLS+WebSocket
// handshake on public brokers can take a few seconds.
const readyTimeout = 15 * time.Second

// PahoClient wraps the paho MQTT client to implement MQTTClient.
type PahoClient struct {
	client mqtt.Client

	mu           sync.Mutex
	subs         []pahoSub
	connected    chan struct{}
	subscribeErr error
}

type pahoSub struct {
	topic    string
	qos      byte
	callback MessageHandler
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

	p := &PahoClient{
		connected: make(chan struct{}, 1),
	}

	opts := mqtt.NewClientOptions().
		AddBroker(brokerURL).
		SetClientID(cfg.ClientID).
		SetAutoReconnect(true).
		SetConnectTimeout(10 * time.Second).
		SetKeepAlive(30 * time.Second).
		SetOnConnectHandler(p.onConnect)

	if cfg.Username != "" {
		opts.SetUsername(cfg.Username)
	}
	if cfg.Password != "" {
		opts.SetPassword(cfg.Password)
	}

	p.client = mqtt.NewClient(opts)
	return p
}

// onConnect runs on every successful (re)connection. It (re)subscribes all
// registered topics inside paho's own "connection is fully live" callback —
// which is the only point where every internal goroutine is guaranteed to be
// running. Doing the subscribes here avoids the "connection lost before
// Subscribe completed" race that occurs when SUBSCRIBE frames are fired
// directly after CONNACK on a WSS transport whose reader isn't yet armed.
//
// If subscribes fail, the result is captured so Connect() can surface it.
func (p *PahoClient) onConnect(c mqtt.Client) {
	p.mu.Lock()
	subs := append([]pahoSub(nil), p.subs...)
	p.mu.Unlock()

	var firstErr error
	for _, s := range subs {
		cb := s.callback
		token := c.Subscribe(s.topic, s.qos, func(_ mqtt.Client, msg mqtt.Message) {
			cb(&pahoMessage{msg: msg})
		})
		token.Wait()
		if err := token.Error(); err != nil {
			logger.Warn("mqtt subscribe failed", "topic", s.topic, "error", err)
			if firstErr == nil {
				firstErr = fmt.Errorf("subscribe %q: %w", s.topic, err)
			}
		}
	}

	p.mu.Lock()
	p.subscribeErr = firstErr
	p.mu.Unlock()

	select {
	case p.connected <- struct{}{}:
	default:
	}
}

// Connect establishes the MQTT connection and blocks until OnConnectHandler
// has applied every registered subscription. Callers must register their
// subscriptions via Subscribe BEFORE calling Connect so the subscribes happen
// inside paho's post-CONNACK callback, where the transport is guaranteed to
// be fully ready.
func (p *PahoClient) Connect() error {
	token := p.client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		return err
	}
	select {
	case <-p.connected:
		p.mu.Lock()
		err := p.subscribeErr
		p.mu.Unlock()
		return err
	case <-time.After(readyTimeout):
		return fmt.Errorf("mqtt connected but transport never became ready within %s", readyTimeout)
	}
}

// Disconnect gracefully disconnects from the broker.
func (p *PahoClient) Disconnect(quiesce uint) {
	p.client.Disconnect(quiesce)
}

// IsConnected returns whether the client is currently connected.
func (p *PahoClient) IsConnected() bool {
	return p.client.IsConnected()
}

// Subscribe registers a callback for the given topic. When Connect() is
// called, OnConnectHandler issues the MQTT SUBSCRIBE for every registered
// topic from inside paho's ready-for-IO callback — avoiding the WSS race.
//
// If called after the client is already connected, it also issues the
// subscribe immediately so late-registered topics work.
func (p *PahoClient) Subscribe(topic string, qos byte, callback MessageHandler) error {
	p.mu.Lock()
	p.subs = append(p.subs, pahoSub{topic: topic, qos: qos, callback: callback})
	connected := p.client.IsConnected()
	p.mu.Unlock()

	if !connected {
		// Will be subscribed by onConnect when Connect() is called.
		return nil
	}

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
