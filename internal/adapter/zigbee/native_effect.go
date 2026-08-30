package zigbee

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// terminatorHueEffect is the Hue-specific name for stopping an in-progress
// native effect; if it appears in a device's effect-cap values list, the
// device is treated as Hue for terminator purposes. Generic devices use
// terminatorDefault.
const (
	terminatorDefault   = "stop_effect"
	terminatorHueEffect = "stop_hue_effect"
)

type z2mEffectPayload struct {
	Effect string `json:"effect"`
}

type z2mStateGetPayload struct {
	State string `json:"state"`
}

const (
	philipsRawStateFlag  = 0x0001
	philipsRawEffectFlag = 0x0020

	nativeEffectReadDelay = 1100 * time.Millisecond
	nativeEffectTimeout   = 2900 * time.Millisecond
)

var philipsPersistentEffectCodes = map[string]byte{
	"candle":     0x01,
	"fireplace":  0x02,
	"colorloop":  0x03,
	"sunrise":    0x09,
	"sparkle":    0x0a,
	"opal":       0x0b,
	"glisten":    0x0c,
	"sunset":     0x0d,
	"underwater": 0x0e,
	"cosmos":     0x0f,
	"sunbeam":    0x10,
	"enchant":    0x11,
}

type pendingNativeEffect struct {
	deviceID     device.DeviceID
	name         string
	runID        string
	friendlyName string
	expectedCode byte
	awaitingRead bool
	readTimer    *time.Timer
	timeoutTimer *time.Timer
}

// TerminatorFor returns the native-effect terminator name for dev. If the
// device's effect capability values include "stop_hue_effect" the Hue
// terminator is returned; otherwise "stop_effect" is used.
func TerminatorFor(dev device.Device) string {
	for _, c := range dev.Capabilities {
		if c.Name != device.CapEffect {
			continue
		}
		for _, v := range c.Values {
			if v == terminatorHueEffect {
				return terminatorHueEffect
			}
		}
		return terminatorDefault
	}
	return terminatorDefault
}

// effectCapability returns the device's effect capability if it has one.
func effectCapability(dev device.Device) (device.Capability, bool) {
	for _, c := range dev.Capabilities {
		if c.Name == device.CapEffect {
			return c, true
		}
	}
	return device.Capability{}, false
}

// effectValueAllowed reports whether name appears in the effect capability's
// Values list. If the capability lists no values it is treated as not allowed:
// native effect names must be explicitly enumerated by the adapter for the
// request to be translated.
func effectValueAllowed(c device.Capability, name string) bool {
	for _, v := range c.Values {
		if v == name {
			return true
		}
	}
	return false
}

func (a *ZigbeeAdapter) handleNativeEffect(req device.NativeEffectRequest) error {
	a.mu.RLock()
	friendlyName, ok := a.idToName[req.DeviceID]
	a.mu.RUnlock()

	if !ok {
		return fmt.Errorf("native effect for unknown device %q", req.DeviceID)
	}

	dev, ok := a.stateReader.GetDevice(req.DeviceID)
	if !ok {
		return fmt.Errorf("native effect device %q is unavailable", req.DeviceID)
	}

	effectCap, ok := effectCapability(dev)
	if !ok {
		return fmt.Errorf("device %q has no native effect capability", req.DeviceID)
	}

	if !effectValueAllowed(effectCap, req.Name) {
		return fmt.Errorf("native effect %q is unavailable on device %q", req.Name, req.DeviceID)
	}

	data, err := json.Marshal(z2mEffectPayload{Effect: req.Name})
	if err != nil {
		return fmt.Errorf("marshal native effect: %w", err)
	}

	topic := "zigbee2mqtt/" + friendlyName + "/set"
	if err := a.mqtt.Publish(topic, 1, false, data); err != nil {
		a.publishNativeEffectResult(req.DeviceID, req.Name, req.Origin.ID, device.NativeEffectRunUnconfirmed, "publish_failed")
		return fmt.Errorf("publish native effect to %s: %w", topic, err)
	}
	a.trackNativeEffect(req.DeviceID, friendlyName, req.Name, req.Origin.ID)
	return nil
}

func (a *ZigbeeAdapter) trackNativeEffect(deviceID device.DeviceID, friendlyName, name, runID string) {
	expectedCode, verifiable := philipsPersistentEffectCodes[name]
	if !verifiable {
		a.publishNativeEffectResult(deviceID, name, runID, device.NativeEffectRunUnconfirmed, "not_verifiable")
		return
	}

	pending := &pendingNativeEffect{
		deviceID: deviceID, name: name, runID: runID,
		friendlyName: friendlyName, expectedCode: expectedCode,
	}
	pending.readTimer = time.AfterFunc(nativeEffectReadDelay, func() {
		a.requestNativeEffectReadback(pending)
	})
	pending.timeoutTimer = time.AfterFunc(nativeEffectTimeout, func() {
		a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "timeout")
	})
	a.nativeEffectMu.Lock()
	previous := a.pendingNativeEffects[deviceID]
	a.pendingNativeEffects[deviceID] = pending
	a.nativeEffectMu.Unlock()
	if previous != nil {
		if previous.readTimer != nil {
			previous.readTimer.Stop()
		}
		if previous.timeoutTimer != nil {
			previous.timeoutTimer.Stop()
		}
		a.publishNativeEffectResult(previous.deviceID, previous.name, previous.runID, device.NativeEffectRunUnconfirmed, "preempted")
	}

}

