package zigbee

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

func (a *ZigbeeAdapter) handleBridgeInfo(payload []byte) {
	var raw z2mBridgeInfo
	if err := json.Unmarshal(payload, &raw); err != nil {
		logger.Warn("failed to parse bridge/info", "error", err)
		return
	}
	id, info, err := mapBridgeInfo(raw)
	if err != nil {
		logger.Warn("ignoring incomplete bridge/info", "error", err)
		return
	}
	a.bridgeInfo[id] = info

	if a.networkOnline.Load() {
		a.lastBridgeSignal = time.Now()
		if dev, ok := a.stateReader.GetDevice(id); ok && dev.Type == device.Hub {
			a.applyAvailability(dev, true, true)
		}
	}

	a.mu.RLock()
	_, known := a.knownDevices[id]
	a.mu.RUnlock()
	if known {
		a.publishBridgeInfo(id, info)
	}
}

func (a *ZigbeeAdapter) publishBridgeInfo(id device.DeviceID, info zigbeemetadata.BridgeInfo) {
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventZigbeeBridgeInfoSynced,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   info,
	})
}

func mapBridgeInfo(raw z2mBridgeInfo) (device.DeviceID, zigbeemetadata.BridgeInfo, error) {
	id := device.DeviceID(strings.ToLower(strings.TrimSpace(raw.Coordinator.IEEEAddress)))
	if id == "" {
		return "", zigbeemetadata.BridgeInfo{}, fmt.Errorf("coordinator IEEE address is missing")
	}
	info := zigbeemetadata.BridgeInfo{
		AdapterType:                     stringPointer(raw.Coordinator.Type),
		FirmwareVersion:                 scalarString(raw.Coordinator.Meta.Revision),
		Channel:                         raw.Network.Channel,
		PANID:                           raw.Network.PANID,
		ExtendedPANID:                   extendedPANIDString(raw.Network.ExtendedPANID),
		Zigbee2MQTTVersion:              stringPointer(raw.Version),
		Zigbee2MQTTCommit:               stringPointer(raw.Commit),
		ZigbeeHerdsmanVersion:           stringPointer(raw.Herdsman.Version),
		ZigbeeHerdsmanConvertersVersion: stringPointer(raw.Converters.Version),
	}
	metadata := zigbeemetadata.Normalize(zigbeemetadata.Metadata{BridgeInfo: &info})
	return id, *metadata.BridgeInfo, nil
}

func scalarString(raw json.RawMessage) *string {
	trimmed := strings.TrimSpace(string(raw))
	if trimmed == "" || trimmed == "null" {
		return nil
	}
	var value string
	if err := json.Unmarshal(raw, &value); err == nil {
		return stringPointer(value)
	}
	var number json.Number
	if err := json.Unmarshal(raw, &number); err == nil {
		return stringPointer(number.String())
	}
	return nil
}

func extendedPANIDString(raw json.RawMessage) *string {
	if value := scalarString(raw); value != nil {
		return value
	}
	var values []int
	if err := json.Unmarshal(raw, &values); err != nil || len(values) == 0 {
		return nil
	}
	var out strings.Builder
	out.WriteString("0x")
	for _, value := range values {
		if value < 0 || value > 255 {
			return nil
		}
		_, _ = fmt.Fprintf(&out, "%02x", value)
	}
	value := out.String()
	return &value
}
