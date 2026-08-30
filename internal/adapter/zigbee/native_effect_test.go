package zigbee

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type capturedLog struct {
	level slog.Level
	msg   string
}

type captureHandler struct {
	mu      sync.Mutex
	entries []capturedLog
}

func (h *captureHandler) Enabled(_ context.Context, _ slog.Level) bool { return true }

func (h *captureHandler) Handle(_ context.Context, r slog.Record) error {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.entries = append(h.entries, capturedLog{level: r.Level, msg: r.Message})
	return nil
}

func (h *captureHandler) WithAttrs(_ []slog.Attr) slog.Handler { return h }
func (h *captureHandler) WithGroup(_ string) slog.Handler      { return h }

func (h *captureHandler) snapshot() []capturedLog {
	h.mu.Lock()
	defer h.mu.Unlock()
	out := make([]capturedLog, len(h.entries))
	copy(out, h.entries)
	return out
}

// installCaptureLogger swaps slog.Default for one that records log records into
// the returned handler. The original default is restored on test cleanup.
func installCaptureLogger(t *testing.T) *captureHandler {
	t.Helper()
	prev := slog.Default()
	h := &captureHandler{}
	slog.SetDefault(slog.New(h))
	t.Cleanup(func() { slog.SetDefault(prev) })
	return h
}

func waitForWarn(t *testing.T, h *captureHandler, substr string, timeout time.Duration) capturedLog {
	t.Helper()
	deadline := time.After(timeout)
	for {
		for _, e := range h.snapshot() {
			if e.level == slog.LevelWarn && containsString(e.msg, substr) {
				return e
			}
		}
		select {
		case <-deadline:
			t.Fatalf("timed out waiting for warn log containing %q", substr)
			return capturedLog{}
		case <-time.After(5 * time.Millisecond):
		}
	}
}

func containsString(s, sub string) bool {
	if sub == "" {
		return true
	}
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func registerEffectDevice(t *testing.T, adapter *ZigbeeAdapter, sw *mockStateWriter, sr *mockStateReader, friendlyName, ieee string, effectValues []string) device.Device {
	t.Helper()
	id := device.DeviceID(ieee)
	caps := []device.Capability{{Name: device.CapOnOff, Type: "binary"}}
	if effectValues != nil {
		caps = append(caps, device.Capability{
			Name:   device.CapEffect,
			Type:   "enum",
			Values: effectValues,
		})
	}
	dev := device.Device{
		ID:           id,
		FriendlyName: friendlyName,
		Source:       device.SourceZigbee2MQTT,
		Type:         device.Light,
		Available:    true,
		Capabilities: caps,
	}
	sw.Register(dev)
	sr.Set(dev)

	adapter.mu.Lock()
	adapter.nameToID[friendlyName] = id
	adapter.idToName[id] = friendlyName
	adapter.ieeeToID[ieee] = id
	adapter.mu.Unlock()

	return dev
}

func TestNativeEffect_PublishesMQTT(t *testing.T) {
	adapter, mqtt, _, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "hue_bulb", "0xhue", []string{"blink", "candle", "stop_effect", "stop_hue_effect"})

	if err := adapter.DispatchNativeEffect(context.Background(), device.NativeEffectRequest{DeviceID: device.DeviceID("0xhue"), Name: "candle", Origin: device.OriginEffect("run-1")}); err != nil {
		t.Fatal(err)
	}

	pubs := waitForPublish(mqtt, 1, 500*time.Millisecond)
	if len(pubs) == 0 {
		t.Fatal("expected at least one publish")
	}
	if pubs[0].Topic != "zigbee2mqtt/hue_bulb/set" {
		t.Fatalf("expected topic zigbee2mqtt/hue_bulb/set, got %s", pubs[0].Topic)
	}

	var payload z2mEffectPayload
	if err := json.Unmarshal(pubs[0].Payload, &payload); err != nil {
		t.Fatalf("failed to unmarshal payload: %v", err)
	}
	if payload.Effect != "candle" {
		t.Fatalf("expected effect candle, got %q", payload.Effect)
	}
}

func TestNativeEffect_NoEffectCapReturnsError(t *testing.T) {
	adapter, mqtt, _, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "plain_bulb", "0xplain", nil)

	if err := adapter.DispatchNativeEffect(context.Background(), device.NativeEffectRequest{DeviceID: device.DeviceID("0xplain"), Name: "candle", Origin: device.OriginEffect("run-2")}); err == nil {
		t.Fatal("expected missing capability error")
	}

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes, got %d", len(pubs))
	}
}

