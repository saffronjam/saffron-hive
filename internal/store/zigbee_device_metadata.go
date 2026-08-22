package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// GetZigbeeDeviceMetadata returns the Zigbee-specific detail for one device.
func (s *DB) GetZigbeeDeviceMetadata(ctx context.Context, id device.DeviceID) (*zigbeemetadata.Metadata, error) {
	row, err := s.q.GetZigbeeDeviceMetadata(ctx, id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get zigbee device metadata: %w", err)
	}
	metadata, err := zigbeeMetadataFromRow(row)
	if err != nil {
		return nil, err
	}
	groups, err := s.q.ListZigbeeProviderGroupsForDevice(ctx, string(id))
	if err != nil {
		return nil, fmt.Errorf("list zigbee device groups: %w", err)
	}
	metadata.Groups = make([]zigbeemetadata.GroupReference, 0, len(groups))
	for _, group := range groups {
		if group.ProviderGroupID == nil || group.ProviderEndpoint == nil {
			continue
		}
		metadata.Groups = append(metadata.Groups, zigbeemetadata.GroupReference{
			ID:              group.ID,
			ProviderGroupID: *group.ProviderGroupID,
			Name:            group.DisplayName,
			Endpoint:        int(*group.ProviderEndpoint),
		})
	}
	normalized := zigbeemetadata.Normalize(metadata)
	return &normalized, nil
}

// UpsertZigbeeBridgeMetadata merges bridge-owned metadata while retaining OTA
// state. It reports whether the stored value changed.
func (s *DB) UpsertZigbeeBridgeMetadata(ctx context.Context, metadata zigbeemetadata.Metadata) (bool, error) {
	metadata = zigbeemetadata.Normalize(metadata)
	endpoints, err := json.Marshal(metadata.Endpoints)
	if err != nil {
		return false, fmt.Errorf("encode zigbee endpoints: %w", err)
	}
	var definition zigbeemetadata.Definition
	if metadata.Definition != nil {
		definition = *metadata.Definition
	}
	ieeeAddress := optionalNonEmptyString(metadata.IEEEAddress)
	_, err = s.q.UpsertZigbeeBridgeMetadata(ctx, sqlite.UpsertZigbeeBridgeMetadataParams{
		DeviceID: metadata.DeviceID, NetworkType: metadata.NetworkType,
		IeeeAddress: ieeeAddress, NetworkAddress: metadata.NetworkAddress,
		Supported: metadata.Supported, InterviewState: metadata.InterviewState,
		InterviewCompleted: metadata.InterviewCompleted, Interviewing: metadata.Interviewing,
		Description: metadata.Description, Manufacturer: metadata.Manufacturer,
		ModelID: metadata.ModelID, PowerSource: metadata.PowerSource,
		SoftwareBuildID: metadata.SoftwareBuildID, DateCode: metadata.DateCode,
		DefinitionModel: definition.Model, DefinitionVendor: definition.Vendor,
		DefinitionDescription: definition.Description, DefinitionSource: definition.Source,
		DefinitionIcon: definition.Icon, DefinitionSupportsOta: definition.SupportsOTA,
		Endpoints: string(endpoints), BridgeFingerprint: metadata.BridgeFingerprint,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("upsert zigbee bridge metadata: %w", err)
	}
	return true, nil
}

// MergeZigbeeOTAStatus merges OTA state while retaining bridge-owned fields. It
// reports whether the stored value changed.
func (s *DB) MergeZigbeeOTAStatus(ctx context.Context, id device.DeviceID, status zigbeemetadata.OTAStatus) (bool, error) {
	metadata := zigbeemetadata.Normalize(zigbeemetadata.Metadata{OTA: status})
	_, err := s.q.MergeZigbeeOTAStatus(ctx, sqlite.MergeZigbeeOTAStatusParams{
		DeviceID: id, OtaState: metadata.OTA.State,
		OtaInstalledVersion: metadata.OTA.InstalledVersion,
		OtaLatestVersion:    metadata.OTA.LatestVersion,
		OtaProgress:         metadata.OTA.Progress,
		OtaFingerprint:      metadata.OTAFingerprint,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("merge zigbee OTA status: %w", err)
	}
	return true, nil
}

// ListZigbeeFirmwareCandidates returns OTA-capable devices with a concrete
// update offer reported by Zigbee2MQTT.
func (s *DB) ListZigbeeFirmwareCandidates(ctx context.Context) ([]zigbeemetadata.Metadata, error) {
	rows, err := s.q.ListZigbeeFirmwareCandidates(ctx)
	if err != nil {
		return nil, fmt.Errorf("list zigbee firmware candidates: %w", err)
	}
	out := make([]zigbeemetadata.Metadata, 0, len(rows))
	for _, row := range rows {
		metadata, err := zigbeeMetadataFromRow(row)
		if err != nil {
			return nil, err
		}
		out = append(out, metadata)
	}
	return out, nil
}

// DeleteZigbeeDeviceMetadata removes the Zigbee detail row for a device.
func (s *DB) DeleteZigbeeDeviceMetadata(ctx context.Context, id device.DeviceID) error {
	if err := s.q.DeleteZigbeeDeviceMetadata(ctx, id); err != nil {
		return fmt.Errorf("delete zigbee device metadata: %w", err)
	}
	return nil
}

func zigbeeMetadataFromRow(row sqlite.ZigbeeDeviceMetadatum) (zigbeemetadata.Metadata, error) {
	endpoints := []zigbeemetadata.Endpoint{}
	if err := json.Unmarshal([]byte(row.Endpoints), &endpoints); err != nil {
		return zigbeemetadata.Metadata{}, fmt.Errorf("decode zigbee endpoints for %s: %w", row.DeviceID, err)
	}
	metadata := zigbeemetadata.Metadata{
		DeviceID: row.DeviceID, NetworkType: row.NetworkType,
		NetworkAddress: row.NetworkAddress, Supported: row.Supported,
		InterviewState: row.InterviewState, InterviewCompleted: row.InterviewCompleted,
		Interviewing: row.Interviewing, Description: row.Description,
		Manufacturer: row.Manufacturer, ModelID: row.ModelID,
		PowerSource: row.PowerSource, SoftwareBuildID: row.SoftwareBuildID,
		DateCode: row.DateCode, Endpoints: endpoints,
		OTA: zigbeemetadata.OTAStatus{
			State: row.OtaState, InstalledVersion: row.OtaInstalledVersion,
			LatestVersion: row.OtaLatestVersion, Progress: row.OtaProgress,
		},
		BridgeFingerprint: row.BridgeFingerprint, OTAFingerprint: row.OtaFingerprint,
		UpdatedAt: row.UpdatedAt,
	}
	if row.IeeeAddress != nil {
		metadata.IEEEAddress = *row.IeeeAddress
	}
	if row.DefinitionModel != nil || row.DefinitionVendor != nil ||
		row.DefinitionDescription != nil || row.DefinitionSource != nil ||
		row.DefinitionIcon != nil || row.DefinitionSupportsOta != nil {
		metadata.Definition = &zigbeemetadata.Definition{
			Model: row.DefinitionModel, Vendor: row.DefinitionVendor,
			Description: row.DefinitionDescription, Source: row.DefinitionSource,
			Icon: row.DefinitionIcon, SupportsOTA: row.DefinitionSupportsOta,
		}
	}
	return metadata, nil
}

func optionalNonEmptyString(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
