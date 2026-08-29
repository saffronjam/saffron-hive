package catalog

import (
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

func TestEmbeddedCatalogue(t *testing.T) {
	entries, err := Entries()
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 10 {
		t.Fatalf("entries = %d", len(entries))
	}
	wantOrder := []string{"sunset-glow", "night-sky", "forest-canopy", "ocean-drift", "ember-hearth", "aurora-haze", "candlelight", "warm-evening", "neutral-focus", "cool-morning"}
	for i, id := range wantOrder {
		if entries[i].ID != id {
			t.Fatalf("entry %d = %q, want %q", i, entries[i].ID, id)
		}
	}
	preset, ok := Lookup("sunset-glow")
	if !ok || preset.Field.Domain != lightfield.DomainFullColor {
		t.Fatalf("lookup = %#v, %v", preset, ok)
	}
	preset.Field.Samples[0].Color.Hue = 100
	again, _ := Lookup("sunset-glow")
	if again.Field.Samples[0].Color.Hue == 100 {
		t.Fatal("catalogue lookup shared mutable field storage")
	}
}

func TestParseRejectsInvalidCatalogue(t *testing.T) {
	valid := `[
{"id":"colour","title":"Colour","category":"Looks","domain":"full_color","seed":1,"brightness":0.8,"movement":0.2,"cycleSeconds":60,"field":{"domain":"full_color","width":2,"height":2,"samples":[{"color":{"lightness":0.5,"chroma":0.1,"hue":20}},{"color":{"lightness":0.5,"chroma":0.1,"hue":20}},{"color":{"lightness":0.5,"chroma":0.1,"hue":20}},{"color":{"lightness":0.5,"chroma":0.1,"hue":20}}]}},
{"id":"white","title":"White","category":"Whites","domain":"white_ambience","seed":2,"brightness":0.8,"movement":0.2,"cycleSeconds":60,"field":{"domain":"white_ambience","width":2,"height":2,"samples":[{"white":{"brightness":0.5,"mireds":300}},{"white":{"brightness":0.5,"mireds":300}},{"white":{"brightness":0.5,"mireds":300}},{"white":{"brightness":0.5,"mireds":300}}]}}
]`
	if _, err := Parse([]byte(valid)); err != nil {
		t.Fatalf("valid fixture: %v", err)
	}
	tests := []string{
		strings.Replace(valid, `"id":"white"`, `"id":"colour"`, 1),
		strings.Replace(valid, `"category":"Looks"`, `"category":""`, 1),
		strings.Replace(valid, `"brightness":0.8`, `"brightness":1.2`, 1),
		strings.Replace(valid, `"width":2`, `"width":1`, 1),
		strings.ReplaceAll(valid, `"domain":"white_ambience"`, `"domain":"full_color"`),
	}
	for i, data := range tests {
		if _, err := Parse([]byte(data)); err == nil {
			t.Errorf("invalid catalogue %d accepted", i)
		}
	}
}
