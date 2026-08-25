package graph

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/zigbeedocs"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

type fixedAddressVendor struct{}

type fixedZigbeeDocumentation struct {
	document *zigbeedocs.Documentation
	err      error
	models   []string
}

func (f *fixedZigbeeDocumentation) Lookup(_ context.Context, model string) (*zigbeedocs.Documentation, error) {
	f.models = append(f.models, model)
	return f.document, f.err
}

func (fixedAddressVendor) Lookup(address string) (string, bool) {
	if address == "0x54ef44100166fcae" {
		return "Lumi United Technology Co., Ltd", true
	}
	return "", false
}

func TestDeviceZigbeeMetadataDetailAndSourceGate(t *testing.T) {
	env := newTestEnv(t)
	env.resolver.AddressVendors = fixedAddressVendor{}
	zigbeeDevice := device.Device{
		ID: "0x54ef44100166fcae", FriendlyName: "Door sensor 1",
		Source: device.SourceZigbee2MQTT, Type: device.Sensor,
	}
	env.stateReader.addDevice(zigbeeDevice)
	model, vendor, description, software := "MCCGQ12LM", "Aqara", "Door and window sensor T1", "2019www."
	networkAddress := int64(2710)
	supported := true
	env.store.zigbeeMetadata[zigbeeDevice.ID] = zigbeemetadata.Normalize(zigbeemetadata.Metadata{
		DeviceID: zigbeeDevice.ID, IEEEAddress: string(zigbeeDevice.ID),
		NetworkAddress: &networkAddress, Supported: &supported, SoftwareBuildID: &software,
		Definition: &zigbeemetadata.Definition{Model: &model, Vendor: &vendor, Description: &description},
		Endpoints: []zigbeemetadata.Endpoint{{
			ID: 1, InputClusters: []string{"genBasic"}, OutputClusters: []string{"genOta"},
			Bindings: []zigbeemetadata.Binding{}, Reportings: []zigbeemetadata.Reporting{},
		}},
	})

	response := env.query(t, `{
		device(id: "0x54ef44100166fcae") {
			zigbee2Mqtt {
				ieeeAddress addressVendor networkAddress supported softwareBuildId definitionUrl
				definition { model vendor description }
				ota { state installedVersion latestVersion progress }
				endpoints { id inputClusters outputClusters bindings { cluster } reportings { cluster } }
				groups { id }
			}
		}
	}`, nil)
	if len(response.Errors) != 0 {
		t.Fatalf("query errors: %+v", response.Errors)
	}
	var data struct {
		Device struct {
			Metadata struct {
				IEEEAddress, AddressVendor, SoftwareBuildID, DefinitionURL string
				NetworkAddress                                             int
				Supported                                                  bool
				Definition                                                 struct{ Model, Vendor, Description string }
				Endpoints                                                  []struct {
					ID                            int
					InputClusters, OutputClusters []string
				}
			} `json:"zigbee2Mqtt"`
		} `json:"device"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	metadata := data.Device.Metadata
	if metadata.NetworkAddress != 2710 || metadata.SoftwareBuildID != "2019www." || metadata.AddressVendor == "" {
		t.Fatalf("metadata = %+v", metadata)
	}
	if metadata.DefinitionURL != "https://www.zigbee2mqtt.io/devices/MCCGQ12LM.html" {
		t.Fatalf("definition URL = %q", metadata.DefinitionURL)
	}
	if len(metadata.Endpoints) != 1 || len(metadata.Endpoints[0].InputClusters) != 1 {
		t.Fatalf("endpoints = %+v", metadata.Endpoints)
	}

	tuyaDevice := device.Device{ID: "tuya-1", FriendlyName: "Switch", Source: device.SourceTuya, Type: device.Plug}
	env.stateReader.addDevice(tuyaDevice)
	env.store.zigbeeMetadata[tuyaDevice.ID] = zigbeemetadata.Metadata{DeviceID: tuyaDevice.ID, IEEEAddress: "should-not-resolve"}
	readsBefore := env.store.zigbeeMetadataReads
	response = env.query(t, `{ device(id: "tuya-1") { zigbee2Mqtt { ieeeAddress } } }`, nil)
	if len(response.Errors) != 0 || string(response.Data) != `{"device":{"zigbee2Mqtt":null}}` {
		t.Fatalf("non-zigbee response = %s, %+v", response.Data, response.Errors)
	}
	if env.store.zigbeeMetadataReads != readsBefore {
		t.Fatal("source-gated resolver read Zigbee metadata for a Tuya device")
	}
}

func TestZigbee2MQTTDefinitionURL(t *testing.T) {
	tests := map[string]string{
		"MCCGQ12LM":     "https://www.zigbee2mqtt.io/devices/MCCGQ12LM.html",
		"SP 120":        "https://www.zigbee2mqtt.io/devices/SP_120.html",
		"model/one:two": "https://www.zigbee2mqtt.io/devices/model_one_two.html",
	}
	for model, want := range tests {
		if got := zigbeedocs.DefinitionURL(model); got != want {
			t.Errorf("DefinitionURL(%q) = %q, want %q", model, got, want)
		}
	}
}

func TestMapZigbeeBridgeInfo(t *testing.T) {
	adapterType, firmware := "ZStack3x0", "20240710"
	channel := 20
	panID := int64(6754)
	mapped := mapZigbeeDeviceMetadata(zigbeemetadata.Metadata{
		BridgeInfo: &zigbeemetadata.BridgeInfo{
			AdapterType: &adapterType, FirmwareVersion: &firmware,
			Channel: &channel, PANID: &panID,
		},
	}, nil)
	if mapped.BridgeInfo == nil || mapped.BridgeInfo.AdapterType == nil || *mapped.BridgeInfo.AdapterType != adapterType {
		t.Fatalf("bridge info = %+v", mapped.BridgeInfo)
	}
	if mapped.BridgeInfo.Channel == nil || *mapped.BridgeInfo.Channel != channel ||
		mapped.BridgeInfo.PanID == nil || *mapped.BridgeInfo.PanID != int(panID) {
		t.Fatalf("network info = %+v", mapped.BridgeInfo)
	}
}

func TestDeviceZigbeeDocumentation(t *testing.T) {
	env := newTestEnv(t)
	d := device.Device{ID: "zigbee-docs", Source: device.SourceZigbee2MQTT, Type: device.Sensor}
	env.stateReader.addDevice(d)
	model := "SNZB-02P"
	env.store.zigbeeMetadata[d.ID] = zigbeemetadata.Normalize(zigbeemetadata.Metadata{
		DeviceID:   d.ID,
		Definition: &zigbeemetadata.Definition{Model: &model},
	})
	checkedAt := time.Date(2026, 8, 24, 12, 0, 0, 0, time.UTC)
	provider := &fixedZigbeeDocumentation{document: &zigbeedocs.Documentation{
		SourceURL: "https://www.zigbee2mqtt.io/devices/SNZB-02P.html", LastCheckedAt: checkedAt,
		Model: "SNZB-02P", Vendor: "SONOFF", Description: "Temperature and humidity sensor",
		Exposes: []string{"battery", "temperature", "humidity"}, BatteryType: "CR2477",
	}}
	env.resolver.ZigbeeDocumentation = provider

	response := env.query(t, `{
		device(id: "zigbee-docs") {
			zigbee2Mqtt {
				documentation { sourceUrl lastCheckedAt model vendor description exposes batteryType }
			}
		}
	}`, nil)
	if len(response.Errors) != 0 {
		t.Fatalf("query errors: %+v", response.Errors)
	}
	var data struct {
		Device struct {
			Metadata struct {
				Documentation struct {
					SourceURL, Model, Vendor, Description, BatteryType string
					LastCheckedAt                                      time.Time
					Exposes                                            []string
				} `json:"documentation"`
			} `json:"zigbee2Mqtt"`
		} `json:"device"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	documentation := data.Device.Metadata.Documentation
	if documentation.BatteryType != "CR2477" || documentation.Vendor != "SONOFF" || !documentation.LastCheckedAt.Equal(checkedAt) {
		t.Fatalf("documentation = %+v", documentation)
	}
	if len(provider.models) != 1 || provider.models[0] != model {
		t.Fatalf("looked up models = %#v", provider.models)
	}
}

func TestDeviceZigbeeDocumentationFailureIsOptional(t *testing.T) {
	env := newTestEnv(t)
	d := device.Device{ID: "zigbee-docs-error", Source: device.SourceZigbee2MQTT, Type: device.Sensor}
	env.stateReader.addDevice(d)
	model := "SNZB-02P"
	env.store.zigbeeMetadata[d.ID] = zigbeemetadata.Normalize(zigbeemetadata.Metadata{
		DeviceID:   d.ID,
		Definition: &zigbeemetadata.Definition{Model: &model},
	})
	env.resolver.ZigbeeDocumentation = &fixedZigbeeDocumentation{err: errors.New("upstream unavailable")}
	response := env.query(t, `{ device(id: "zigbee-docs-error") { zigbee2Mqtt { supported documentation { batteryType } } } }`, nil)
	if len(response.Errors) != 0 || string(response.Data) != `{"device":{"zigbee2Mqtt":{"supported":null,"documentation":null}}}` {
		t.Fatalf("optional documentation response = %s, %+v", response.Data, response.Errors)
	}
}

func TestDeviceListDoesNotResolveZigbeeMetadata(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "z1", Source: device.SourceZigbee2MQTT, Type: device.Sensor})
	response := env.query(t, `{ devices { id source type } }`, nil)
	if len(response.Errors) != 0 {
		t.Fatalf("query errors: %+v", response.Errors)
	}
	if env.store.zigbeeMetadataReads != 0 {
		t.Fatalf("metadata reads = %d", env.store.zigbeeMetadataReads)
	}
}

func TestDeviceZigbeeMetadataAllowsUnsupportedWithoutDefinition(t *testing.T) {
	env := newTestEnv(t)
	d := device.Device{ID: "0xunsupported", Source: device.SourceZigbee2MQTT, Type: device.Unknown}
	env.stateReader.addDevice(d)
	supported := false
	env.store.zigbeeMetadata[d.ID] = zigbeemetadata.Normalize(zigbeemetadata.Metadata{
		DeviceID: d.ID, IEEEAddress: string(d.ID), Supported: &supported,
	})
	response := env.query(t, `{ device(id: "0xunsupported") { zigbee2Mqtt { supported definition { model } endpoints { id } } } }`, nil)
	if len(response.Errors) != 0 || string(response.Data) != `{"device":{"zigbee2Mqtt":{"supported":false,"definition":null,"endpoints":[]}}}` {
		t.Fatalf("unsupported response = %s, %+v", response.Data, response.Errors)
	}
}
