package localization

import "testing"

func TestNameSetValidationAndResolution(t *testing.T) {
	names := NameSet{
		EntityType:     "room",
		EntityID:       "room-1",
		SourceLanguage: English,
		Translations: map[Language]string{
			Swedish: "Kök",
			Russian: "Кухня",
		},
	}
	if err := names.Validate(); err != nil {
		t.Fatal(err)
	}
	if got := names.Resolve(Swedish, "Kitchen", ""); got != "Kök" {
		t.Fatalf("Swedish name = %q", got)
	}
	if got := names.Resolve(English, "Kitchen", ""); got != "Kitchen" {
		t.Fatalf("source name = %q", got)
	}
	if got := names.Resolve(Russian, "", "Provider kitchen"); got != "Кухня" {
		t.Fatalf("Russian name = %q", got)
	}
	if got := (NameSet{EntityID: "device-1"}).Resolve(English, "", "Provider name"); got != "Provider name" {
		t.Fatalf("provider fallback = %q", got)
	}
}

func TestNameSetRejectsSourceTranslation(t *testing.T) {
	names := NameSet{
		EntityType:     "scene",
		EntityID:       "scene-1",
		SourceLanguage: English,
		Translations:   map[Language]string{English: "Scene"},
	}
	if err := names.Validate(); err == nil {
		t.Fatal("source-language translation was accepted")
	}
}
