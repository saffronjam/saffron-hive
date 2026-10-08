package graph

import (
	"strings"
	"testing"
	"time"
)

type recordingClock struct {
	locations []*time.Location
}

func (c *recordingClock) SetTimeZone(location *time.Location) error {
	c.locations = append(c.locations, location)
	return nil
}

func TestUpdateTimeZoneSettingAppliesToAutomations(t *testing.T) {
	env := newTestEnv(t)
	clock := &recordingClock{}
	env.resolver.AutomationClock = clock
	mutation := `mutation($value: String!) { updateSetting(key: "timezone", value: $value) { key value } }`

	resp := env.query(t, mutation, map[string]any{"value": "Mars/Olympus"})
	if len(resp.Errors) == 0 || !strings.Contains(resp.Errors[0].Message, "unknown time zone") {
		t.Fatalf("errors = %v, want unknown time zone", resp.Errors)
	}
	if len(clock.locations) != 0 || env.store.settings["timezone"] != "" {
		t.Fatal("an invalid time zone must not be stored or applied")
	}

	resp = env.query(t, mutation, map[string]any{"value": "Europe/Stockholm"})
	if len(resp.Errors) > 0 {
		t.Fatalf("errors = %v", resp.Errors)
	}
	if len(clock.locations) != 1 || clock.locations[0].String() != "Europe/Stockholm" {
		t.Fatalf("applied = %v", clock.locations)
	}

	resp = env.query(t, mutation, map[string]any{"value": ""})
	if len(resp.Errors) > 0 {
		t.Fatalf("errors = %v", resp.Errors)
	}
	if len(clock.locations) != 2 || clock.locations[1] != nil {
		t.Fatalf("clearing should apply local time, got %v", clock.locations)
	}
}
