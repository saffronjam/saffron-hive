// Package zigbeemetadata defines and persists the Zigbee-specific device
// description reported by Zigbee2MQTT.
package zigbeemetadata

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
	"strings"
	"time"
	"unicode"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// Metadata is the Zigbee-specific identity and endpoint description for one
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
	Endpoints          []Endpoint
	OTA                OTAStatus
	Groups             []GroupReference
	BridgeFingerprint  string
	OTAFingerprint     string
	UpdatedAt          time.Time
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

// Endpoint is one Zigbee endpoint and its configured cluster relationships.
type Endpoint struct {
	ID             int         `json:"id"`
	ProfileID      *int        `json:"profileId,omitempty"`
	DeviceID       *int        `json:"deviceId,omitempty"`
	InputClusters  []string    `json:"inputClusters"`
	OutputClusters []string    `json:"outputClusters"`
	Bindings       []Binding   `json:"bindings"`
	Reportings     []Reporting `json:"reportings"`
}

// Binding is a cluster binding from one endpoint to another endpoint or group.
type Binding struct {
	Cluster           string  `json:"cluster"`
	TargetType        string  `json:"targetType"`
	TargetIEEEAddress *string `json:"targetIeeeAddress,omitempty"`
	TargetEndpoint    *int    `json:"targetEndpoint,omitempty"`
	TargetGroupID     *int    `json:"targetGroupId,omitempty"`
}

// Reporting is one configured Zigbee attribute-reporting rule.
type Reporting struct {
	Cluster               string   `json:"cluster"`
	Attribute             string   `json:"attribute"`
	MinimumReportInterval *int     `json:"minimumReportInterval,omitempty"`
	MaximumReportInterval *int     `json:"maximumReportInterval,omitempty"`
	ReportableChange      *float64 `json:"reportableChange,omitempty"`
}

// OTAStatus is the firmware status reported in a device state payload.
type OTAStatus struct {
	State            *string
	InstalledVersion *int64
	LatestVersion    *int64
	Progress         *float64
}

// GroupReference describes a provider-owned Zigbee group containing a device
// endpoint.
type GroupReference struct {
	ID              string
	ProviderGroupID string
	Name            string
	Endpoint        int
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
	Endpoints          []Endpoint      `json:"endpoints"`
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
	out.OTA.State = cleanStringPtr(in.OTA.State)
	out.Endpoints = append([]Endpoint{}, in.Endpoints...)
	for i := range out.Endpoints {
		ep := &out.Endpoints[i]
		ep.InputClusters = cleanSortedStrings(ep.InputClusters)
		ep.OutputClusters = cleanSortedStrings(ep.OutputClusters)
		ep.Bindings = append([]Binding{}, ep.Bindings...)
		for j := range ep.Bindings {
			ep.Bindings[j].Cluster = cleanString(ep.Bindings[j].Cluster)
			ep.Bindings[j].TargetType = cleanString(ep.Bindings[j].TargetType)
			ep.Bindings[j].TargetIEEEAddress = cleanStringPtr(ep.Bindings[j].TargetIEEEAddress)
		}
		sort.Slice(ep.Bindings, func(a, b int) bool {
			left, _ := json.Marshal(ep.Bindings[a])
			right, _ := json.Marshal(ep.Bindings[b])
			return string(left) < string(right)
		})
		ep.Reportings = append([]Reporting{}, ep.Reportings...)
		for j := range ep.Reportings {
			ep.Reportings[j].Cluster = cleanString(ep.Reportings[j].Cluster)
			ep.Reportings[j].Attribute = cleanString(ep.Reportings[j].Attribute)
		}
		sort.Slice(ep.Reportings, func(a, b int) bool {
			left, _ := json.Marshal(ep.Reportings[a])
			right, _ := json.Marshal(ep.Reportings[b])
			return string(left) < string(right)
		})
	}
	sort.Slice(out.Endpoints, func(i, j int) bool { return out.Endpoints[i].ID < out.Endpoints[j].ID })
	out.Groups = append([]GroupReference{}, in.Groups...)
	sort.Slice(out.Groups, func(i, j int) bool {
		if out.Groups[i].ID == out.Groups[j].ID {
			return out.Groups[i].Endpoint < out.Groups[j].Endpoint
		}
		return out.Groups[i].ID < out.Groups[j].ID
	})
	out.BridgeFingerprint = out.ComputeBridgeFingerprint()
	out.OTAFingerprint = ComputeOTAFingerprint(out.OTA)
	return out
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
		Definition: m.Definition, Endpoints: m.Endpoints,
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

func cleanSortedStrings(values []string) []string {
	if len(values) == 0 {
		return []string{}
	}
	out := make([]string, 0, len(values))
	for _, value := range values {
		if value = cleanString(value); value != "" {
			out = append(out, value)
		}
	}
	sort.Strings(out)
	return out
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
