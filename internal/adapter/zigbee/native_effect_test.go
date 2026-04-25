package zigbee

import (
	"context"
	"encoding/json"
	"log/slog"
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
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
		Name:         friendlyName,
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
	adapter, mqtt, bus, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "hue_bulb", "0xhue", []string{"blink", "candle", "stop_effect", "stop_hue_effect"})

	device.RequestNativeEffect(bus, device.DeviceID("0xhue"), "candle", device.OriginEffect("run-1"))

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

func TestNativeEffect_NoEffectCap_DropsAndWarns(t *testing.T) {
	logs := installCaptureLogger(t)

	adapter, mqtt, bus, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "plain_bulb", "0xplain", nil)

	device.RequestNativeEffect(bus, device.DeviceID("0xplain"), "candle", device.OriginEffect("run-2"))

	waitForWarn(t, logs, "without effect capability", 500*time.Millisecond)

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes, got %d", len(pubs))
	}
}

func TestNativeEffect_NameNotInValues_DropsAndWarns(t *testing.T) {
	logs := installCaptureLogger(t)

	adapter, mqtt, bus, sw, sr := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	registerEffectDevice(t, adapter, sw, sr, "ikea_bulb", "0xikea", []string{"blink", "stop_effect"})

	device.RequestNativeEffect(bus, device.DeviceID("0xikea"), "candle", device.OriginEffect("run-3"))

	waitForWarn(t, logs, "not in device effect values", 500*time.Millisecond)

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

func TestNativeEffect_UnknownDevice_DropsAndWarns(t *testing.T) {
	logs := installCaptureLogger(t)

	adapter, mqtt, bus, _, _ := newTestAdapterWithReader()
	if err := adapter.Start(); err != nil {
		t.Fatal(err)
	}
	defer adapter.Stop()

	device.RequestNativeEffect(bus, device.DeviceID("0xunknown"), "candle", device.OriginEffect("run-4"))

	waitForWarn(t, logs, "native effect for unknown device", 500*time.Millisecond)

	pubs := mqtt.GetPublished()
	if len(pubs) != 0 {
		t.Fatalf("expected no publishes, got %d", len(pubs))
	}
}
