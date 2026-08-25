// Package nativeeffect learns device-specific compatibility from verified effect readbacks.
package nativeeffect

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log/slog"
	"sort"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

var logger = slog.Default().With("pkg", "native_effect")

// Store is the persistence surface used by compatibility learning.
type Store interface {
	ListNativeEffectObservations(context.Context) ([]store.NativeEffectObservation, error)
	UpsertNativeEffectObservation(context.Context, store.UpsertNativeEffectObservationParams) (bool, error)
	DeleteNativeEffectObservation(context.Context, device.DeviceID, string) error
	GetZigbeeDeviceMetadata(context.Context, device.DeviceID) (*zigbeemetadata.Metadata, error)
}

// Service resolves and persists learned native-effect compatibility.
type Service struct {
	bus             eventbus.Publisher
	store           Store
	reader          device.StateReader
	mu              sync.RWMutex
	observations    map[observationKey]store.NativeEffectObservation
	fingerprints    map[device.DeviceID]string
	evidenceDevices map[device.DeviceID]device.Device
}

type observationKey struct {
	deviceID device.DeviceID
	name     string
}

// New creates a compatibility service.
func New(bus eventbus.Publisher, st Store, reader device.StateReader) *Service {
	return &Service{
		bus: bus, store: st, reader: reader,
		observations:    make(map[observationKey]store.NativeEffectObservation),
		fingerprints:    make(map[device.DeviceID]string),
		evidenceDevices: make(map[device.DeviceID]device.Device),
	}
}

// Hydrate loads learned compatibility before the service begins handling requests.
func (s *Service) Hydrate(ctx context.Context) error {
	rows, err := s.store.ListNativeEffectObservations(ctx)
	if err != nil {
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	for _, row := range rows {
		s.observations[observationKey{deviceID: row.DeviceID, name: row.EffectName}] = row
	}
	return nil
}

// Run consumes verification and evidence-change events until ctx is cancelled.
func (s *Service) Run(ctx context.Context, events <-chan eventbus.Event) {
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-events:
			if !ok {
				return
			}
			switch event.Type {
			case eventbus.EventNativeEffectResult:
				result, ok := event.Payload.(device.NativeEffectResult)
				if ok {
					s.persistResult(ctx, result)
				}
			case eventbus.EventZigbeeMetadataUpdated, eventbus.EventDeviceSynced:
				s.invalidateEvidence(event)
				s.publishChanged()
			}
		}
	}
}

// Status returns confirmed, unsupported, or untested for one advertised effect.
func (s *Service) Status(ctx context.Context, dev device.Device, name string) (device.NativeEffectSupportStatus, error) {
	key := observationKey{deviceID: dev.ID, name: name}
	s.mu.RLock()
	observation, ok := s.observations[key]
	s.mu.RUnlock()
	if !ok {
		return device.NativeEffectSupportUntested, nil
	}
	fingerprint, err := s.fingerprint(ctx, dev)
	if err != nil {
		return device.NativeEffectSupportUntested, err
	}
	if observation.EvidenceFingerprint != fingerprint {
		if err := s.store.DeleteNativeEffectObservation(ctx, dev.ID, name); err != nil {
			return device.NativeEffectSupportUntested, err
		}
		s.mu.Lock()
		delete(s.observations, key)
		s.mu.Unlock()
		s.publishChanged()
		return device.NativeEffectSupportUntested, nil
	}
	switch observation.Result {
	case string(device.NativeEffectSupportConfirmed):
		return device.NativeEffectSupportConfirmed, nil
	case string(device.NativeEffectSupportUnsupported):
		return device.NativeEffectSupportUnsupported, nil
	default:
		return device.NativeEffectSupportUntested, nil
	}
}

func (s *Service) persistResult(ctx context.Context, result device.NativeEffectResult) {
	if result.Status != device.NativeEffectRunConfirmed && result.Status != device.NativeEffectRunUnsupported {
		return
	}
	dev, ok := s.reader.GetDevice(result.DeviceID)
	if !ok {
		return
	}
	fingerprint, err := s.fingerprint(ctx, dev)
	if err != nil {
		logger.Error("compute native effect evidence fingerprint failed",
			slog.String("device_id", string(result.DeviceID)),
			slog.String("effect", result.Name),
			slog.String("error", err.Error()),
		)
		return
	}
	changed, err := s.store.UpsertNativeEffectObservation(ctx, store.UpsertNativeEffectObservationParams{
		DeviceID:            result.DeviceID,
		EffectName:          result.Name,
		Result:              string(result.Status),
		EvidenceFingerprint: fingerprint,
	})
	if err != nil {
		logger.Error("persist native effect observation failed",
			slog.String("device_id", string(result.DeviceID)),
			slog.String("effect", result.Name),
			slog.String("error", err.Error()),
		)
		return
	}
	s.mu.Lock()
	s.observations[observationKey{deviceID: result.DeviceID, name: result.Name}] = store.NativeEffectObservation{
		DeviceID: result.DeviceID, EffectName: result.Name, Result: string(result.Status),
		EvidenceFingerprint: fingerprint, ObservedAt: time.Now(),
	}
	s.mu.Unlock()
	if changed {
		s.publishChanged()
	}
}

