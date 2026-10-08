// Package zigbeemetadata defines and persists the Zigbee-specific device
// description reported by Zigbee2MQTT.
package zigbeemetadata

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
	"time"
	"unicode"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// Metadata is the Zigbee-specific identity and network description for one
// generic device. OTA fields are merged independently from bridge metadata.
type Metadata struct {
	DeviceID           device.DeviceID
	NetworkType        *string
	IEEEAddress        string
	NetworkAddress     *int64
	Supported          *bool
	InterviewState     *string
	InterviewCompleted *bool
	Interviewing       *bool
	Description        *string
	Manufacturer       *string
	ModelID            *string
	PowerSource        *string
	SoftwareBuildID    *string
	DateCode           *string
	Definition         *Definition
	BridgeInfo         *BridgeInfo
	OTA                OTAStatus
	BridgeFingerprint  string
	OTAFingerprint     string
	UpdatedAt          time.Time
}

// BridgeInfo contains stable coordinator, network, and Zigbee2MQTT runtime
// diagnostics reported by bridge/info.
type BridgeInfo struct {
	AdapterType                     *string
	FirmwareVersion                 *string
	Channel                         *int
	PANID                           *int64
	ExtendedPANID                   *string
	Zigbee2MQTTVersion              *string
	Zigbee2MQTTCommit               *string
	ZigbeeHerdsmanVersion           *string
	ZigbeeHerdsmanConvertersVersion *string
	Fingerprint                     string
}

// Definition describes the Zigbee2MQTT converter selected for a device.
type Definition struct {
	Model       *string `json:"model,omitempty"`
	Vendor      *string `json:"vendor,omitempty"`
	Description *string `json:"description,omitempty"`
	Source      *string `json:"source,omitempty"`
	Icon        *string `json:"icon,omitempty"`
	SupportsOTA *bool   `json:"supportsOta,omitempty"`
}

// OTAStatus is the firmware status reported in a device state payload.
type OTAStatus struct {
	State            *string
	InstalledVersion *int64
	LatestVersion    *int64
	Progress         *float64
}

type bridgeFingerprintShape struct {
	DeviceID           device.DeviceID `json:"deviceId"`
	NetworkType        *string         `json:"networkType,omitempty"`
	IEEEAddress        string          `json:"ieeeAddress"`
	NetworkAddress     *int64          `json:"networkAddress,omitempty"`
	Supported          *bool           `json:"supported,omitempty"`
	InterviewState     *string         `json:"interviewState,omitempty"`
	InterviewCompleted *bool           `json:"interviewCompleted,omitempty"`
	Interviewing       *bool           `json:"interviewing,omitempty"`
	Description        *string         `json:"description,omitempty"`
	Manufacturer       *string         `json:"manufacturer,omitempty"`
	ModelID            *string         `json:"modelId,omitempty"`
	PowerSource        *string         `json:"powerSource,omitempty"`
	SoftwareBuildID    *string         `json:"softwareBuildId,omitempty"`
	DateCode           *string         `json:"dateCode,omitempty"`
	Definition         *Definition     `json:"definition,omitempty"`
}

// Normalize returns a deterministic, display-safe metadata value.
func Normalize(in Metadata) Metadata {
	out := in
	out.IEEEAddress = strings.ToLower(cleanString(in.IEEEAddress))
	out.NetworkType = cleanStringPtr(in.NetworkType)
	out.InterviewState = cleanStringPtr(in.InterviewState)
	out.Description = cleanStringPtr(in.Description)
	out.Manufacturer = cleanStringPtr(in.Manufacturer)
	out.ModelID = cleanStringPtr(in.ModelID)
	out.PowerSource = cleanStringPtr(in.PowerSource)
	out.SoftwareBuildID = cleanStringPtr(in.SoftwareBuildID)
	out.DateCode = cleanStringPtr(in.DateCode)
	if in.Definition != nil {
		definition := *in.Definition
		definition.Model = cleanStringPtr(definition.Model)
		definition.Vendor = cleanStringPtr(definition.Vendor)
		definition.Description = cleanStringPtr(definition.Description)
		definition.Source = cleanStringPtr(definition.Source)
		definition.Icon = cleanStringPtr(definition.Icon)
		out.Definition = &definition
	}
	if in.BridgeInfo != nil {
		info := *in.BridgeInfo
		info.AdapterType = cleanStringPtr(info.AdapterType)
		info.FirmwareVersion = cleanStringPtr(info.FirmwareVersion)
		info.ExtendedPANID = cleanStringPtr(info.ExtendedPANID)
		if info.ExtendedPANID != nil {
			normalized := strings.ToLower(*info.ExtendedPANID)
			info.ExtendedPANID = &normalized
		}
		info.Zigbee2MQTTVersion = cleanStringPtr(info.Zigbee2MQTTVersion)
		info.Zigbee2MQTTCommit = cleanStringPtr(info.Zigbee2MQTTCommit)
		info.ZigbeeHerdsmanVersion = cleanStringPtr(info.ZigbeeHerdsmanVersion)
		info.ZigbeeHerdsmanConvertersVersion = cleanStringPtr(info.ZigbeeHerdsmanConvertersVersion)
		info.Fingerprint = ComputeBridgeInfoFingerprint(info)
		out.BridgeInfo = &info
	}
	out.OTA.State = cleanStringPtr(in.OTA.State)
	out.BridgeFingerprint = out.ComputeBridgeFingerprint()
	out.OTAFingerprint = ComputeOTAFingerprint(out.OTA)
	return out
}

// ComputeBridgeInfoFingerprint returns the deterministic fingerprint for the
// stable diagnostics selected from bridge/info.
func ComputeBridgeInfoFingerprint(info BridgeInfo) string {
	info.Fingerprint = ""
	b, _ := json.Marshal(info)
	return hashBytes(b)
}

// ComputeBridgeFingerprint returns the deterministic fingerprint for fields
// owned by bridge/devices.
func (m Metadata) ComputeBridgeFingerprint() string {
	shape := bridgeFingerprintShape{
		DeviceID: m.DeviceID, NetworkType: m.NetworkType, IEEEAddress: m.IEEEAddress,
		NetworkAddress: m.NetworkAddress, Supported: m.Supported,
		InterviewState: m.InterviewState, InterviewCompleted: m.InterviewCompleted,
		Interviewing: m.Interviewing, Description: m.Description,
		Manufacturer: m.Manufacturer, ModelID: m.ModelID, PowerSource: m.PowerSource,
		SoftwareBuildID: m.SoftwareBuildID, DateCode: m.DateCode,
		Definition: m.Definition,
	}
	b, _ := json.Marshal(shape)
	return hashBytes(b)
}

// ComputeOTAFingerprint returns the deterministic fingerprint for OTA state.
func ComputeOTAFingerprint(status OTAStatus) string {
	b, _ := json.Marshal(status)
	return hashBytes(b)
}

func hashBytes(b []byte) string {
	sum := sha256.Sum256(b)
	return hex.EncodeToString(sum[:])
}

func cleanStringPtr(value *string) *string {
	if value == nil {
		return nil
	}
	cleaned := cleanString(*value)
	if cleaned == "" {
		return nil
	}
	return &cleaned
}

func cleanString(value string) string {
	return strings.TrimSpace(strings.Map(func(r rune) rune {
		if unicode.IsControl(r) {
			return -1
		}
		return r
	}, value))
}
