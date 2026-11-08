// Package deviceimage resolves and caches product artwork supplied by device integrations.
package deviceimage

import (
	"crypto/sha256"
	"encoding/hex"
	"net/url"
	"strings"
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
func ResolveSource(sources []string) Source {
	candidates := make([]Candidate, 0, len(sources))
	for _, source := range sources {
		if candidate, ok := normalizeIcon(source); ok {
			candidates = append(candidates, candidate)
		}
	}
	if len(candidates) == 0 {
		return Source{}
	}
	var input strings.Builder
	input.WriteString(imagePipelineVersion)
	input.WriteByte(0)
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
