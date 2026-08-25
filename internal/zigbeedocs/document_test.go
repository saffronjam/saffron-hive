package zigbeedocs

import (
	"fmt"
	"reflect"
	"testing"
)

func TestParseDocumentation(t *testing.T) {
	source := deviceMarkdown("SNZB-02P", "SONOFF", "Temperature and humidity sensor", "battery, temperature, humidity", `
### Battery
Uses a CR2477 battery
`)
	document, err := parseDocumentation([]byte(source))
	if err != nil {
		t.Fatal(err)
	}
	if document.Model != "SNZB-02P" || document.Vendor != "SONOFF" || document.Description != "Temperature and humidity sensor" {
		t.Fatalf("documentation facts = %+v", document)
	}
	if !reflect.DeepEqual(document.Exposes, []string{"battery", "temperature", "humidity"}) {
		t.Fatalf("exposes = %#v", document.Exposes)
	}
	if document.BatteryType != "CR2477" {
		t.Fatalf("battery type = %q", document.BatteryType)
	}
}

func TestParseBatteryTypeStrictlyFromNotes(t *testing.T) {
	tests := []struct {
		name  string
		notes string
		want  string
	}{
		{name: "Hue generation one", notes: "### Battery Type\nUses a CR2450 battery.\n", want: "CR2450"},
		{name: "Hue generation two", notes: "### Battery Type\nUses a CR2032 battery.\n", want: "CR2032"},
		{name: "multiple cells", notes: "### Battery\nUses 2 x AAA battery.  \nThe remaining percentage is tuned for Alkalines.\n", want: "2 × AAA"},
		{name: "case normalization", notes: "### battery\nUses an er14250 battery.\n", want: "ER14250"},
		{name: "ambiguous prose", notes: "### Battery\nThe device usually ships with a coin cell.\n"},
		{name: "unknown word", notes: "### Battery\nUses a rechargeable battery.\n"},
		{name: "wrong heading", notes: "### Power\nUses a CR2032 battery.\n"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			document, err := parseDocumentation([]byte(deviceMarkdown("model", "vendor", "description", "battery", test.notes)))
			if err != nil {
				t.Fatal(err)
			}
			if document.BatteryType != test.want {
				t.Fatalf("battery type = %q, want %q", document.BatteryType, test.want)
			}
		})
	}
}

func TestParseBatteryTypeIgnoresGeneratedExposes(t *testing.T) {
	source := deviceMarkdown("model", "vendor", "description", "battery", "") + `
## Exposes

### Battery (numeric)
Remaining battery in percent. Uses a CR9999 battery.
`
	document, err := parseDocumentation([]byte(source))
	if err != nil {
		t.Fatal(err)
	}
	if document.BatteryType != "" {
		t.Fatalf("battery type = %q", document.BatteryType)
	}
}

func TestDocumentationURLs(t *testing.T) {
	if got := Slug("SP 120/plug:EU|v2"); got != "SP_120_plug_EU_v2" {
		t.Fatalf("slug = %q", got)
	}
	if got := DefinitionURL("SP 120"); got != "https://www.zigbee2mqtt.io/devices/SP_120.html" {
		t.Fatalf("definition URL = %q", got)
	}
}

func deviceMarkdown(model, vendor, description, exposes, notes string) string {
	return fmt.Sprintf(`# Device

|     |     |
|-----|-----|
| Model | %s |
| Vendor | [%s](/supported-devices/) |
| Description | %s |
| Exposes | %s |

<!-- Notes BEGIN: editable -->
## Notes

%s
<!-- Notes END: generated below -->
`, model, vendor, description, exposes, notes)
}