func (a *ZigbeeAdapter) requestNativeEffectReadback(pending *pendingNativeEffect) {
	a.nativeEffectMu.Lock()
	if a.pendingNativeEffects[pending.deviceID] != pending {
		a.nativeEffectMu.Unlock()
		return
	}
	pending.awaitingRead = true
	a.nativeEffectMu.Unlock()

	payload, err := json.Marshal(z2mStateGetPayload{})
	if err != nil {
		a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "get_encode_failed")
		return
	}
	topic := "zigbee2mqtt/" + pending.friendlyName + "/get"
	if err := a.mqtt.Publish(topic, 0, false, payload); err != nil {
		logger.Error("failed to request native effect readback", "topic", topic, "error", err)
		a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "get_publish_failed")
	}
}

func (a *ZigbeeAdapter) handleNativeEffectReadback(deviceID device.DeviceID, payload []byte) {
	a.nativeEffectMu.Lock()
	pending := a.pendingNativeEffects[deviceID]
	ready := pending != nil && pending.awaitingRead
	a.nativeEffectMu.Unlock()
	if !ready {
		return
	}

	var state z2mDeviceState
	if err := json.Unmarshal(payload, &state); err != nil || state.PhilipsRaw == nil || strings.TrimSpace(*state.PhilipsRaw) == "" {
		return
	}
	on, effectCode, hasEffect, ok := parsePhilipsRawEffect(*state.PhilipsRaw)
	if !ok {
		a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "malformed_readback")
		return
	}
	if !on {
		a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "device_off")
		return
	}
	if !hasEffect || effectCode == 0 {
		a.finishNativeEffect(pending, device.NativeEffectRunUnsupported, "effect_not_active")
		return
	}
	if effectCode == pending.expectedCode {
		a.finishNativeEffect(pending, device.NativeEffectRunConfirmed, "effect_active")
		return
	}
	a.finishNativeEffect(pending, device.NativeEffectRunUnconfirmed, "different_effect_active")
}

func parsePhilipsRawEffect(value string) (on bool, effectCode byte, hasEffect bool, ok bool) {
	raw, err := hex.DecodeString(strings.TrimSpace(value))
	if err != nil || len(raw) < 3 {
		return false, 0, false, false
	}
	flags := uint16(raw[0]) | uint16(raw[1])<<8
	if flags&philipsRawStateFlag == 0 {
		return false, 0, false, false
	}
	index := 2
	on = raw[index] != 0
	index++
	fieldSizes := []struct {
		flag uint16
		size int
	}{
		{0x0002, 1},
		{0x0004, 2},
		{0x0008, 4},
	}
	for _, field := range fieldSizes {
		if flags&field.flag == 0 {
			continue
		}
		index += field.size
		if index > len(raw) {
			return false, 0, false, false
		}
	}
	if flags&0x0010 != 0 {
		return false, 0, false, false
	}
	if flags&philipsRawEffectFlag == 0 {
		return on, 0, false, true
	}
	if index >= len(raw) {
		return false, 0, false, false
	}
	return on, raw[index], true, true
}

func (a *ZigbeeAdapter) finishNativeEffect(pending *pendingNativeEffect, status device.NativeEffectRunStatus, reason string) {
	a.nativeEffectMu.Lock()
	if a.pendingNativeEffects[pending.deviceID] != pending {
		a.nativeEffectMu.Unlock()
		return
	}
	delete(a.pendingNativeEffects, pending.deviceID)
	a.nativeEffectMu.Unlock()
	if pending.readTimer != nil {
		pending.readTimer.Stop()
	}
	if pending.timeoutTimer != nil {
		pending.timeoutTimer.Stop()
	}
	a.publishNativeEffectResult(pending.deviceID, pending.name, pending.runID, status, reason)
}

func (a *ZigbeeAdapter) publishNativeEffectResult(deviceID device.DeviceID, name, runID string, status device.NativeEffectRunStatus, reason string) {
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventNativeEffectResult,
		DeviceID:  string(deviceID),
		Timestamp: time.Now(),
		Payload: device.NativeEffectResult{
			DeviceID: deviceID, Name: name, RunID: runID, Status: status, Reason: reason,
		},
	})
}

func (a *ZigbeeAdapter) cancelNativeEffectVerifications() {
	a.nativeEffectMu.Lock()
	pending := make([]*pendingNativeEffect, 0, len(a.pendingNativeEffects))
	for _, item := range a.pendingNativeEffects {
		pending = append(pending, item)
	}
	a.pendingNativeEffects = make(map[device.DeviceID]*pendingNativeEffect)
	a.nativeEffectMu.Unlock()
	for _, item := range pending {
		if item.readTimer != nil {
			item.readTimer.Stop()
		}
		if item.timeoutTimer != nil {
			item.timeoutTimer.Stop()
		}
	}
}
