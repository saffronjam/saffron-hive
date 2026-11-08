package deviceimage

import (
	"context"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

type handlerStore struct{ sources []string }

func (s handlerStore) DeviceImageSources(context.Context, device.DeviceID) ([]string, error) {
	return s.sources, nil
}

func TestHandlerServesConditionalImage(t *testing.T) {
	pngData := testPNG(t)
	icon := "data:image/png;base64," + base64.StdEncoding.EncodeToString(pngData)
	cache := NewCacheWithClient(t.TempDir(), http.DefaultClient, time.Now)
	handler := NewHandler(cache, handlerStore{
		sources: []string{icon},
	})

	first := httptest.NewRecorder()
	handler.ServeHTTP(first, httptest.NewRequest(http.MethodGet, "/api/device-images/0x123", nil))
	if first.Code != http.StatusOK || first.Header().Get("Content-Type") != "image/png" || first.Header().Get("ETag") == "" {
		t.Fatalf("status=%d headers=%v", first.Code, first.Header())
	}
	second := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/api/device-images/0x123", nil)
	req.Header.Set("If-None-Match", first.Header().Get("ETag"))
	handler.ServeHTTP(second, req)
	if second.Code != http.StatusNotModified {
		t.Fatalf("conditional status = %d", second.Code)
	}
}

func TestHandlerRejectsMethodTraversalAndMissingSource(t *testing.T) {
	cache := NewCacheWithClient(t.TempDir(), http.DefaultClient, time.Now)
	other := NewHandler(cache, handlerStore{})
	for _, test := range []struct {
		method string
		path   string
		want   int
	}{
		{http.MethodPost, "/api/device-images/tuya-1", http.StatusMethodNotAllowed},
		{http.MethodGet, "/api/device-images/../secret", http.StatusNotFound},
		{http.MethodGet, "/api/device-images/tuya-1", http.StatusNotFound},
	} {
		response := httptest.NewRecorder()
		other.ServeHTTP(response, httptest.NewRequest(test.method, test.path, nil))
		if response.Code != test.want {
			t.Errorf("%s %s status=%d want=%d", test.method, test.path, response.Code, test.want)
		}
	}
}
