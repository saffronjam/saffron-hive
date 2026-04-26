package store

import "testing"

func TestParseScenePayload_StaticWithKind(t *testing.T) {
	p, err := ParseScenePayload(`{"kind":"static","on":true,"brightness":150}`)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if p.Kind != ScenePayloadStatic {
		t.Errorf("kind: want static, got %q", p.Kind)
	}
	if p.Static["on"] != true {
		t.Errorf("static.on: want true, got %v", p.Static["on"])
	}
	if _, ok := p.Static["kind"]; ok {
		t.Errorf("static map should not retain kind field")
	}
}

func TestParseScenePayload_StaticDefaultsWhenKindMissing(t *testing.T) {
	p, err := ParseScenePayload(`{"on":true,"brightness":150}`)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if p.Kind != ScenePayloadStatic {
		t.Errorf("kind: want static fallback, got %q", p.Kind)
	}
	if p.Static["brightness"].(float64) != 150 {
		t.Errorf("static.brightness: want 150, got %v", p.Static["brightness"])
	}
}

func TestParseScenePayload_Effect(t *testing.T) {
	p, err := ParseScenePayload(`{"kind":"effect","effect_id":"fireplace"}`)
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	if p.Kind != ScenePayloadEffect {
		t.Errorf("kind: want effect, got %q", p.Kind)
	}
	if p.EffectID != "fireplace" {
		t.Errorf("effect_id: want fireplace, got %q", p.EffectID)
	}
}

func TestParseScenePayload_EffectMissingIDIsError(t *testing.T) {
	_, err := ParseScenePayload(`{"kind":"effect"}`)
	if err == nil {
		t.Fatal("expected error for missing effect_id")
	}
}

func TestParseScenePayload_UnknownKindIsError(t *testing.T) {
	_, err := ParseScenePayload(`{"kind":"webhook"}`)
	if err == nil {
		t.Fatal("expected error for unknown kind")
	}
}

func TestParseScenePayload_EmptyIsError(t *testing.T) {
	_, err := ParseScenePayload("")
	if err == nil {
		t.Fatal("expected error for empty payload")
	}
}
