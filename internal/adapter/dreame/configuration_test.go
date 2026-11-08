package dreame

import (
	"encoding/json"
	"net/http"
	"reflect"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestConfigurationUsesReportedValuesAndValidatedWrites(t *testing.T) {
	calls := 0
	session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		calls++
		var request struct {
			Data struct {
				Method string `json:"method"`
				Params []struct {
					DID   string `json:"did"`
					SIID  int    `json:"siid"`
					PIID  int    `json:"piid"`
					Value int    `json:"value"`
				} `json:"params"`
			} `json:"data"`
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatal(err)
		}
		if request.Data.Method != "set_properties" || len(request.Data.Params) != 2 {
			t.Fatalf("unexpected request: %+v", request)
		}
		for i, p := range request.Data.Params {
			if p.DID != "robot" || p.SIID != 4 || p.PIID != 4+i || p.Value != 3 {
				t.Errorf("wrong property write: %+v", p)
			}
		}
		_, _ = w.Write([]byte(`{"code":0,"data":{"result":[{"siid":4,"piid":4,"code":0},{"siid":4,"piid":5,"code":0}]}}`))
	})
	session.client.token = "token"
	info := DeviceInfo{ID: "robot", Model: "dreame.vacuum.r2423", Shard: "10000"}
	values := []device.AttributeValue{{Capability: "suction", StringValue: device.Ptr("turbo")}, {Capability: "water", StringValue: device.Ptr("high")}}
	if err := session.SetConfiguration(t.Context(), info, values); err != nil {
		t.Fatal(err)
	}
	if calls != 1 {
		t.Fatal("settings write was retried")
	}
	for _, invalid := range [][]device.AttributeValue{{{Capability: "suction", StringValue: device.Ptr("unsupported")}}, {{Capability: "water", NumberValue: device.Ptr(3.0)}}, {{Capability: "unavailable", StringValue: device.Ptr("high")}}} {
		if err := session.SetConfiguration(t.Context(), info, invalid); err == nil {
			t.Fatal("invalid setting was accepted")
		}
	}
	info.Model = "unsupported"
	if err := session.SetConfiguration(t.Context(), info, values); err == nil {
		t.Fatal("unsupported model accepted settings")
	}
	if calls != 1 {
		t.Fatal("invalid settings reached transport")
	}
	attrs := configurationAttributes(cleaning.Snapshot{Suction: device.Ptr(1), Water: device.Ptr(2)})
	expected := []device.AttributeValue{{Capability: "suction", StringValue: device.Ptr("standard")}, {Capability: "water", StringValue: device.Ptr("medium")}}
	if !reflect.DeepEqual(attrs, expected) {
		t.Fatalf("reported settings = %+v", attrs)
	}
	if attrs := configurationAttributes(cleaning.Snapshot{Suction: device.Ptr(99)}); len(attrs) != 0 {
		t.Fatal("invalid reading was converted to a default")
	}
}

func TestConfigurationRejectsPartialProviderAcknowledgement(t *testing.T) {
	session := sessionFixture(t, func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"code":0,"data":{"result":[{"siid":4,"piid":4,"code":-1}]}}`))
	})
	session.client.token = "token"
	err := session.SetConfiguration(t.Context(), DeviceInfo{ID: "robot", Model: "dreame.vacuum.r2423", Shard: "10000"}, []device.AttributeValue{{Capability: "suction", StringValue: device.Ptr("standard")}})
	if err == nil {
		t.Fatal("rejected write counted as successful")
	}
}
