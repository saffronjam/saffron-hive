package audit

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestDiffAndCredentialSanitization(t *testing.T) {
	changes := Diff(json.RawMessage(`{"enabled":false,"nodes":{"t1":{"event":"state"}}}`), json.RawMessage(`{"enabled":true,"nodes":{"t1":{"event":"action"}}}`))
	if len(changes) != 2 || changes[0].Path != "enabled" || changes[1].Path != "nodes.t1.event" {
		t.Fatalf("changes=%+v", changes)
	}
	safe := Sanitize(json.RawMessage(`{"input":{"password":"private-password","accessSecret":"private-secret"},"values":[{"token":"private-token"}]}`))
	if strings.Contains(string(safe), "private-") {
		t.Fatalf("unsafe=%s", safe)
	}
}

func TestEmbeddedCredentialsAndAttributeValuesAreRedacted(t *testing.T) {
	raw := json.RawMessage(`{"definitions":"{\"actions\":[{\"password\":\"nested-private\"}]}","settings":[{"capability":"password","stringValue":"attribute-private"},{"key":"jwt.secret","value":"setting-private"},{"name":"brightness","value":42}],"password":"configured"}`)
	safe := SanitizeSnapshot(raw)
	if strings.Contains(string(safe), "private") || !strings.Contains(string(safe), `"password":"configured"`) || !strings.Contains(string(safe), `"value":42`) {
		t.Fatalf("unsafe or incomplete projection: %s", safe)
	}
}

func TestConnectionAddressCredentialsAreRedacted(t *testing.T) {
	safe := SanitizeSnapshot(json.RawMessage(`{"broker":"mqtt://user:broker-private@localhost:1883","frontendUrl":"https://example.com/?token=query-private","apiKey":"key-private"}`))
	if strings.Contains(string(safe), "private") || !strings.Contains(string(safe), "localhost:1883") {
		t.Fatalf("unsafe connection projection: %s", safe)
	}
}

func TestProposalSeparatesOperationalTargetsFromConfigurationChanges(t *testing.T) {
	var result struct {
		Changes []Change        `json:"changes"`
		Request json.RawMessage `json:"request"`
	}
	for _, field := range []string{"syncDevice", "sceneRun", "command", "login"} {
		if err := json.Unmarshal(Proposal(field, json.RawMessage(`{"deviceId":"lamp"}`), json.RawMessage(`{"id":"lamp","name":"Lamp"}`)), &result); err != nil {
			t.Fatal(err)
		}
		if len(result.Changes) != 0 || !strings.Contains(string(result.Request), "lamp") {
			t.Fatalf("%s treats request routing as a changed field: %+v", field, result)
		}
	}
	if err := json.Unmarshal(Proposal("updateRoom", json.RawMessage(`{"id":"room","input":{"name":"Bedroom","expectedRevision":2}}`), json.RawMessage(`{"id":"room","name":"Living room"}`)), &result); err != nil {
		t.Fatal(err)
	}
	if len(result.Changes) != 1 || result.Changes[0].Path != "name" || string(result.Changes[0].Before) != `"Living room"` || string(result.Changes[0].After) != `"Bedroom"` {
		t.Fatalf("configuration proposal is incomplete: %+v", result)
	}
}
