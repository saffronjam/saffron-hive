// Package deviceimage resolves and caches product artwork for Zigbee devices.
package deviceimage

import (
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"strings"
	"unicode"

	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// Candidate is one normalized image source in precedence order.
type Candidate struct {
	Value  string
	Inline bool
}

// Source is the complete candidate set and its opaque version.
type Source struct {
	Candidates  []Candidate
	Fingerprint string
}

// ResolveSource derives safe candidates without exposing them to clients.
func ResolveSource(metadata zigbeemetadata.Metadata) Source {
	candidates := make([]Candidate, 0, 2)
	if metadata.Definition != nil && metadata.Definition.Icon != nil {
		if candidate, ok := normalizeIcon(*metadata.Definition.Icon); ok {
			candidates = append(candidates, candidate)
		}
	}
	if metadata.Definition != nil && metadata.Definition.Model != nil {
		if model := canonicalModel(*metadata.Definition.Model); model != "" {
			candidates = append(candidates, Candidate{
				Value: "https://www.zigbee2mqtt.io/images/devices/" + url.PathEscape(model) + ".png",
			})
		}
	}
	if len(candidates) == 0 {
		return Source{}
	}
	var input strings.Builder
	for _, candidate := range candidates {
		if candidate.Inline {
			input.WriteString("data\x00")
		} else {
			input.WriteString("url\x00")
		}
		input.WriteString(candidate.Value)
		input.WriteByte('\n')
	}
	sum := sha256.Sum256([]byte(input.String()))
	return Source{Candidates: candidates, Fingerprint: hex.EncodeToString(sum[:])}
}

func normalizeIcon(value string) (Candidate, bool) {
	value = strings.TrimSpace(value)
	lower := strings.ToLower(value)
	if strings.HasPrefix(lower, "data:image/png;base64,") ||
		strings.HasPrefix(lower, "data:image/jpeg;base64,") ||
		strings.HasPrefix(lower, "data:image/webp;base64,") {
		if len(value) > (maxImageBytes*4/3)+256 {
			return Candidate{}, false
		}
		return Candidate{Value: value, Inline: true}, true
	}
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme != "https" || parsed.Host == "" || parsed.User != nil {
		return Candidate{}, false
	}
	return Candidate{Value: parsed.String()}, true
}

func canonicalModel(value string) string {
	value = strings.TrimSpace(value)
	var out strings.Builder
	for _, r := range value {
		switch {
		case r == ':' || r == '/' || r == '\\' || unicode.IsSpace(r):
			out.WriteByte('-')
		case !unicode.IsControl(r):
			out.WriteRune(r)
		}
	}
	return out.String()
}
