package zigbee

import "sync"

// Message represents an incoming MQTT message.
type Message interface {
	Topic() string
	Payload() []byte
}

// MessageHandler is a callback invoked when a subscribed message arrives.
type MessageHandler func(msg Message)

// MQTTClient is the minimal MQTT interface needed by the adapter.
type MQTTClient interface {
	Subscribe(topic string, qos byte, callback MessageHandler) error
	Publish(topic string, qos byte, retained bool, payload []byte) error
	Connect() error
	Disconnect(quiesce uint)
	IsConnected() bool
}

type fakeMessage struct {
	topic   string
	payload []byte
}

func (m *fakeMessage) Topic() string   { return m.topic }
func (m *fakeMessage) Payload() []byte { return m.payload }

// FakeMQTTClient is an in-memory MQTT client for testing.
type FakeMQTTClient struct {
	mu            sync.Mutex
	connected     bool
	subscriptions map[string]MessageHandler
	published     []FakePublish
}

// FakePublish records a single MQTT publish call.
type FakePublish struct {
	Topic    string
	QoS      byte
	Retained bool
	Payload  []byte
}

// NewFakeMQTTClient returns a FakeMQTTClient ready for use in tests.
func NewFakeMQTTClient() *FakeMQTTClient {
	return &FakeMQTTClient{
		subscriptions: make(map[string]MessageHandler),
	}
}

// Connect marks the client as connected.
func (f *FakeMQTTClient) Connect() error {
	f.connected = true
	return nil
}

// Disconnect marks the client as disconnected.
func (f *FakeMQTTClient) Disconnect(_ uint) {
	f.connected = false
}

// IsConnected returns the connection state.
func (f *FakeMQTTClient) IsConnected() bool {
	return f.connected
}

// Subscribe registers a handler for a topic pattern.
func (f *FakeMQTTClient) Subscribe(topic string, _ byte, callback MessageHandler) error {
	f.subscriptions[topic] = callback
	return nil
}

// Publish records the publish and returns nil.
func (f *FakeMQTTClient) Publish(topic string, qos byte, retained bool, payload []byte) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.published = append(f.published, FakePublish{
		Topic:    topic,
		QoS:      qos,
		Retained: retained,
		Payload:  payload,
	})
	return nil
}

// GetPublished returns a copy of all published messages.
func (f *FakeMQTTClient) GetPublished() []FakePublish {
	f.mu.Lock()
	defer f.mu.Unlock()
	cp := make([]FakePublish, len(f.published))
	copy(cp, f.published)
	return cp
}

// Inject simulates receiving a message on the given topic.
func (f *FakeMQTTClient) Inject(topic string, payload []byte) {
	for pattern, handler := range f.subscriptions {
		if topicMatches(pattern, topic) {
			handler(&fakeMessage{topic: topic, payload: payload})
		}
	}
}

func topicMatches(pattern, topic string) bool {
	if pattern == topic {
		return true
	}
	if pattern == "#" {
		return true
	}
	pi, ti := 0, 0
	pp := splitTopic(pattern)
	tp := splitTopic(topic)
	for pi < len(pp) && ti < len(tp) {
		if pp[pi] == "#" {
			return true
		}
		if pp[pi] == "+" {
			pi++
			ti++
			continue
		}
		if pp[pi] != tp[ti] {
			return false
		}
		pi++
		ti++
	}
	return pi == len(pp) && ti == len(tp)
}

func splitTopic(t string) []string {
	var parts []string
	start := 0
	for i := 0; i < len(t); i++ {
		if t[i] == '/' {
			parts = append(parts, t[start:i])
			start = i + 1
		}
	}
	parts = append(parts, t[start:])
	return parts
}
