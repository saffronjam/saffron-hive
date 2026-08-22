package graph

import (
	"net/url"
	"strconv"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/deviceimage"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
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
		Endpoints: make([]*model.Zigbee2MqttEndpoint, 0, len(metadata.Endpoints)),
		Groups:    make([]*model.Zigbee2MqttGroupReference, 0, len(metadata.Groups)),
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
			definitionURL := zigbee2MQTTDefinitionURL(*definition.Model)
			out.DefinitionURL = &definitionURL
		}
	}
	for _, endpoint := range metadata.Endpoints {
		mapped := &model.Zigbee2MqttEndpoint{
			ID: endpoint.ID, ProfileID: endpoint.ProfileID, DeviceID: endpoint.DeviceID,
			InputClusters:  append([]string(nil), endpoint.InputClusters...),
			OutputClusters: append([]string(nil), endpoint.OutputClusters...),
			Bindings:       make([]*model.Zigbee2MqttBinding, 0, len(endpoint.Bindings)),
			Reportings:     make([]*model.Zigbee2MqttReporting, 0, len(endpoint.Reportings)),
		}
		for _, binding := range endpoint.Bindings {
			mapped.Bindings = append(mapped.Bindings, &model.Zigbee2MqttBinding{
				Cluster: binding.Cluster, TargetType: binding.TargetType,
				TargetIeeeAddress: binding.TargetIEEEAddress,
				TargetEndpoint:    binding.TargetEndpoint, TargetGroupID: binding.TargetGroupID,
			})
		}
		for _, reporting := range endpoint.Reportings {
			mapped.Reportings = append(mapped.Reportings, &model.Zigbee2MqttReporting{
				Cluster: reporting.Cluster, Attribute: reporting.Attribute,
				MinimumReportInterval: reporting.MinimumReportInterval,
				MaximumReportInterval: reporting.MaximumReportInterval,
				ReportableChange:      reporting.ReportableChange,
			})
		}
		out.Endpoints = append(out.Endpoints, mapped)
	}
	for _, group := range metadata.Groups {
		out.Groups = append(out.Groups, &model.Zigbee2MqttGroupReference{
			ID: group.ID, ProviderGroupID: group.ProviderGroupID,
			Name: group.Name, Endpoint: group.Endpoint,
		})
	}
	return out
}

func zigbee2MQTTDefinitionURL(model string) string {
	normalized := strings.NewReplacer("/", "_", "|", "_", " ", "_", ":", "_").Replace(model)
	return "https://www.zigbee2mqtt.io/devices/" + url.PathEscape(normalized) + ".html"
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
