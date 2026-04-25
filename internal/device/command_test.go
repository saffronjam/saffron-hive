package device

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestCommandFields(t *testing.T) {
	cmd := Command{
		DeviceID:   DeviceID("light-1"),
		On:         Ptr(true),
		Brightness: Ptr(75),
		ColorTemp:  Ptr(3000),
		Color:      &Color{R: 10, G: 20, B: 30, X: 0.1, Y: 0.2},
		Transition: Ptr(0.5),
	}
	if cmd.DeviceID != "light-1" {
		t.Fatalf("expected light-1, got %s", cmd.DeviceID)
	}
	if *cmd.On != true {
		t.Fatal("expected On=true")
	}
	if *cmd.Brightness != 75 {
		t.Fatalf("expected 75, got %d", *cmd.Brightness)
	}
	if *cmd.ColorTemp != 3000 {
		t.Fatalf("expected 3000, got %d", *cmd.ColorTemp)
	}
	if cmd.Color.R != 10 {
		t.Fatalf("expected R=10, got %d", cmd.Color.R)
	}
	if *cmd.Transition != 0.5 {
		t.Fatalf("expected 0.5, got %f", *cmd.Transition)
	}
}

func TestCommandPartial(t *testing.T) {
	cmd := Command{
		DeviceID: DeviceID("plug-1"),
		On:       Ptr(false),
	}
	if *cmd.On != false {
		t.Fatal("expected On=false")
	}
	if cmd.Brightness != nil {
		t.Fatal("Brightness should be nil")
	}
	if cmd.Color != nil {
		t.Fatal("Color should be nil")
	}
}

func TestCommandOriginJSONRoundTrip(t *testing.T) {
	cases := []CommandOrigin{
		OriginScene("scene-1"),
		OriginAutomation("auto-2"),
		OriginEffect("effect-run-3"),
		OriginUser(),
	}
	for _, want := range cases {
		cmd := Command{DeviceID: "d", On: Ptr(true), Origin: want}
		b, err := json.Marshal(cmd)
		if err != nil {
			t.Fatalf("marshal: %v", err)
		}
		var restored Command
		if err := json.Unmarshal(b, &restored); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if restored.Origin != want {
			t.Fatalf("origin round-trip: got %+v, want %+v", restored.Origin, want)
		}
	}
}

func TestCommandOriginOmittedWhenZero(t *testing.T) {
	cmd := Command{DeviceID: "d", On: Ptr(true)}
	b, err := json.Marshal(cmd)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if strings.Contains(string(b), "origin") {
		t.Fatalf("zero origin should be omitted, got %s", string(b))
	}
}

func TestOriginConstructors(t *testing.T) {
	if o := OriginScene("s1"); o.Kind != OriginKindScene || o.ID != "s1" {
		t.Fatalf("OriginScene: %+v", o)
	}
	if o := OriginAutomation("a1"); o.Kind != OriginKindAutomation || o.ID != "a1" {
		t.Fatalf("OriginAutomation: %+v", o)
	}
	if o := OriginEffect("r1"); o.Kind != OriginKindEffect || o.ID != "r1" {
		t.Fatalf("OriginEffect: %+v", o)
	}
	if o := OriginUser(); o.Kind != OriginKindUser || o.ID != "" {
		t.Fatalf("OriginUser: %+v", o)
	}
	if !(CommandOrigin{}).IsZero() {
		t.Fatal("zero CommandOrigin should report IsZero")
	}
	if OriginUser().IsZero() {
		t.Fatal("OriginUser must not report IsZero")
	}
}
