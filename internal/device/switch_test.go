package device

import "testing"

func TestSwitchStateAction(t *testing.T) {
	s := SwitchState{
		Action: Ptr("toggle"),
	}
	if *s.Action != "toggle" {
		t.Fatalf("expected toggle, got %s", *s.Action)
	}
}

func TestSwitchStateNilAction(t *testing.T) {
	s := SwitchState{}
	if s.Action != nil {
		t.Fatal("Action should be nil")
	}
}
