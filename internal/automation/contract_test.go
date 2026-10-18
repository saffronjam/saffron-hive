package automation

import (
	"encoding/json"
	"os"
	"testing"
)

func TestSharedTriggerContracts(t *testing.T) {
	data, err := os.ReadFile("../../testdata/automation-contract.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []struct {
		Name   string
		Config json.RawMessage
	}
	if err := json.Unmarshal(data, &cases); err != nil {
		t.Fatal(err)
	}
	for _, tc := range cases {
		t.Run(tc.Name, func(t *testing.T) {
			config, err := (Definitions{}).ParseNodeConfig(NodeTrigger, string(tc.Config))
			if err != nil {
				t.Fatal(err)
			}
			result := ValidateGraph(AutomationGraph{Nodes: []Node{{ID: "t1", Type: NodeTrigger, Config: config}}})
			if !result.Valid() {
				t.Fatalf("invalid trigger: %+v", result.Errors)
			}
		})
	}
}
