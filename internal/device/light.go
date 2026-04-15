package device

// Color represents a light color in both RGB and CIE xy color spaces.
type Color struct {
	R int
	G int
	B int
	X float64
	Y float64
}

// LightState represents the current state of a light device.
// All fields are pointers to support partial updates.
type LightState struct {
	On         *bool
	Brightness *int
	ColorTemp  *int
	Color      *Color
	Transition *float64
}

// LightCommand represents a desired state to set on a light device.
// All fields are pointers to allow setting only specific attributes.
type LightCommand struct {
	On         *bool
	Brightness *int
	ColorTemp  *int
	Color      *Color
	Transition *float64
}