type fingerprintShape struct {
	Source                    device.Source `json:"source"`
	EffectValues              []string      `json:"effectValues"`
	ModelID                   *string       `json:"modelId,omitempty"`
	SoftwareBuildID           *string       `json:"softwareBuildId,omitempty"`
	DefinitionModel           *string       `json:"definitionModel,omitempty"`
	DefinitionSource          *string       `json:"definitionSource,omitempty"`
	InstalledFirmwareVersion  *int64        `json:"installedFirmwareVersion,omitempty"`
	Zigbee2MQTTVersion        *string       `json:"zigbee2MqttVersion,omitempty"`
	Zigbee2MQTTCommit         *string       `json:"zigbee2MqttCommit,omitempty"`
	HerdsmanConvertersVersion *string       `json:"herdsmanConvertersVersion,omitempty"`
}

func (s *Service) fingerprint(ctx context.Context, dev device.Device) (string, error) {
	s.mu.RLock()
	if synced, ok := s.evidenceDevices[dev.ID]; ok {
		dev = synced
	}
	if fingerprint, ok := s.fingerprints[dev.ID]; ok {
		s.mu.RUnlock()
		return fingerprint, nil
	}
	s.mu.RUnlock()

	shape := fingerprintShape{Source: dev.Source}
	for _, capability := range dev.Capabilities {
		if capability.Name == device.CapEffect {
			shape.EffectValues = append(shape.EffectValues, capability.Values...)
		}
	}
	sort.Strings(shape.EffectValues)

	if dev.Source == device.SourceZigbee2MQTT {
		metadata, err := s.store.GetZigbeeDeviceMetadata(ctx, dev.ID)
		if err != nil {
			return "", fmt.Errorf("get device evidence: %w", err)
		}
		if metadata != nil {
			shape.ModelID = metadata.ModelID
			shape.SoftwareBuildID = metadata.SoftwareBuildID
			shape.InstalledFirmwareVersion = metadata.OTA.InstalledVersion
			if metadata.Definition != nil {
				shape.DefinitionModel = metadata.Definition.Model
				shape.DefinitionSource = metadata.Definition.Source
			}
		}
		for _, candidate := range s.reader.ListDevices() {
			if candidate.Source != device.SourceZigbee2MQTT || candidate.Type != device.Hub {
				continue
			}
			hubMetadata, err := s.store.GetZigbeeDeviceMetadata(ctx, candidate.ID)
			if err != nil {
				return "", fmt.Errorf("get provider evidence: %w", err)
			}
			if hubMetadata != nil && hubMetadata.BridgeInfo != nil {
				shape.Zigbee2MQTTVersion = hubMetadata.BridgeInfo.Zigbee2MQTTVersion
				shape.Zigbee2MQTTCommit = hubMetadata.BridgeInfo.Zigbee2MQTTCommit
				shape.HerdsmanConvertersVersion = hubMetadata.BridgeInfo.ZigbeeHerdsmanConvertersVersion
			}
			break
		}
	}

	encoded, err := json.Marshal(shape)
	if err != nil {
		return "", fmt.Errorf("encode native effect evidence: %w", err)
	}
	sum := sha256.Sum256(encoded)
	fingerprint := hex.EncodeToString(sum[:])
	s.mu.Lock()
	s.fingerprints[dev.ID] = fingerprint
	s.mu.Unlock()
	return fingerprint, nil
}

func (s *Service) invalidateEvidence(event eventbus.Event) {
	id := device.DeviceID(event.DeviceID)
	dev, found := s.reader.GetDevice(id)
	synced, hasSyncedDevice := event.Payload.(device.Device)
	if hasSyncedDevice {
		dev = synced
		id = synced.ID
		found = true
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if hasSyncedDevice {
		s.evidenceDevices[id] = synced
	}
	if found && dev.Type == device.Hub && dev.Source == device.SourceZigbee2MQTT {
		clear(s.fingerprints)
		return
	}
	delete(s.fingerprints, id)
}

func (s *Service) publishChanged() {
	at := time.Now()
	s.bus.Publish(eventbus.Event{
		Type:      eventbus.EventNativeEffectSupportChanged,
		Timestamp: at,
		Payload:   at,
	})
}