func TestNativeEffect_NameNotInValuesReturnsError(t *testing.T) {
	adapter, mqtt, _, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "ikea_bulb", "0xikea", []string{"blink", "stop_effect"})

	if err := adapter.DispatchNativeEffect(context.Background(), device.NativeEffectRequest{DeviceID: device.DeviceID("0xikea"), Name: "candle", Origin: device.OriginEffect("run-3")}); err == nil {
		t.Fatal("expected unsupported effect error")
	}

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes, got %d", len(pubs))
	}
}

func TestTerminatorFor_HueDevice(t *testing.T) {
	dev := device.Device{
		Capabilities: []device.Capability{
			{Name: device.CapEffect, Type: "enum", Values: []string{"blink", "candle", "stop_effect", "stop_hue_effect"}},
		},
	}
	if got := TerminatorFor(dev); got != "stop_hue_effect" {
		t.Fatalf("expected stop_hue_effect, got %q", got)
	}
}

func TestTerminatorFor_GenericDevice(t *testing.T) {
	dev := device.Device{
		Capabilities: []device.Capability{
			{Name: device.CapEffect, Type: "enum", Values: []string{"blink", "stop_effect"}},
		},
	}
	if got := TerminatorFor(dev); got != "stop_effect" {
		t.Fatalf("expected stop_effect, got %q", got)
	}
}

func TestTerminatorFor_NoEffectCap(t *testing.T) {
	dev := device.Device{
		Capabilities: []device.Capability{
			{Name: device.CapOnOff, Type: "binary"},
		},
	}
	if got := TerminatorFor(dev); got != "stop_effect" {
		t.Fatalf("expected default stop_effect, got %q", got)
	}
}

func TestNativeEffect_UnknownDeviceReturnsError(t *testing.T) {
	adapter, mqtt, _, _, _ := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	if err := adapter.DispatchNativeEffect(context.Background(), device.NativeEffectRequest{DeviceID: device.DeviceID("0xunknown"), Name: "candle", Origin: device.OriginEffect("run-4")}); err == nil {
		t.Fatal("expected unknown device error")
	}

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes, got %d", len(pubs))
	}
}

func TestParsePhilipsRawEffectFixtures(t *testing.T) {
	tests := []struct {
		name       string
		raw        string
		on         bool
		effectCode byte
		hasEffect  bool
	}{
		{name: "kitchen table without active effect", raw: "0b0001b7594d1e99", on: true},
		{name: "tree with sunset", raw: "ab0001706e81446a0d80", on: true, effectCode: 0x0d, hasEffect: true},
		{name: "tree with underwater", raw: "ab0001706e81446a0e80", on: true, effectCode: 0x0e, hasEffect: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			on, effectCode, hasEffect, ok := parsePhilipsRawEffect(tt.raw)
			if !ok || on != tt.on || effectCode != tt.effectCode || hasEffect != tt.hasEffect {
				t.Fatalf("parsePhilipsRawEffect(%q) = on=%v effect=%#x hasEffect=%v ok=%v", tt.raw, on, effectCode, hasEffect, ok)
			}
		})
	}
}

func TestNativeEffectReadbackClassifiesConfirmedAndUnsupported(t *testing.T) {
	tests := []struct {
		name   string
		raw    string
		status device.NativeEffectRunStatus
	}{
		{name: "confirmed", raw: "ab0001706e81446a0e80", status: device.NativeEffectRunConfirmed},
		{name: "unsupported", raw: "0b0001b7594d1e99", status: device.NativeEffectRunUnsupported},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			adapter, _, bus, _, _ := newTestAdapterWithReader()
			adapter.trackNativeEffect("lamp", "lamp", "underwater", "run-1")
			adapter.nativeEffectMu.Lock()
			pending := adapter.pendingNativeEffects["lamp"]
			adapter.nativeEffectMu.Unlock()
			pending.readTimer.Stop()
			adapter.requestNativeEffectReadback(pending)
			adapter.handleNativeEffectReadback("lamp", []byte(`{"state":"ON","philips_raw":"`+tt.raw+`"}`))
			adapter.cancelNativeEffectVerifications()

			for _, event := range bus.getEvents() {
				result, ok := event.Payload.(device.NativeEffectResult)
				if event.Type == eventbus.EventNativeEffectResult && ok {
					if result.Status != tt.status || result.RunID != "run-1" || result.Name != "underwater" {
						t.Fatalf("unexpected result: %+v", result)
					}
					return
				}
			}
			t.Fatal("native effect result was not published")
		})
	}
}
