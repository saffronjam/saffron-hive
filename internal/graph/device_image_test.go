package graph

import (
	"encoding/json"
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestDeviceImageIsGenericAndOmitsProviderURLs(t *testing.T) {
	env := newTestEnv(t)
	env.stateReader.addDevice(device.Device{ID: "vacuum", Source: device.SourceDreame})
	env.stateReader.addDevice(device.Device{ID: "missing", Source: device.SourceTuya})
	env.store.imageSources = map[device.DeviceID][]string{"vacuum": {"https://example.com/product.png"}}
	result := env.query(t, `{ good:device(id:"vacuum"){image{version}} missing:device(id:"missing"){image{version}} }`, nil)
	if len(result.Errors) != 0 {
		t.Fatalf("query errors: %v", result.Errors)
	}
	var data struct {
		Good    struct{ Image *struct{ Version string } }
		Missing struct{ Image *struct{ Version string } }
	}
	if err := json.Unmarshal(result.Data, &data); err != nil {
		t.Fatal(err)
	}
	if data.Good.Image == nil || len(data.Good.Image.Version) != 64 || data.Missing.Image != nil {
		t.Fatalf("image metadata = %s", result.Data)
	}
}
