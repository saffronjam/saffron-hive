package zigbeemetadata

import (
	"context"
	"sync"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

type persisterStore struct {
	mu          sync.Mutex
	bridgePrint map[device.DeviceID]string
	otaPrint    map[device.DeviceID]string
}

func (s *persisterStore) UpsertZigbeeBridgeMetadata(_ context.Context, metadata Metadata) (bool, error) {
	metadata = Normalize(metadata)
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.bridgePrint[metadata.DeviceID] == metadata.BridgeFingerprint {
		return false, nil
	}
	s.bridgePrint[metadata.DeviceID] = metadata.BridgeFingerprint
	return true, nil
}

func (s *persisterStore) MergeZigbeeOTAStatus(_ context.Context, id device.DeviceID, status OTAStatus) (bool, error) {
	fingerprint := ComputeOTAFingerprint(status)
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.otaPrint[id] == fingerprint {
		return false, nil
	}
	s.otaPrint[id] = fingerprint
	return true, nil
}

type recordingPublisher struct {
	mu     sync.Mutex
	events []eventbus.Event
}

func (p *recordingPublisher) Publish(event eventbus.Event) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.events = append(p.events, event)
}

func TestRunPersisterPublishesOnlyCommittedChanges(t *testing.T) {
	ctx := context.Background()
	store := &persisterStore{
		bridgePrint: make(map[device.DeviceID]string), otaPrint: make(map[device.DeviceID]string),
	}
	publisher := &recordingPublisher{}
	events := make(chan eventbus.Event, 4)
	done := make(chan struct{})
	go func() {
		RunPersister(ctx, publisher, events, store)
		close(done)
	}()
	metadata := Normalize(Metadata{DeviceID: "0xabc", IEEEAddress: "0xabc"})
	events <- eventbus.Event{Type: eventbus.EventZigbeeMetadataSynced, DeviceID: "0xabc", Payload: metadata}
	events <- eventbus.Event{Type: eventbus.EventZigbeeMetadataSynced, DeviceID: "0xabc", Payload: metadata}
	version := int64(2)
	ota := OTAStatus{LatestVersion: &version}
	events <- eventbus.Event{Type: eventbus.EventZigbeeOTAStatusChanged, DeviceID: "0xabc", Payload: ota}
	events <- eventbus.Event{Type: eventbus.EventZigbeeOTAStatusChanged, DeviceID: "0xabc", Payload: ota}
	close(events)
	<-done

	publisher.mu.Lock()
	defer publisher.mu.Unlock()
	if len(publisher.events) != 2 {
		t.Fatalf("metadata updated events = %d, want 2", len(publisher.events))
	}
	for _, event := range publisher.events {
		if event.Type != eventbus.EventZigbeeMetadataUpdated || event.DeviceID != "0xabc" {
			t.Fatalf("unexpected event: %+v", event)
		}
	}
}
