package store

import (
	"context"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

func TestZigbeeDeviceMetadataMergeAndIdempotency(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "0x54ef44100166fcae", FriendlyName: "Door sensor 1",
		Source: device.SourceZigbee2MQTT, Type: device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	networkType, interview, software, model, vendor, description :=
		"EndDevice", "SUCCESSFUL", "2019www.", "MCCGQ12LM", "Aqara", "Door and window sensor T1"
	networkAddress := int64(2710)
	supported, complete, otaSupport := true, true, false
	metadata := zigbeemetadata.Metadata{
		DeviceID: "0x54ef44100166fcae", IEEEAddress: "0x54ef44100166fcae",
		NetworkType: &networkType, NetworkAddress: &networkAddress, Supported: &supported,
		InterviewState: &interview, InterviewCompleted: &complete, SoftwareBuildID: &software,
		Definition: &zigbeemetadata.Definition{
			Model: &model, Vendor: &vendor, Description: &description, SupportsOTA: &otaSupport,
		},
		Endpoints: []zigbeemetadata.Endpoint{{
			ID: 1, InputClusters: []string{"ssIasZone", "genBasic"},
			OutputClusters: []string{"genOta"}, Bindings: []zigbeemetadata.Binding{},
			Reportings: []zigbeemetadata.Reporting{},
		}},
	}
	changed, err := s.UpsertZigbeeBridgeMetadata(ctx, metadata)
	if err != nil || !changed {
		t.Fatalf("first bridge upsert = (%v, %v), want changed", changed, err)
	}
	changed, err = s.UpsertZigbeeBridgeMetadata(ctx, metadata)
	if err != nil || changed {
		t.Fatalf("repeated bridge upsert = (%v, %v), want unchanged", changed, err)
	}

	otaState := "available"
	installed, latest := int64(1), int64(2)
	ota := zigbeemetadata.OTAStatus{State: &otaState, InstalledVersion: &installed, LatestVersion: &latest}
	changed, err = s.MergeZigbeeOTAStatus(ctx, metadata.DeviceID, ota)
	if err != nil || !changed {
		t.Fatalf("first OTA merge = (%v, %v), want changed", changed, err)
	}
	changed, err = s.MergeZigbeeOTAStatus(ctx, metadata.DeviceID, ota)
	if err != nil || changed {
		t.Fatalf("repeated OTA merge = (%v, %v), want unchanged", changed, err)
	}

	loaded, err := s.GetZigbeeDeviceMetadata(ctx, metadata.DeviceID)
	if err != nil || loaded == nil {
		t.Fatalf("get metadata: %v, %+v", err, loaded)
	}
	if loaded.SoftwareBuildID == nil || *loaded.SoftwareBuildID != software {
		t.Fatalf("software build = %v", loaded.SoftwareBuildID)
	}
	if loaded.OTA.LatestVersion == nil || *loaded.OTA.LatestVersion != latest {
		t.Fatalf("latest firmware = %v", loaded.OTA.LatestVersion)
	}
	if len(loaded.Endpoints) != 1 || loaded.Endpoints[0].InputClusters[0] != "genBasic" {
		t.Fatalf("canonical endpoints = %+v", loaded.Endpoints)
	}

	metadata.Manufacturer = stringPtr("LUMI")
	changed, err = s.UpsertZigbeeBridgeMetadata(ctx, metadata)
	if err != nil || !changed {
		t.Fatalf("changed bridge upsert = (%v, %v)", changed, err)
	}
	loaded, err = s.GetZigbeeDeviceMetadata(ctx, metadata.DeviceID)
	if err != nil || loaded.OTA.LatestVersion == nil || *loaded.OTA.LatestVersion != latest {
		t.Fatalf("bridge upsert did not retain OTA: %+v, %v", loaded, err)
	}

	candidates, err := s.ListZigbeeFirmwareCandidates(ctx)
	if err != nil || len(candidates) != 0 {
		t.Fatalf("non-OTA definition candidates = %d, %v", len(candidates), err)
	}
	*metadata.Definition.SupportsOTA = true
	if _, err := s.UpsertZigbeeBridgeMetadata(ctx, metadata); err != nil {
		t.Fatalf("enable OTA support: %v", err)
	}
	candidates, err = s.ListZigbeeFirmwareCandidates(ctx)
	if err != nil || len(candidates) != 1 {
		t.Fatalf("firmware candidates = %d, %v", len(candidates), err)
	}
}

func TestZigbeeDeviceMetadataProviderGroupsAndCascade(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "0xabc", FriendlyName: "Light", Source: device.SourceZigbee2MQTT, Type: device.Light,
	})
	if err != nil {
		t.Fatal(err)
	}
	if _, err := s.UpsertZigbeeBridgeMetadata(ctx, zigbeemetadata.Metadata{DeviceID: "0xabc", IEEEAddress: "0xabc"}); err != nil {
		t.Fatal(err)
	}
	_, err = s.SyncProviderGroups(ctx, device.ProviderGroupsSnapshot{
		Provider: GroupProviderZigbee2MQTT,
		Groups: []device.ProviderGroup{{
			ProviderGroupID: "7", Name: "Hall",
			Members: []device.ProviderGroupMember{{DeviceID: "0xabc", Endpoint: 2}},
		}},
	})
	if err != nil {
		t.Fatal(err)
	}
	metadata, err := s.GetZigbeeDeviceMetadata(ctx, "0xabc")
	if err != nil || metadata == nil || len(metadata.Groups) != 1 || metadata.Groups[0].Endpoint != 2 {
		t.Fatalf("provider groups = %+v, %v", metadata, err)
	}
	if err := s.DeleteDevice(ctx, "0xabc"); err != nil {
		t.Fatal(err)
	}
	metadata, err = s.GetZigbeeDeviceMetadata(ctx, "0xabc")
	if err != nil || metadata != nil {
		t.Fatalf("metadata after device delete = %+v, %v", metadata, err)
	}
}

func stringPtr(value string) *string { return &value }
