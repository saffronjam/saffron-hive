package zigbee

type z2mBridgeDevice struct {
	IEEEAddress  string        `json:"ieee_address"`
	FriendlyName string        `json:"friendly_name"`
	Type         string        `json:"type"`
	Supported    bool          `json:"supported"`
	Definition   z2mDefinition `json:"definition"`
}

type z2mDefinition struct {
	Model       string       `json:"model"`
	Vendor      string       `json:"vendor"`
	Description string       `json:"description"`
	Exposes     []z2mFeature `json:"exposes"`
}

type z2mFeature struct {
	Type     string       `json:"type"`
	Name     string       `json:"name"`
	Property string       `json:"property"`
	Features []z2mFeature `json:"features"`
	Access   int          `json:"access"`
	Values   []string     `json:"values"`
	ValueMin *float64     `json:"value_min"`
	ValueMax *float64     `json:"value_max"`
	Unit     string       `json:"unit"`
}

type z2mDeviceState struct {
	State      string    `json:"state"`
	Brightness *int      `json:"brightness"`
	ColorTemp  *int      `json:"color_temp"`
	Color      *z2mColor `json:"color"`
	ColorMode  string    `json:"color_mode"`

	Temperature *float64 `json:"temperature"`
	Humidity    *float64 `json:"humidity"`
	Battery     *float64 `json:"battery"`
	Pressure    *float64 `json:"pressure"`
	Illuminance *float64 `json:"illuminance"`
	Occupancy   *bool    `json:"occupancy"`

	Power   *float64 `json:"power"`
	Voltage *float64 `json:"voltage"`
	Current *float64 `json:"current"`
	Energy  *float64 `json:"energy"`

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

// The networkmap response uses camelCase keys, unlike the snake_case of
// bridge/devices — both shapes are zigbee2mqtt's own.

type z2mNetworkmapResponse struct {
	Status string            `json:"status"`
	Error  string            `json:"error"`
	Data   z2mNetworkmapData `json:"data"`
}

type z2mNetworkmapData struct {
	Type  string             `json:"type"`
	Value z2mNetworkmapValue `json:"value"`
}

type z2mNetworkmapValue struct {
	Nodes []z2mNetworkmapNode `json:"nodes"`
	Links []z2mNetworkmapLink `json:"links"`
}

type z2mNetworkmapNode struct {
	IEEEAddr       string `json:"ieeeAddr"`
	FriendlyName   string `json:"friendlyName"`
	Type           string `json:"type"`
	NetworkAddress int    `json:"networkAddress"`
}

type z2mNetworkmapLink struct {
	Source       z2mNetworkmapEndpoint `json:"source"`
	Target       z2mNetworkmapEndpoint `json:"target"`
	LQI          int                   `json:"lqi"`
	Relationship int                   `json:"relationship"`
	Routes       []z2mNetworkmapRoute  `json:"routes"`
}

type z2mNetworkmapEndpoint struct {
	IEEEAddr       string `json:"ieeeAddr"`
	NetworkAddress int    `json:"networkAddress"`
}

type z2mNetworkmapRoute struct {
	DestinationAddress int    `json:"destinationAddress"`
	Status             string `json:"status"`
}
