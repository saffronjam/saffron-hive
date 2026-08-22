package zigbee

import (
	"encoding/json"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// detectDeviceType classifies a device from its zigbee2mqtt exposes list. A
// top-level "light" expose is a light; an action-reporting feature without
// on/off is a button; on/off (with or without power metering) is a plug;
// environmental readings without controls are a sensor.
func detectDeviceType(exposes []z2mFeature) device.DeviceType {
	for _, e := range exposes {
		if e.Type == "light" {
			return device.Light
		}
	}

	var hasOnOff, hasAction, hasSensor bool
	for _, f := range flattenFeatures(exposes) {
		switch f.Property {
		case "state":
			if f.Type == "binary" {
				hasOnOff = true
			}
		case "action":
			hasAction = true
		case "temperature", "humidity", "pressure", "illuminance", "occupancy", "contact", "orientation", "device_posture":
			hasSensor = true
		}
	}

	switch {
	case hasOnOff:
		return device.Plug
	case hasSensor:
		return device.Sensor
	case hasAction:
		return device.Button
	}
	return device.Unknown
}

var knownCapabilities = map[string]string{
	"state":          device.CapOnOff,
	"brightness":     device.CapBrightness,
	"color_temp":     device.CapColorTemp,
	"color":          device.CapColor,
	"temperature":    device.CapTemperature,
	"humidity":       device.CapHumidity,
	"pressure":       device.CapPressure,
	"illuminance":    device.CapIlluminance,
	"occupancy":      device.CapOccupancy,
	"contact":        device.CapContact,
	"orientation":    device.CapOrientation,
	"device_posture": device.CapDevicePosture,
	"linkquality":    device.CapLinkQuality,
	"battery":        device.CapBattery,
	"action":         device.CapAction,
	"effect":         device.CapEffect,
	"power":          device.CapPower,
	"voltage":        device.CapVoltage,
	"current":        device.CapCurrent,
	"energy":         device.CapEnergy,
}

var configurationProperties = map[string]struct{}{
	"orientation_detection": {},
	"movement_detection":    {},
	"fall_detection":        {},
	"vibration_detection":   {},
	"triple_tap_detection":  {},
}

func featureCategory(f z2mFeature) device.CapabilityCategory {
	switch f.Category {
	case "config":
		return device.CapabilityCategoryConfiguration
	case "diagnostic":
		return device.CapabilityCategoryDiagnostic
	}
	if _, ok := configurationProperties[f.Property]; ok {
		return device.CapabilityCategoryConfiguration
	}
	return device.CapabilityCategoryState
}

func capabilityName(f z2mFeature) (string, bool) {
	if name, ok := knownCapabilities[f.Property]; ok {
		return name, true
	}
	if featureCategory(f) == device.CapabilityCategoryConfiguration && f.Property != "" {
		switch f.Type {
		case "binary", "numeric", "enum", "text":
			return f.Property, true
		}
	}
	return "", false
}

func extractCapabilities(exposes []z2mFeature) []device.Capability {
	capabilities, _ := extractCapabilitiesWithConfiguration(exposes)
	return capabilities
}

func extractCapabilitiesWithConfiguration(exposes []z2mFeature) ([]device.Capability, map[string]z2mFeature) {
	seen := make(map[string]struct{})
	var caps []device.Capability
	configuration := make(map[string]z2mFeature)
	for _, f := range flattenFeatures(exposes) {
		capName, ok := capabilityName(f)
		if !ok {
			continue
		}
		if _, dup := seen[capName]; dup {
			continue
		}
		seen[capName] = struct{}{}
		caps = append(caps, device.Capability{
			Name:        capName,
			Type:        f.Type,
			Label:       f.Label,
			Description: f.Description,
			Category:    featureCategory(f),
			Values:      f.Values,
			ValueMin:    f.ValueMin,
			ValueMax:    f.ValueMax,
			Unit:        f.Unit,
			Access:      device.CapabilityAccess(f.Access),
		})
		if featureCategory(f) == device.CapabilityCategoryConfiguration {
			configuration[capName] = f
		}
	}
	return caps, configuration
}

func flattenFeatures(features []z2mFeature) []z2mFeature {
	var result []z2mFeature
	for _, f := range features {
		result = append(result, f)
		if len(f.Features) > 0 {
			result = append(result, flattenFeatures(f.Features)...)
		}
	}
	return result
}

func (a *ZigbeeAdapter) handleBridgeDevices(payload []byte) {
	var devices []z2mBridgeDevice
	if err := json.Unmarshal(payload, &devices); err != nil {
		logger.Error("failed to parse bridge/devices", "error", err)
		return
	}

	incoming := make(map[device.DeviceID]struct{})

	for _, d := range devices {
		// The coordinator registers as a hub: a placeable, room-assignable
		// device that the connectivity map anchors its mesh on, kept out of
		// every command and watch path by device.EnabledDevices.
		var exposes []z2mFeature
		if d.Definition != nil {
			exposes = d.Definition.Exposes
		}
		devType := detectDeviceType(exposes)
		if strings.EqualFold(d.Type, "coordinator") {
			devType = device.Hub
		}
		id := device.DeviceID(d.IEEEAddress)
		incoming[id] = struct{}{}

		capabilities, configuration := extractCapabilitiesWithConfiguration(exposes)
		dev := device.Device{
			ID:           id,
			FriendlyName: d.FriendlyName,
			Source:       device.SourceZigbee2MQTT,
			Type:         devType,
			Capabilities: capabilities,
			Available:    true,
		}

		a.stateWriter.Register(dev)

		print := device.AdapterFingerprint(dev)
		a.mu.Lock()
		prev, wasKnown := a.knownDevices[id]
		a.ieeeToID[d.IEEEAddress] = id
		a.nameToID[d.FriendlyName] = id
		a.idToName[id] = d.FriendlyName
		a.knownDevices[id] = print
		a.configurationFeatures[id] = configuration
		a.mu.Unlock()

		// zigbee2mqtt republishes the whole device list on every join, leave and
		// rename, and publishes it again once an interview completes with the
		// definition filled in. Comparing fingerprints is what turns that into a
		// single event when something actually changed, instead of one per
		// device per republish.
		switch {
		case !wasKnown:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceAdded,
				DeviceID:  string(id),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		case prev != print:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceSynced,
				DeviceID:  string(id),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		}

		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventZigbeeMetadataSynced,
			DeviceID:  string(id),
			Timestamp: time.Now(),
			Payload:   mapBridgeMetadata(d),
		})
	}

	a.mu.Lock()
	var removed []device.DeviceID
	for id := range a.knownDevices {
		if _, exists := incoming[id]; !exists {
			removed = append(removed, id)
		}
	}
	for _, id := range removed {
		delete(a.knownDevices, id)
		delete(a.configurationFeatures, id)
	}
	a.mu.Unlock()

	for _, id := range removed {
		a.stateWriter.Remove(id)
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceRemoved,
			DeviceID:  string(id),
			Timestamp: time.Now(),
		})
	}
}

