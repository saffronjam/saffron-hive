package zigbee

import (
	"encoding/json"
	"testing"
)

func TestMapBridgeMetadataDoorSensorT1(t *testing.T) {
	raw := []byte(`{
		"friendly_name":"Door sensor 1","ieee_address":"0x54ef44100166fcae",
		"type":"EndDevice","network_address":2710,"supported":true,
		"interview_state":"SUCCESSFUL","interview_completed":true,"interviewing":false,
		"manufacturer":"LUMI","model_id":"lumi.magnet.agl02","power_source":"Battery",
		"software_build_id":"2019\u0000www.","date_code":"20230109",
		"definition":{"model":"MCCGQ12LM","vendor":"Aqara","description":"Door and window sensor T1","source":"native","supports_ota":false,"exposes":[]},
		"endpoints":{"1":{"bindings":[],"clusters":{"input":["ssIasZone","genBasic","genIdentify","genPowerCfg"],"output":["genOta"]},"configured_reportings":[]}}
	}`)
	var dto z2mBridgeDevice
	if err := json.Unmarshal(raw, &dto); err != nil {
		t.Fatal(err)
	}
	metadata := mapBridgeMetadata(dto)
	if metadata.SoftwareBuildID == nil || *metadata.SoftwareBuildID != "2019www." {
		t.Fatalf("sanitized software build = %v", metadata.SoftwareBuildID)
	}
	if metadata.NetworkAddress == nil || *metadata.NetworkAddress != 2710 {
		t.Fatalf("network address = %v", metadata.NetworkAddress)
	}
	if metadata.Definition == nil || metadata.Definition.Model == nil || *metadata.Definition.Model != "MCCGQ12LM" {
		t.Fatalf("definition = %+v", metadata.Definition)
	}
	if len(metadata.Endpoints) != 1 || metadata.Endpoints[0].InputClusters[0] != "genBasic" {
		t.Fatalf("endpoints = %+v", metadata.Endpoints)
	}
	if metadata.BridgeFingerprint == "" {
		t.Fatal("bridge fingerprint is empty")
	}
}

func TestMapBridgeMetadataP100AndRelationships(t *testing.T) {
	raw := []byte(`{
		"friendly_name":"Multi-state sensor 1","ieee_address":"0x54ef4410015e4b68",
		"type":"EndDevice","network_address":173,"supported":true,
		"interview_state":"SUCCESSFUL","interview_completed":true,"interviewing":false,
		"manufacturer":"Aqara","model_id":"lumi.vibration.agl002","power_source":"Battery","date_code":"20260615",
		"definition":{"model":"DWZTCGQ11LM","vendor":"Aqara","description":"Multi-state sensor P100","source":"native","supports_ota":true,"exposes":[]},
		"endpoints":{
			"2":{"profile_id":260,"device_id":3,"bindings":[],"clusters":{"input":["genAnalogInput"],"output":[]},"configured_reportings":[]},
			"1":{"bindings":[{"cluster":"genOnOff","target":{"type":"endpoint","ieee_address":"0xd878f0fffe66b02b","endpoint":1}},{"cluster":"genGroups","target":{"type":"group","id":7}}],"clusters":{"input":["manuSpecificLumi","genBasic"],"output":["genOta","genTime"]},"configured_reportings":[{"cluster":"genOnOff","attribute":"onOff","minimum_report_interval":0,"maximum_report_interval":65000,"reportable_change":1}]}
		}
	}`)
	var dto z2mBridgeDevice
	if err := json.Unmarshal(raw, &dto); err != nil {
		t.Fatal(err)
	}
	metadata := mapBridgeMetadata(dto)
	if metadata.SoftwareBuildID != nil {
		t.Fatalf("absent software build = %v", metadata.SoftwareBuildID)
	}
	if len(metadata.Endpoints) != 2 || metadata.Endpoints[0].ID != 1 || metadata.Endpoints[1].ID != 2 {
		t.Fatalf("endpoint ordering = %+v", metadata.Endpoints)
	}
	if len(metadata.Endpoints[0].Bindings) != 2 {
		t.Fatalf("bindings = %+v", metadata.Endpoints[0].Bindings)
	}
	var endpointBinding, groupBinding bool
	for _, binding := range metadata.Endpoints[0].Bindings {
		endpointBinding = endpointBinding || binding.TargetType == "endpoint"
		groupBinding = groupBinding || binding.TargetType == "group"
	}
	if !endpointBinding || !groupBinding {
		t.Fatalf("binding targets = %+v", metadata.Endpoints[0].Bindings)
	}
	if len(metadata.Endpoints[0].Reportings) != 1 || *metadata.Endpoints[0].Reportings[0].ReportableChange != 1 {
		t.Fatalf("reportings = %+v", metadata.Endpoints[0].Reportings)
	}
	if metadata.Definition == nil || metadata.Definition.SupportsOTA == nil || !*metadata.Definition.SupportsOTA {
		t.Fatalf("OTA support = %+v", metadata.Definition)
	}
}

func TestMapBridgeMetadataUnsupportedAndNullDefinition(t *testing.T) {
	var dto z2mBridgeDevice
	if err := json.Unmarshal([]byte(`{
		"ieee_address":"0x00124b0000000001","friendly_name":"Unknown",
		"type":"EndDevice","supported":false,"interview_state":"FAILED",
		"interview_completed":false,"interviewing":false,"definition":null,
		"endpoints":{}
	}`), &dto); err != nil {
		t.Fatal(err)
	}
	metadata := mapBridgeMetadata(dto)
	if metadata.Supported == nil || *metadata.Supported || metadata.Definition != nil {
		t.Fatalf("unsupported metadata = %+v", metadata)
	}
	if metadata.Endpoints == nil || len(metadata.Endpoints) != 0 {
		t.Fatalf("empty endpoints = %#v", metadata.Endpoints)
	}
}

func TestMapOTAStatusPresence(t *testing.T) {
	status, present, err := mapOTAStatus([]byte(`{"update":{"installed_version":-1,"latest_version":2,"state":null,"progress":42.5}}`))
	if err != nil || !present {
		t.Fatalf("map OTA = (%+v, %v, %v)", status, present, err)
	}
	if status.InstalledVersion == nil || *status.InstalledVersion != -1 || status.Progress == nil || *status.Progress != 42.5 {
		t.Fatalf("OTA status = %+v", status)
	}
	_, present, err = mapOTAStatus([]byte(`{"battery":100}`))
	if err != nil || present {
		t.Fatalf("absent OTA = (%v, %v)", present, err)
	}
}
