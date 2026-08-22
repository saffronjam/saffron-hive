package oui

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

func TestParseRegistryAndLongestPrefixLookup(t *testing.T) {
	resolver := New(t.TempDir())
	tests := []struct {
		name       string
		bits       uint8
		assignment string
		vendor     string
	}{
		{name: "oui", bits: 24, assignment: "54EF44", vendor: "MA-L vendor"},
		{name: "mam", bits: 28, assignment: "54EF441", vendor: "MA-M vendor"},
		{name: "oui36", bits: 36, assignment: "54EF44100", vendor: "MA-S vendor"},
	}
	for _, test := range tests {
		csv := fmt.Sprintf("Registry,Assignment,Organization Name\n%s,%s,%s\n", test.name, test.assignment, test.vendor)
		entries, err := parseRegistry(strings.NewReader(csv), test.bits)
		if err != nil {
			t.Fatalf("parse %s: %v", test.name, err)
		}
		resolver.replace(test.name, entries)
	}
	vendor, ok := resolver.Lookup("0x54ef44100166fcae")
	if !ok || vendor != "MA-S vendor" {
		t.Fatalf("longest match = (%q, %v)", vendor, ok)
	}
	if _, ok := resolver.Lookup("not-an-address"); ok {
		t.Fatal("invalid address resolved")
	}
}

func TestRefreshSourceIsAtomicAndKeepsValidCacheOnFailure(t *testing.T) {
	mode := "valid"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		switch mode {
		case "valid":
			w.Header().Set("ETag", `"one"`)
			_, _ = fmt.Fprint(w, "Registry,Assignment,Organization Name\nMA-L,00158D,Aqara\n")
		case "invalid":
			_, _ = fmt.Fprint(w, "not,a,registry\n")
		case "not-modified":
			if request.Header.Get("If-None-Match") != `"one"` {
				t.Errorf("If-None-Match = %q", request.Header.Get("If-None-Match"))
			}
			w.WriteHeader(http.StatusNotModified)
		}
	}))
	defer server.Close()

	resolver := New(t.TempDir())
	resolver.client = server.Client()
	src := source{name: "oui", url: server.URL, bits: 24}
	resolver.sources = []source{src}
	if err := resolver.Load(); err != nil {
		t.Fatal(err)
	}
	if err := resolver.refreshSource(context.Background(), src); err != nil {
		t.Fatalf("first refresh: %v", err)
	}
	before, err := os.ReadFile(resolver.csvPath(src))
	if err != nil {
		t.Fatal(err)
	}
	vendor, ok := resolver.Lookup("0x00158d00031eeba0")
	if !ok || vendor != "Aqara" {
		t.Fatalf("lookup = (%q, %v)", vendor, ok)
	}

	mode = "invalid"
	if err := resolver.refreshSource(context.Background(), src); err == nil {
		t.Fatal("invalid registry was accepted")
	}
	after, err := os.ReadFile(resolver.csvPath(src))
	if err != nil || string(after) != string(before) {
		t.Fatalf("valid cache changed after failure: %v", err)
	}
	vendor, ok = resolver.Lookup("0x00158d00031eeba0")
	if !ok || vendor != "Aqara" {
		t.Fatalf("lookup after failure = (%q, %v)", vendor, ok)
	}

	stale := time.Now().Add(-8 * 24 * time.Hour)
	if err := os.Chtimes(resolver.csvPath(src), stale, stale); err != nil {
		t.Fatal(err)
	}
	mode = "not-modified"
	resolver.refreshStale(context.Background())
	info, err := os.Stat(resolver.csvPath(src))
	if err != nil || !info.ModTime().After(stale) {
		t.Fatalf("304 did not refresh cache age: %v", err)
	}
}
