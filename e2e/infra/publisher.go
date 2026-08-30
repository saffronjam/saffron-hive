package infra

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// Publisher wraps an MQTT client for publishing fake zigbee2mqtt messages.
type Publisher struct {
	client mqtt.Client

	mu                 sync.RWMutex
	deviceNames        map[string]bool
	deviceNamesByIEEE  map[string]string
	groupMembersByName map[string][]string
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

	return &Publisher{
		client:             client,
		deviceNames:        map[string]bool{},
		deviceNamesByIEEE:  map[string]string{},
		groupMembersByName: map[string][]string{},
	}, nil
}

// PublishBridgeDevices publishes the bridge/devices payload (retained).
func (p *Publisher) PublishBridgeDevices(devices []byte) error {
	p.rememberDevices(devices)
	token := p.client.Publish("zigbee2mqtt/bridge/devices", 0, true, devices)
	token.Wait()
	return token.Error()
}

// PublishBridgeState publishes the retained Zigbee2MQTT bridge state.
func (p *Publisher) PublishBridgeState(online bool) error {
	state := "offline"
	if online {
		state = "online"
	}
	payload, err := json.Marshal(struct {
		State string `json:"state"`
	}{State: state})
	if err != nil {
		return err
	}
	token := p.client.Publish("zigbee2mqtt/bridge/state", 0, true, payload)
	token.Wait()
	return token.Error()
}

// PublishBridgeInfo publishes the retained Zigbee2MQTT bridge diagnostics.
func (p *Publisher) PublishBridgeInfo(info []byte) error {
	token := p.client.Publish("zigbee2mqtt/bridge/info", 0, true, info)
	token.Wait()
	return token.Error()
}

// PublishBridgeGroups publishes the complete bridge/groups registry as a
// retained message.
func (p *Publisher) PublishBridgeGroups(groups []byte) error {
	p.rememberGroups(groups)
	token := p.client.Publish("zigbee2mqtt/bridge/groups", 0, true, groups)
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
		message := MQTTMessage{
			Topic:   msg.Topic(),
			Payload: msg.Payload(),
		}
		select {
		case ch <- message:
		default:
		}
		go p.acknowledgeCommand(message)
	})
	token.Wait()
	if err := token.Error(); err != nil {
		return nil, err
	}
	return ch, nil
}

func (p *Publisher) rememberDevices(payload []byte) {
	var entries []struct {
		IEEEAddress  string `json:"ieee_address"`
		FriendlyName string `json:"friendly_name"`
	}
	if json.Unmarshal(payload, &entries) != nil {
		return
	}
	p.mu.Lock()
	p.deviceNames = make(map[string]bool, len(entries))
	p.deviceNamesByIEEE = make(map[string]string, len(entries))
	for _, entry := range entries {
		if entry.FriendlyName == "" {
			continue
		}
		p.deviceNames[entry.FriendlyName] = true
		if entry.IEEEAddress != "" {
			p.deviceNamesByIEEE[entry.IEEEAddress] = entry.FriendlyName
		}
	}
	p.mu.Unlock()
}

func (p *Publisher) rememberGroups(payload []byte) {
	var entries []struct {
		FriendlyName string `json:"friendly_name"`
		Members      []struct {
			IEEEAddress string `json:"ieee_address"`
		} `json:"members"`
	}
	if json.Unmarshal(payload, &entries) != nil {
		return
	}
	p.mu.Lock()
	p.groupMembersByName = make(map[string][]string, len(entries))
	for _, entry := range entries {
		for _, member := range entry.Members {
			if name := p.deviceNamesByIEEE[member.IEEEAddress]; name != "" {
				p.groupMembersByName[entry.FriendlyName] = append(p.groupMembersByName[entry.FriendlyName], name)
			}
		}
	}
	p.mu.Unlock()
}

func (p *Publisher) acknowledgeCommand(message MQTTMessage) {
	target := strings.TrimSuffix(strings.TrimPrefix(message.Topic, "zigbee2mqtt/"), "/set")
	p.mu.RLock()
	var names []string
	if p.deviceNames[target] {
		names = []string{target}
	} else {
		names = append(names, p.groupMembersByName[target]...)
	}
	p.mu.RUnlock()
	for _, name := range names {
		token := p.client.Publish("zigbee2mqtt/"+name, 0, false, message.Payload)
		token.Wait()
	}
}

// PublishNetworkmapResponse publishes a bridge/response/networkmap payload,
// as zigbee2mqtt does when a topology scan completes.
func (p *Publisher) PublishNetworkmapResponse(payload []byte) error {
	token := p.client.Publish("zigbee2mqtt/bridge/response/networkmap", 0, false, payload)
	token.Wait()
	return token.Error()
}

// SubscribeNetworkmapRequests subscribes to the topology-scan request topic
// and sends received payloads to the returned channel.
func (p *Publisher) SubscribeNetworkmapRequests() (<-chan MQTTMessage, error) {
	ch := make(chan MQTTMessage, 8)
	token := p.client.Subscribe("zigbee2mqtt/bridge/request/networkmap", 0, func(_ mqtt.Client, msg mqtt.Message) {
		message := MQTTMessage{
			Topic:   msg.Topic(),
			Payload: msg.Payload(),
		}
		select {
		case ch <- message:
		default:
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
