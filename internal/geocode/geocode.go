// Package geocode turns a place name into coordinates.
package geocode

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var logger = slog.Default().With("pkg", "geocode")

// Place is a match for a searched name, with the coordinates it sits at.
type Place struct {
	Name      string
	Latitude  float64
	Longitude float64
}

// Photon is komoot's public geocoder over OpenStreetMap data. It needs no key
// and is built for search-as-you-type, which the better-known Nominatim
// explicitly asks callers not to do.
const photonEndpoint = "https://photon.komoot.io/api/"

// How many matches to ask for. Enough to tell similarly-named places apart
// without turning the settings card into a list.
const maxResults = 6

// Identifies this application to the geocoder, which its usage policy asks for.
const userAgent = "saffron-hive (home automation dashboard)"

// Client searches an external geocoder. The zero value is not usable; build one
// with New.
type Client struct {
	http     *http.Client
	endpoint string
}

// New returns a client with a timeout short enough that a slow geocoder cannot
// hold a request open.
func New() *Client {
	return &Client{
		http:     &http.Client{Timeout: 5 * time.Second},
		endpoint: photonEndpoint,
	}
}

// photonResponse is the GeoJSON subset that matters: a feature's coordinates
// and the name parts to build a label from.
type photonResponse struct {
	Features []struct {
		Geometry struct {
			Coordinates []float64 `json:"coordinates"`
		} `json:"geometry"`
		Properties struct {
			Name    string `json:"name"`
			City    string `json:"city"`
			County  string `json:"county"`
			State   string `json:"state"`
			Country string `json:"country"`
		} `json:"properties"`
	} `json:"features"`
}

// Search returns the places matching query, most relevant first. A blank query
// returns nothing rather than asking the geocoder for everything.
func (c *Client) Search(ctx context.Context, query string) ([]Place, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, nil
	}

	params := url.Values{}
	params.Set("q", query)
	params.Set("limit", fmt.Sprint(maxResults))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.endpoint+"?"+params.Encode(), nil)
	if err != nil {
		return nil, fmt.Errorf("build geocoder request: %w", err)
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("Accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("reach geocoder: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			logger.Debug("closing geocoder response", slog.String("error", err.Error()))
		}
	}()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("geocoder returned %s", resp.Status)
	}

	var body photonResponse
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, fmt.Errorf("decode geocoder response: %w", err)
	}

	places := make([]Place, 0, len(body.Features))
	for _, f := range body.Features {
		// GeoJSON orders a position longitude first.
		if len(f.Geometry.Coordinates) < 2 {
			continue
		}
		name := label(f.Properties.Name, f.Properties.City, f.Properties.County, f.Properties.State, f.Properties.Country)
		if name == "" {
			continue
		}
		places = append(places, Place{
			Name:      name,
			Longitude: f.Geometry.Coordinates[0],
			Latitude:  f.Geometry.Coordinates[1],
		})
	}
	logger.Debug("geocoder search",
		slog.String("query", query),
		slog.Int("matches", len(places)),
	)
	return places, nil
}

// label joins the name parts that are present and distinct, so two streets of
// the same name in different towns do not read identically.
func label(parts ...string) string {
	out := make([]string, 0, len(parts))
	seen := make(map[string]bool, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" || seen[part] {
			continue
		}
		seen[part] = true
		out = append(out, part)
	}
	return strings.Join(out, ", ")
}
