package geocode

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func stub(t *testing.T, status int, body string) *Client {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("User-Agent"); got != userAgent {
			t.Errorf("User-Agent = %q, want %q", got, userAgent)
		}
		w.WriteHeader(status)
		if _, err := w.Write([]byte(body)); err != nil {
			t.Errorf("write stub body: %v", err)
		}
	}))
	t.Cleanup(server.Close)
	client := New()
	client.endpoint = server.URL + "/"
	return client
}

const twoMatches = `{"features":[
  {"geometry":{"coordinates":[18.0686,59.3293]},
   "properties":{"name":"Stockholm","state":"Stockholm County","country":"Sweden"}},
  {"geometry":{"coordinates":[-75.4,45.1]},
   "properties":{"name":"Stockholm","county":"St. Lawrence","state":"New York","country":"United States"}}
]}`

func TestSearchReadsCoordinatesInGeoJSONOrder(t *testing.T) {
	places, err := stub(t, http.StatusOK, twoMatches).Search(context.Background(), "stockholm")
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(places) != 2 {
		t.Fatalf("got %d places, want 2", len(places))
	}
	// GeoJSON puts longitude first; swapping them lands the sun in the wrong sky.
	if places[0].Latitude != 59.3293 || places[0].Longitude != 18.0686 {
		t.Errorf("got %v, want lat 59.3293 lon 18.0686", places[0])
	}
}

func TestSearchNamesMatchesApart(t *testing.T) {
	places, err := stub(t, http.StatusOK, twoMatches).Search(context.Background(), "stockholm")
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if places[0].Name == places[1].Name {
		t.Fatalf("both matches read %q, so they cannot be told apart", places[0].Name)
	}
	if want := "Stockholm, Stockholm County, Sweden"; places[0].Name != want {
		t.Errorf("name = %q, want %q", places[0].Name, want)
	}
}

func TestSearchSkipsFeaturesItCannotPlace(t *testing.T) {
	const partial = `{"features":[
	  {"geometry":{"coordinates":[18.07]},"properties":{"name":"Half a point"}},
	  {"geometry":{"coordinates":[1,2]},"properties":{}},
	  {"geometry":{"coordinates":[3,4]},"properties":{"name":"Good"}}
	]}`
	places, err := stub(t, http.StatusOK, partial).Search(context.Background(), "x")
	if err != nil {
		t.Fatalf("Search: %v", err)
	}
	if len(places) != 1 || places[0].Name != "Good" {
		t.Fatalf("got %v, want only the complete feature", places)
	}
}

func TestSearchDoesNotCallOutForABlankQuery(t *testing.T) {
	client := New()
	client.endpoint = "http://127.0.0.1:0/"
	for _, query := range []string{"", "   "} {
		places, err := client.Search(context.Background(), query)
		if err != nil || places != nil {
			t.Errorf("Search(%q) = %v, %v; want nil, nil", query, places, err)
		}
	}
}

func TestSearchReportsAFailingGeocoder(t *testing.T) {
	if _, err := stub(t, http.StatusTooManyRequests, "").Search(context.Background(), "x"); err == nil {
		t.Fatal("want an error when the geocoder rejects the request")
	}
}

func TestLabelDropsRepeatsSoACityIsNotNamedTwice(t *testing.T) {
	if got, want := label("Berlin", "Berlin", "", "Germany"), "Berlin, Germany"; got != want {
		t.Errorf("label = %q, want %q", got, want)
	}
}
