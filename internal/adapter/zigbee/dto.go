package zigbee

type z2mBridgeDevice struct {
	IEEEAddress  string        `json:"ieee_address"`
	FriendlyName string        `json:"friendly_name"`
	Type         string        `json:"type"`
	Supported    bool          `json:"supported"`
	Definition   z2mDefinition `json:"definition"`
	Features     []z2mFeature  `json:"features"`
}

type z2mDefinition struct {
	Model       string `json:"model"`
	Vendor      string `json:"vendor"`
	Description string `json:"description"`
}

type z2mFeature struct {
	Type     string       `json:"type"`
	Name     string       `json:"name"`
	Property string       `json:"property"`
	Features []z2mFeature `json:"features"`
}

type z2mDeviceState struct {
	State      string    `json:"state"`
	Brightness int       `json:"brightness"`
	ColorTemp  int       `json:"color_temp"`
	Color      *z2mColor `json:"color"`

	Temperature *float64 `json:"temperature"`
	Humidity    *float64 `json:"humidity"`
	Battery     *int     `json:"battery"`
	Pressure    *float64 `json:"pressure"`
	Illuminance *float64 `json:"illuminance"`

	Action string `json:"action"`
}

type z2mColor struct {
	R int     `json:"r"`
	G int     `json:"g"`
	B int     `json:"b"`
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type z2mBridgeLog struct {
	Type    string `json:"type"`
	Message string `json:"message"`
}

type z2mAvailability struct {
	State string `json:"state"`
}
