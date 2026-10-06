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
		case "temperature", "humidity", "pressure", "illuminance", "occupancy", "pir_detection", "presence", "contact", "orientation", "device_posture":
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
	"pir_detection":  device.CapOccupancy,
	"presence":       device.CapPresence,
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

// flagsCompositeSuffix names the composite form of a raw bitmask exposure:
// zigbee2mqtt publishes "<x>_composite" as named flags beside a numeric "<x>"
// carrying the same bits, and only the named form is useful to a person.
const flagsCompositeSuffix = "_composite"

// attributeFeature is an exposure Hive surfaces as a generic attribute rather
// than typed DeviceState: a setting, a command, or a diagnostic reading.
type attributeFeature struct {
	feature  z2mFeature
	category device.CapabilityCategory
}

// classifyFeature returns the Hive capability name and category of one
// exposure, or false when Hive does not surface it.
//
// Properties Hive models as typed state keep zigbee2mqtt's category. Every
// other exposure is classified by its access bits rather than its category tag,
// which converters set inconsistently: writable and reported is a setting,
// writable but never reported is a command, reported but read-only is a
// diagnostic reading.
func classifyFeature(f z2mFeature) (string, device.CapabilityCategory, bool) {
	if name, ok := knownCapabilities[f.Property]; ok {
		switch f.Category {
		case "config":
			return name, device.CapabilityCategoryConfiguration, true
		case "diagnostic":
			return name, device.CapabilityCategoryDiagnostic, true
		}
		return name, device.CapabilityCategoryState, true
	}
	if f.Property == "" {
		return "", "", false
	}
	access := device.CapabilityAccess(f.Access)
	writable := access&device.CapabilityAccessSet != 0
	reported := access&device.CapabilityAccessState != 0
	if f.Type == "composite" {
		if writable && reported && isFlagsComposite(f) {
			return f.Property, device.CapabilityCategoryConfiguration, true
		}
		return "", "", false
	}
	switch {
	case writable && !reported:
		if f.Type == "enum" || f.Type == "binary" {
			return f.Property, device.CapabilityCategoryCommand, true
		}
	case writable:
		if isScalarFeature(f) {
			return f.Property, device.CapabilityCategoryConfiguration, true
		}
	case reported:
		if isScalarFeature(f) {
			return f.Property, device.CapabilityCategoryDiagnostic, true
		}
	}
	return "", "", false
}

func isScalarFeature(f z2mFeature) bool {
	switch f.Type {
	case "binary", "numeric", "enum", "text":
		return true
	}
	return false
}

// isFlagsComposite reports whether a composite is a set of independent on/off
// flags, which Hive carries as one bitmask setting.
func isFlagsComposite(f z2mFeature) bool {
	if len(f.Features) == 0 || len(f.Features) > device.MaxFlags {
		return false
	}
	for _, child := range f.Features {
		if child.Type != "binary" || child.Property == "" {
			return false
		}
	}
	return true
}

func extractCapabilities(exposes []z2mFeature) []device.Capability {
	capabilities, _ := extractCapabilitiesWithAttributes(exposes)
	return capabilities
}

