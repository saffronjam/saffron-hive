package dreame

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func TestMapCatalogueReadsRoomsWithoutForwardingCredentials(t *testing.T) {
	var downloaded bool
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch r.URL.Path {
		case "/dreame-user-iot/iotfile/getDownloadUrl":
			if r.Header.Get("Dreame-Auth") != "private-access-token" {
				t.Error("map reference did not use authenticated cloud request")
			}
			var params struct {
				Filename string `json:"filename"`
				DID      string `json:"did"`
			}
			if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
				t.Error(err)
			}
			if params.Filename != "ali_dreame/account/robot/9" || params.DID != "robot" {
				t.Error("map reference request identifies the wrong object")
			}
			_, _ = w.Write([]byte(`{"code":0,"data":"https://maps.eu.oss.aliyuncs.com/catalogue?Signature=private-signature"}`))
		case "/catalogue":
			downloaded = true
			if r.Method != http.MethodGet || r.Header.Get("Authorization") != "" || r.Header.Get("Dreame-Auth") != "" {
				t.Error("map download forwarded account credentials")
			}
			encoded, _ := json.Marshal(map[string]any{"mapstr": []map[string]any{{"name": "Ground floor", "map": mapFixture(t, 2, 1, []byte{1, 2}, `{"seg_inf":{"1":{"name":"S2l0Y2hlbg=="}}}`)}}, "security_key": "private-key"})
			_, _ = w.Write(encoded)
		default:
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
	}))
	defer server.Close()
	local, _ := url.Parse(server.URL)
	client := &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Host == "maps.eu.oss.aliyuncs.com" {
			clone := r.Clone(r.Context())
			address := *r.URL
			address.Scheme = "http"
			address.Host = local.Host
			clone.URL = &address
			return http.DefaultTransport.RoundTrip(clone)
		}
		return http.DefaultTransport.RoundTrip(r)
	})}
	c := newClient(client, server.URL, "owner@example.com")
	c.token = "private-access-token"
	for _, value := range []string{`{"object_name":"ali_dreame/account/robot/9"}`, `"{\"object_name\":\"ali_dreame/account/robot/9\"}"`} {
		downloaded = false
		d := DeviceReport{ID: "robot", Model: "dreame.vacuum.r2423"}
		c.inspectMapCatalogue(t.Context(), &d, Property{Name: "MAP_LIST", Value: value}, "eu")
		if !downloaded || len(d.Reads) != 2 || d.Reads[1].Error != nil {
			t.Fatalf("map catalogue read failed: %+v", d.Reads)
		}
		if len(d.Maps) != 1 || len(d.Maps[0].Rooms) == 0 || d.Maps[0].Rooms[0].Name != "Kitchen" {
			t.Fatal("map catalogue omitted room metadata")
		}
		for _, read := range d.Reads {
			if strings.Contains(read.JSON, "private-") {
				t.Fatal("map report exposed signed URL or key")
			}
		}
	}
}

func TestMapCatalogueRejectsUnexpectedDownloadDestinations(t *testing.T) {
	c := newClient(&http.Client{Transport: roundTripFunc(func(*http.Request) (*http.Response, error) {
		t.Fatal("invalid destination was requested")
		return nil, nil
	})}, "", "owner@example.com")
	for _, address := range []string{"http://bucket.aliyuncs.com/map", "https://localhost/map", "https://127.0.0.1/map", "https://bucket.aliyuncs.com.evil.example/map", "https://bucket.aliyuncs.com:444/map", "https://user:password@bucket.aliyuncs.com/map"} {
		if _, err := c.downloadMapFile(context.Background(), address); err == nil {
			t.Errorf("accepted unexpected destination %s", address)
		}
	}
}

func TestInvalidMapCatalogueReferenceIsReported(t *testing.T) {
	c := newClient(nil, "", "owner@example.com")
	for _, value := range []string{`null`, `"invalid"`, `{}`} {
		d := DeviceReport{}
		c.inspectMapCatalogue(t.Context(), &d, Property{Name: "MAP_LIST", Value: value}, "eu")
		if len(d.Reads) != 1 || d.Reads[0].Error == nil {
			t.Fatalf("invalid catalogue was silently accepted: %s", value)
		}
	}
}
