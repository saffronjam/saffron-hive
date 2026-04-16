package infra

import (
	"encoding/json"
	"fmt"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// Publisher wraps an MQTT client for publishing fake zigbee2mqtt messages.
type Publisher struct {
	client mqtt.Client
}

// NewPublisher creates and connects a new MQTT publisher to the given broker.
func NewPublisher(brokerURL string) (*Publisher, error) {
	opts := mqtt.NewClientOptions().
		AddBroker(fmt.Sprintf("tcp://%s", brokerURL)).
		SetClientID("e2e-publisher").
		SetConnectTimeout(10 * time.Second).
		SetKeepAlive(30 * time.Second)

	client := mqtt.NewClient(opts)
	token := client.Connect()
	token.Wait()
	if err := token.Error(); err != nil {
		return nil, fmt.Errorf("connect publisher: %w", err)
	}

	return &Publisher{client: client}, nil
}

// PublishBridgeDevices publishes the bridge/devices payload (retained).
func (p *Publisher) PublishBridgeDevices(devices []byte) error {
	token := p.client.Publish("zigbee2mqtt/bridge/devices", 0, true, devices)
	token.Wait()
	return token.Error()
}

// PublishDeviceState publishes a state payload for a device (retained).
func (p *Publisher) PublishDeviceState(friendlyName string, payload []byte) error {
	topic := "zigbee2mqtt/" + friendlyName
	token := p.client.Publish(topic, 0, true, payload)
	token.Wait()
	return token.Error()
}

// PublishAvailability publishes an availability message for a device.
func (p *Publisher) PublishAvailability(friendlyName string, available bool) error {
	topic := "zigbee2mqtt/" + friendlyName + "/availability"
	state := "offline"
	if available {
		state = "online"
	}
	payload, err := json.Marshal(struct {
		State string `json:"state"`
	}{State: state})
	if err != nil {
		return err
	}
	token := p.client.Publish(topic, 0, false, payload)
	token.Wait()
	return token.Error()
}

// SubscribeCommands subscribes to set topics for all devices and sends
// received payloads to the returned channel.
func (p *Publisher) SubscribeCommands() (<-chan MQTTMessage, error) {
	ch := make(chan MQTTMessage, 64)
	token := p.client.Subscribe("zigbee2mqtt/+/set", 0, func(_ mqtt.Client, msg mqtt.Message) {
		ch <- MQTTMessage{
			Topic:   msg.Topic(),
			Payload: msg.Payload(),
		}
	})
	token.Wait()
	if err := token.Error(); err != nil {
		return nil, err
	}
	return ch, nil
}

// Disconnect cleanly disconnects from the broker.
func (p *Publisher) Disconnect() {
	p.client.Disconnect(250)
}

// MQTTMessage is a topic+payload pair received from MQTT.
type MQTTMessage struct {
	Topic   string
	Payload []byte
}
