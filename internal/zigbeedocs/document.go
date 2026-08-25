// Package zigbeedocs resolves and caches typed Zigbee2MQTT device documentation.
package zigbeedocs

import (
	"bytes"
	"fmt"
	"html"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	extensionast "github.com/yuin/goldmark/extension/ast"
	"github.com/yuin/goldmark/text"
)

const (
	publishedBaseURL = "https://www.zigbee2mqtt.io/devices/"
	rawBaseURL       = "https://raw.githubusercontent.com/Koenkk/zigbee2mqtt.io/master/docs/devices/"
)

var batteryStatement = regexp.MustCompile(`(?i)^uses\s+(?:(?:a|an)\s+)?(?:(\d+)\s*[x×*]\s*)?([a-z0-9][a-z0-9.+-]*)\s+batter(?:y|ies)$`)

// Documentation contains stable facts parsed from one Zigbee2MQTT device page.
type Documentation struct {
	SourceURL     string
	LastCheckedAt time.Time
	Model         string
	Vendor        string
	Description   string
	Exposes       []string
	BatteryType   string
}

// Slug returns the canonical Zigbee2MQTT documentation slug for a definition model.
func Slug(model string) string {
	return strings.NewReplacer("/", "_", "|", "_", " ", "_", ":", "_").Replace(strings.TrimSpace(model))
}

// DefinitionURL returns the human-readable Zigbee2MQTT device page URL.
func DefinitionURL(model string) string {
	slug := Slug(model)
	if slug == "" {
		return ""
	}
	return publishedBaseURL + url.PathEscape(slug) + ".html"
}

func rawURL(baseURL, slug string) string {
	return strings.TrimRight(baseURL, "/") + "/" + url.PathEscape(slug) + ".md"
}

func parseDocumentation(source []byte) (Documentation, error) {
	markdown := goldmark.New(goldmark.WithExtensions(extension.Table))
	document := markdown.Parser().Parse(text.NewReader(source))
	out := Documentation{Exposes: []string{}}

	err := ast.Walk(document, func(node ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering || node.Kind() != extensionast.KindTable {
			return ast.WalkContinue, nil
		}
		for row := node.FirstChild(); row != nil; row = row.NextSibling() {
			if row.Kind() != extensionast.KindTableRow {
				continue
			}
			cells := tableCells(row, source)
			if len(cells) != 2 {
				continue
			}
			switch strings.ToLower(cells[0]) {
			case "model":
				out.Model = cells[1]
			case "vendor":
				out.Vendor = cells[1]
			case "description":
				out.Description = cells[1]
			case "exposes":
				out.Exposes = splitExposes(cells[1])
			}
		}
		return ast.WalkStop, nil
	})
	if err != nil {
		return Documentation{}, err
	}
	if out.Model == "" {
		return Documentation{}, fmt.Errorf("device documentation has no model")
	}
	out.BatteryType = parseBatteryType(source, markdown)
	return out, nil
}

func tableCells(row ast.Node, source []byte) []string {
	cells := make([]string, 0, 2)
	for cell := row.FirstChild(); cell != nil; cell = cell.NextSibling() {
		if cell.Kind() == extensionast.KindTableCell {
			cells = append(cells, normalizeText(string(cell.Text(source))))
		}
	}
	return cells
}

func splitExposes(value string) []string {
	if value == "" {
		return []string{}
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}

func parseBatteryType(source []byte, markdown goldmark.Markdown) string {
	startMarker := []byte("<!-- Notes BEGIN")
	endMarker := []byte("<!-- Notes END")
	start := bytes.Index(source, startMarker)
	if start < 0 {
		return ""
	}
	markerEnd := bytes.IndexByte(source[start:], '>')
	if markerEnd < 0 {
		return ""
	}
	start += markerEnd + 1
	endOffset := bytes.Index(source[start:], endMarker)
	if endOffset < 0 {
		return ""
	}
	notes := source[start : start+endOffset]
	document := markdown.Parser().Parse(text.NewReader(notes))
	for node := document.FirstChild(); node != nil; node = node.NextSibling() {
		heading, ok := node.(*ast.Heading)
		if !ok || heading.Level != 3 {
			continue
		}
		title := strings.ToLower(normalizeText(string(heading.Text(notes))))
		if title != "battery" && title != "battery type" {
			continue
		}
		for sibling := node.NextSibling(); sibling != nil; sibling = sibling.NextSibling() {
			if nextHeading, ok := sibling.(*ast.Heading); ok && nextHeading.Level <= 3 {
				break
			}
			paragraph, ok := sibling.(*ast.Paragraph)
			if !ok {
				continue
			}
			return normalizeBatteryType(string(paragraph.Text(notes)))
		}
		return ""
	}
	return ""
}

func normalizeBatteryType(paragraph string) string {
	statement := normalizeText(paragraph)
	if end := strings.IndexByte(statement, '.'); end >= 0 {
		statement = statement[:end]
	}
	match := batteryStatement.FindStringSubmatch(strings.TrimSpace(statement))
	if match == nil {
		return ""
	}
	designation := strings.ToUpper(match[2])
	if !validBatteryDesignation(designation) {
		return ""
	}
	if match[1] == "" {
		return designation
	}
	quantity, err := strconv.Atoi(match[1])
	if err != nil || quantity < 1 || quantity > 100 {
		return ""
	}
	if quantity == 1 {
		return designation
	}
	return strconv.Itoa(quantity) + " × " + designation
}

func validBatteryDesignation(value string) bool {
	switch value {
	case "AA", "AAA", "AAAA", "C", "D", "N", "9V":
		return true
	}
	hasLetter := false
	hasDigit := false
	for _, r := range value {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsDigit(r):
			hasDigit = true
		case r == '.', r == '+', r == '-':
		default:
			return false
		}
	}
	return hasLetter && hasDigit
}

func normalizeText(value string) string {
	return html.UnescapeString(strings.Join(strings.Fields(value), " "))
}
