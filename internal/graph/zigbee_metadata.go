package graph

import (
	"strconv"

	"github.com/saffronjam/saffron-hive/internal/deviceimage"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/zigbeedocs"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

func mapZigbeeDeviceMetadata(metadata zigbeemetadata.Metadata, vendors AddressVendorResolver) *model.Zigbee2MqttDeviceMetadata {
	imageSource := deviceimage.ResolveSource(metadata)
	out := &model.Zigbee2MqttDeviceMetadata{
		ImageCandidate: len(imageSource.Candidates) > 0,
		NetworkType:    metadata.NetworkType, NetworkAddress: intFromInt64(metadata.NetworkAddress),
		Supported: metadata.Supported, InterviewState: metadata.InterviewState,
		InterviewCompleted: metadata.InterviewCompleted, Interviewing: metadata.Interviewing,
		Description: metadata.Description, Manufacturer: metadata.Manufacturer,
		ModelID: metadata.ModelID, PowerSource: metadata.PowerSource,
		SoftwareBuildID: metadata.SoftwareBuildID, DateCode: metadata.DateCode,
		Ota: &model.Zigbee2MqttOtaStatus{
			State: metadata.OTA.State, InstalledVersion: versionString(metadata.OTA.InstalledVersion),
			LatestVersion: versionString(metadata.OTA.LatestVersion), Progress: metadata.OTA.Progress,
		},
	}
	if imageSource.Fingerprint != "" {
		out.ImageVersion = &imageSource.Fingerprint
	}
	if metadata.IEEEAddress != "" {
		out.IeeeAddress = &metadata.IEEEAddress
		if vendors != nil {
			if vendor, ok := vendors.Lookup(metadata.IEEEAddress); ok {
				out.AddressVendor = &vendor
			}
		}
	}
	if metadata.Definition != nil {
		definition := metadata.Definition
		out.Definition = &model.Zigbee2MqttDeviceDefinition{
			Model: definition.Model, Vendor: definition.Vendor,
			Description: definition.Description, Source: definition.Source,
			Icon: definition.Icon, SupportsOta: definition.SupportsOTA,
		}
		if definition.Model != nil {
			definitionURL := zigbeedocs.DefinitionURL(*definition.Model)
			out.DefinitionURL = &definitionURL
		}
	}
	if metadata.BridgeInfo != nil {
		info := metadata.BridgeInfo
		out.BridgeInfo = &model.Zigbee2MqttBridgeInfo{
			AdapterType: info.AdapterType, FirmwareVersion: info.FirmwareVersion,
			Channel: info.Channel, PanID: intFromInt64(info.PANID),
			ExtendedPanID:                   info.ExtendedPANID,
			Zigbee2MqttVersion:              info.Zigbee2MQTTVersion,
			Zigbee2MqttCommit:               info.Zigbee2MQTTCommit,
			ZigbeeHerdsmanVersion:           info.ZigbeeHerdsmanVersion,
			ZigbeeHerdsmanConvertersVersion: info.ZigbeeHerdsmanConvertersVersion,
		}
	}
	return out
}

func mapZigbeeDeviceDocumentation(document zigbeedocs.Documentation) *model.Zigbee2MqttDeviceDocumentation {
	return &model.Zigbee2MqttDeviceDocumentation{
		SourceURL:     document.SourceURL,
		LastCheckedAt: document.LastCheckedAt,
		Model:         optionalString(document.Model),
		Vendor:        optionalString(document.Vendor),
		Description:   optionalString(document.Description),
		Exposes:       append([]string(nil), document.Exposes...),
		BatteryType:   optionalString(document.BatteryType),
	}
}

func intFromInt64(value *int64) *int {
	if value == nil {
		return nil
	}
	out := int(*value)
	return &out
}

func versionString(value *int64) *string {
	if value == nil {
		return nil
	}
	out := strconv.FormatInt(*value, 10)
	return &out
}
