package device

import (
	"context"
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

// NativeEffectSupportStatus is Hive's learned compatibility state for one device and effect.
type NativeEffectSupportStatus string

const (
	NativeEffectSupportConfirmed   NativeEffectSupportStatus = "confirmed"
	NativeEffectSupportUntested    NativeEffectSupportStatus = "untested"
	NativeEffectSupportUnsupported NativeEffectSupportStatus = "unsupported"
)

// NativeEffectRunStatus describes the observable outcome of one effect request.
type NativeEffectRunStatus string

const (
	NativeEffectRunConfirmed   NativeEffectRunStatus = "confirmed"
	NativeEffectRunUnsupported NativeEffectRunStatus = "unsupported"
	NativeEffectRunUnconfirmed NativeEffectRunStatus = "unconfirmed"
)

// NativeEffectResult is the payload for eventbus.EventNativeEffectResult.
type NativeEffectResult struct {
	DeviceID DeviceID              `json:"deviceId"`
	Name     string                `json:"name"`
	RunID    string                `json:"runId,omitempty"`
	Status   NativeEffectRunStatus `json:"status"`
	Reason   string                `json:"reason,omitempty"`
}

// NativeEffectSupportReader resolves learned compatibility for a device.
type NativeEffectSupportReader interface {
	Status(ctx context.Context, dev Device, name string) (NativeEffectSupportStatus, error)
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