func mapBridgeMetadata(d z2mBridgeDevice) zigbeemetadata.Metadata {
	metadata := zigbeemetadata.Metadata{
		DeviceID:           device.DeviceID(d.IEEEAddress),
		NetworkType:        stringPointer(d.Type),
		IEEEAddress:        d.IEEEAddress,
		NetworkAddress:     d.NetworkAddress,
		Supported:          d.Supported,
		InterviewState:     d.InterviewState,
		InterviewCompleted: d.InterviewCompleted,
		Interviewing:       d.Interviewing,
		Description:        d.Description,
		Manufacturer:       d.Manufacturer,
		ModelID:            d.ModelID,
		PowerSource:        d.PowerSource,
		SoftwareBuildID:    d.SoftwareBuildID,
		DateCode:           d.DateCode,
		Endpoints:          make([]zigbeemetadata.Endpoint, 0, len(d.Endpoints)),
	}
	if d.Definition != nil {
		metadata.Definition = &zigbeemetadata.Definition{
			Model:       d.Definition.Model,
			Vendor:      d.Definition.Vendor,
			Description: d.Definition.Description,
			Source:      d.Definition.Source,
			Icon:        d.Definition.Icon,
			SupportsOTA: d.Definition.SupportsOTA,
		}
	}
	endpointIDs := make([]int, 0, len(d.Endpoints))
	byID := make(map[int]z2mEndpoint, len(d.Endpoints))
	for rawID, endpoint := range d.Endpoints {
		id, err := strconv.Atoi(rawID)
		if err != nil {
			continue
		}
		endpointIDs = append(endpointIDs, id)
		byID[id] = endpoint
	}
	sort.Ints(endpointIDs)
	for _, id := range endpointIDs {
		raw := byID[id]
		endpoint := zigbeemetadata.Endpoint{
			ID:             id,
			ProfileID:      raw.ProfileID,
			DeviceID:       raw.DeviceID,
			InputClusters:  raw.Clusters.Input,
			OutputClusters: raw.Clusters.Output,
			Bindings:       make([]zigbeemetadata.Binding, 0, len(raw.Bindings)),
			Reportings:     make([]zigbeemetadata.Reporting, 0, len(raw.ConfiguredReportings)),
		}
		for _, binding := range raw.Bindings {
			endpoint.Bindings = append(endpoint.Bindings, zigbeemetadata.Binding{
				Cluster:           binding.Cluster,
				TargetType:        binding.Target.Type,
				TargetIEEEAddress: binding.Target.IEEEAddress,
				TargetEndpoint:    binding.Target.Endpoint,
				TargetGroupID:     binding.Target.ID,
			})
		}
		for _, reporting := range raw.ConfiguredReportings {
			endpoint.Reportings = append(endpoint.Reportings, zigbeemetadata.Reporting{
				Cluster:               reporting.Cluster,
				Attribute:             reporting.Attribute,
				MinimumReportInterval: reporting.MinimumReportInterval,
				MaximumReportInterval: reporting.MaximumReportInterval,
				ReportableChange:      reporting.ReportableChange,
			})
		}
		metadata.Endpoints = append(metadata.Endpoints, endpoint)
	}
	return zigbeemetadata.Normalize(metadata)
}

func stringPointer(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