func extractCapabilitiesWithAttributes(exposes []z2mFeature) ([]device.Capability, map[string]attributeFeature) {
	features := capabilityFeatures(exposes)
	flagComposites := make(map[string]struct{})
	byProperty := make(map[string]z2mFeature, len(features))
	for _, f := range features {
		byProperty[f.Property] = f
		if _, category, ok := classifyFeature(f); ok && f.Type == "composite" && category == device.CapabilityCategoryConfiguration {
			flagComposites[f.Property] = struct{}{}
		}
	}

	seen := make(map[string]struct{})
	var caps []device.Capability
	attributes := make(map[string]attributeFeature)
	for _, f := range features {
		capName, category, ok := classifyFeature(f)
		if !ok {
			continue
		}
		if _, raw := flagComposites[f.Property+flagsCompositeSuffix]; raw {
			continue
		}
		if _, dup := seen[capName]; dup {
			continue
		}
		seen[capName] = struct{}{}
		capability := device.Capability{
			Name:        capName,
			Type:        f.Type,
			Label:       f.Label,
			Description: f.Description,
			Category:    category,
			Values:      f.Values,
			ValueMin:    f.ValueMin,
			ValueMax:    f.ValueMax,
			Unit:        f.Unit,
			Access:      device.CapabilityAccess(f.Access),
		}
		if f.Type == "composite" {
			capability.Type = device.CapabilityTypeFlags
			capability.Values = flagNames(f)
			if raw, ok := byProperty[strings.TrimSuffix(f.Property, flagsCompositeSuffix)]; ok && raw.Property != f.Property {
				capability.Label = raw.Label
				capability.Description = raw.Description
			}
		}
		caps = append(caps, capability)
		if _, typed := knownCapabilities[f.Property]; !typed {
			attributes[capName] = attributeFeature{feature: f, category: category}
		}
	}
	return caps, attributes
}

// flagNames labels each flag of a flags composite in bit order, preferring the
// description because converters put the meaningful text there ("0.00m -
// 0.25m") and a generated name in the label.
func flagNames(f z2mFeature) []string {
	names := make([]string, len(f.Features))
	for i, child := range f.Features {
		switch {
		case child.Description != "":
			names[i] = child.Description
		case child.Label != "":
			names[i] = child.Label
		default:
			names[i] = child.Property
		}
	}
	return names
}

// capabilityFeatures lists exposures that can become capabilities: grouping
// containers such as "light" are descended into, while a composite stays one
// exposure because its children are parts of a single value.
func capabilityFeatures(features []z2mFeature) []z2mFeature {
	var result []z2mFeature
	for _, f := range features {
		result = append(result, f)
		if f.Type != "composite" && len(f.Features) > 0 {
			result = append(result, capabilityFeatures(f.Features)...)
		}
	}
	return result
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

		capabilities, attributes := extractCapabilitiesWithAttributes(exposes)
		dev := device.Device{
			ID:           id,
			FriendlyName: d.FriendlyName,
			Source:       device.SourceZigbee2MQTT,
			Type:         devType,
			Capabilities: capabilities,
		}

		print := device.AdapterFingerprint(dev)
		a.mu.Lock()
		prev, wasKnown := a.knownDevices[id]
		oldName := a.idToName[id]
		if oldName != "" && oldName != d.FriendlyName {
			delete(a.nameToID, oldName)
		}
		a.ieeeToID[d.IEEEAddress] = id
		a.nameToID[d.FriendlyName] = id
		a.idToName[id] = d.FriendlyName
		a.knownDevices[id] = print
		a.attributeFeatures[id] = attributes
		a.mu.Unlock()

		if pending, ok := a.pendingAvailability[d.FriendlyName]; ok {
			a.deviceAvailability[id] = pending
			delete(a.pendingAvailability, d.FriendlyName)
		}
		if existing, ok := a.stateReader.GetDevice(id); ok {
			dev.LastSeen = existing.LastSeen
		}
		dev.Available = a.effectiveAvailability(dev)
		if dev.Available {
			switch {
			case dev.Type == device.Hub && !a.lastBridgeSignal.IsZero():
				dev.LastSeen = a.lastBridgeSignal
			case a.deviceAvailability[id].known && a.deviceAvailability[id].online:
				dev.LastSeen = a.deviceAvailability[id].reported
			}
		}

		a.stateWriter.Register(dev)

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
		if devType == device.Hub {
			if info, ok := a.bridgeInfo[id]; ok {
				a.publishBridgeInfo(id, info)
			}
		}
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
		delete(a.attributeFeatures, id)
		delete(a.deviceAvailability, id)
		delete(a.bridgeInfo, id)
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
