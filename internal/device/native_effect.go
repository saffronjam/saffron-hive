package device

import (
	"time"

	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// NativeEffectRequest is the payload for eventbus.EventNativeEffectRequested.
// It instructs an adapter to trigger a device's built-in (vendor-defined)
// effect by name. Native effects are actions, not state, and are independent
// of Command's desired-state contract.
//
// Origin tags the source that requested the effect (effect run, automation,
// scene, or direct user action). Adapters route the request best-effort: if
// the device lacks the effect capability, or the requested name is not in its
// values list, the request is logged and dropped.
type NativeEffectRequest struct {
	DeviceID DeviceID      `json:"deviceId"`
	Name     string        `json:"name"`
	Origin   CommandOrigin `json:"origin,omitzero"`
}

// RequestNativeEffect publishes EventNativeEffectRequested on bus for the
// given device, effect name, and origin. Returns the request that was
// published so callers can correlate it with downstream observations.
func RequestNativeEffect(bus eventbus.Publisher, deviceID DeviceID, name string, origin CommandOrigin) NativeEffectRequest {
	req := NativeEffectRequest{
		DeviceID: deviceID,
		Name:     name,
		Origin:   origin,
	}
	bus.Publish(eventbus.Event{
		Type:      eventbus.EventNativeEffectRequested,
		DeviceID:  string(deviceID),
		Timestamp: time.Now(),
		Payload:   req,
	})
	return req
}
