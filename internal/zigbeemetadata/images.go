package zigbeemetadata

import (
	"net/url"
	"strings"
	"unicode"
)

// ImageSources returns provider artwork in preference order.
func ImageSources(metadata Metadata) []string {
	sources := []string{}
	if metadata.Definition == nil {
		return sources
	}
	if metadata.Definition.Icon != nil {
		sources = append(sources, *metadata.Definition.Icon)
	}
	if metadata.Definition.Model != nil {
		var model strings.Builder
		for _, r := range strings.TrimSpace(*metadata.Definition.Model) {
			switch {
			case r == ':' || r == '/' || r == '\\' || unicode.IsSpace(r):
				model.WriteByte('-')
			case !unicode.IsControl(r):
				model.WriteRune(r)
			}
		}
		if model.Len() > 0 {
			sources = append(sources, "https://www.zigbee2mqtt.io/images/devices/"+url.PathEscape(model.String())+".png")
		}
	}
	return sources
}
