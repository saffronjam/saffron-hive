package device

// commandFieldCapabilities maps command-payload field names to the capability
// constant a device must expose to accept that field. Fields not listed here
// (e.g. "transition") are treated as protocol-level modifiers and always
// pass through.
var commandFieldCapabilities = map[string]string{
	"on":         CapOnOff,
	"brightness": CapBrightness,
	"colorTemp":  CapColorTemp,
	"color":      CapColor,
}

// FilterCommandFields returns a copy of fields containing only those entries
// the given device actually supports. Best-effort: fields requiring a
// capability the device lacks are dropped; unknown fields pass through.
// Used when a single payload fans out to a heterogeneous group/room so a
// plug in a mixed group never receives a stray "brightness" field.
//
// Devices with no reported capabilities (unknown / not yet discovered) are
// treated as permissive and the full payload passes through — the filter
// only tightens behavior when we have positive capability evidence.
func FilterCommandFields(fields map[string]any, dev Device) map[string]any {
	if len(dev.Capabilities) == 0 {
		out := make(map[string]any, len(fields))
		for k, v := range fields {
			out[k] = v
		}
		return out
	}
	caps := make(map[string]bool, len(dev.Capabilities))
	for _, c := range dev.Capabilities {
		caps[c.Name] = true
	}
	out := make(map[string]any, len(fields))
	for k, v := range fields {
		if req, ok := commandFieldCapabilities[k]; ok && !caps[req] {
			continue
		}
		out[k] = v
	}
	return out
}
