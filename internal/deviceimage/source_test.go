package deviceimage

import (
	"strings"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

func TestResolveSourceOrdersIconBeforeCanonicalModel(t *testing.T) {
	icon := "https://example.com/product.webp"
	model := "SP 120/white:EU"
	source := ResolveSource(zigbeemetadata.Metadata{Definition: &zigbeemetadata.Definition{Icon: &icon, Model: &model}})
	if len(source.Candidates) != 2 {
		t.Fatalf("candidates = %d, want 2", len(source.Candidates))
	}
	if source.Candidates[0].Value != icon {
		t.Fatalf("first candidate = %q", source.Candidates[0].Value)
	}
	if got := source.Candidates[1].Value; !strings.HasSuffix(got, "/SP-120-white-EU.png") {
		t.Fatalf("canonical candidate = %q", got)
	}
	if source.Fingerprint == "" {
		t.Fatal("missing source fingerprint")
	}
}

func TestResolveSourceIgnoresUnsafeIcon(t *testing.T) {
	icon := "http://127.0.0.1/device.svg"
	model := "MCCGQ12LM"
	source := ResolveSource(zigbeemetadata.Metadata{Definition: &zigbeemetadata.Definition{Icon: &icon, Model: &model}})
	if len(source.Candidates) != 1 || !strings.Contains(source.Candidates[0].Value, "MCCGQ12LM.png") {
		t.Fatalf("candidates = %#v", source.Candidates)
	}
}

func TestResolveSourceFingerprintChangesWithIcon(t *testing.T) {
	model := "P100"
	first := "data:image/png;base64,AA=="
	second := "data:image/png;base64,AQ=="
	a := ResolveSource(zigbeemetadata.Metadata{Definition: &zigbeemetadata.Definition{Icon: &first, Model: &model}})
	b := ResolveSource(zigbeemetadata.Metadata{Definition: &zigbeemetadata.Definition{Icon: &second, Model: &model}})
	if a.Fingerprint == b.Fingerprint {
		t.Fatal("fingerprint did not change")
	}
}
