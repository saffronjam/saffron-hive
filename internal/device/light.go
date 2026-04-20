package device

// Color represents a light color in both RGB and CIE xy color spaces.
type Color struct {
	R int     `json:"r"`
	G int     `json:"g"`
	B int     `json:"b"`
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// LightState represents the current state of a light device.
// All fields are pointers to support partial updates.
type LightState struct {
	On         *bool    `json:"on,omitempty"`
	Brightness *int     `json:"brightness,omitempty"`
	ColorTemp  *int     `json:"colorTemp,omitempty"`
	Color      *Color   `json:"color,omitempty"`
	Transition *float64 `json:"transition,omitempty"`
}

// LightCommand represents a desired state to set on a light device.
// All fields are pointers to allow setting only specific attributes.
type LightCommand struct {
	On         *bool    `json:"on,omitempty"`
	Brightness *int     `json:"brightness,omitempty"`
	ColorTemp  *int     `json:"colorTemp,omitempty"`
	Color      *Color   `json:"color,omitempty"`
	Transition *float64 `json:"transition,omitempty"`
}
