package graph

import (
	"encoding/json"
	"testing"
)

func TestZigbee2MQTTFrontendURLValidationAndNormalization(t *testing.T) {
	env := newTestEnv(t)
	mutation := `mutation($input: Zigbee2MqttConfigInput!) {
		updateZigbee2MqttConfig(input: $input) { frontendUrl enabled }
	}`
	base := map[string]any{
		"broker": "mqtt.example.com:1883", "username": "", "password": "",
		"useWss": false, "enabled": false, "scanScheduleEnabled": false,
	}
	base["frontendUrl"] = " https://z2m.example.com/app/// "
	response := env.query(t, mutation, map[string]any{"input": base})
	if len(response.Errors) != 0 {
		t.Fatalf("valid URL errors: %+v", response.Errors)
	}
	var data struct {
		Config struct {
			FrontendURL *string `json:"frontendUrl"`
			Enabled     bool    `json:"enabled"`
		} `json:"updateZigbee2MqttConfig"`
	}
	if err := json.Unmarshal(response.Data, &data); err != nil {
		t.Fatal(err)
	}
	if data.Config.FrontendURL == nil || *data.Config.FrontendURL != "https://z2m.example.com/app" || data.Config.Enabled {
		t.Fatalf("normalized config = %+v", data.Config)
	}

	for _, invalid := range []string{
		"z2m.example.com", "ftp://z2m.example.com", "https://user@z2m.example.com",
		"https://z2m.example.com?tab=devices", "https://z2m.example.com#devices",
	} {
		base["frontendUrl"] = invalid
		response = env.query(t, mutation, map[string]any{"input": base})
		if len(response.Errors) == 0 {
			t.Errorf("invalid URL %q was accepted", invalid)
		}
	}

	base["frontendUrl"] = ""
	response = env.query(t, mutation, map[string]any{"input": base})
	if len(response.Errors) != 0 || string(response.Data) != `{"updateZigbee2MqttConfig":{"frontendUrl":null,"enabled":false}}` {
		t.Fatalf("empty URL response = %s, %+v", response.Data, response.Errors)
	}
}
