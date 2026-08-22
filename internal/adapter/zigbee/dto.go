package zigbee

import "encoding/json"

type z2mBridgeDevice struct {
	IEEEAddress        string                 `json:"ieee_address"`
	FriendlyName       string                 `json:"friendly_name"`
	Type               string                 `json:"type"`
	NetworkAddress     *int64                 `json:"network_address"`
	Supported          *bool                  `json:"supported"`
	InterviewState     *string                `json:"interview_state"`
	InterviewCompleted *bool                  `json:"interview_completed"`
	Interviewing       *bool                  `json:"interviewing"`
	Description        *string                `json:"description"`
	Manufacturer       *string                `json:"manufacturer"`
	ModelID            *string                `json:"model_id"`
	PowerSource        *string                `json:"power_source"`
	SoftwareBuildID    *string                `json:"software_build_id"`
	DateCode           *string                `json:"date_code"`
	Definition         *z2mDefinition         `json:"definition"`
	Endpoints          map[string]z2mEndpoint `json:"endpoints"`
}

type z2mDefinition struct {
	Model       *string      `json:"model"`
	Vendor      *string      `json:"vendor"`
	Description *string      `json:"description"`
	Source      *string      `json:"source"`
	Icon        *string      `json:"icon"`
	SupportsOTA *bool        `json:"supports_ota"`
	Exposes     []z2mFeature `json:"exposes"`
}

type z2mEndpoint struct {
	ProfileID            *int           `json:"profile_id"`
	DeviceID             *int           `json:"device_id"`
	Bindings             []z2mBinding   `json:"bindings"`
	Clusters             z2mClusters    `json:"clusters"`
	ConfiguredReportings []z2mReporting `json:"configured_reportings"`
}

type z2mClusters struct {
	Input  []string `json:"input"`
	Output []string `json:"output"`
}

type z2mBinding struct {
	Cluster string           `json:"cluster"`
	Target  z2mBindingTarget `json:"target"`
}

type z2mBindingTarget struct {
	Type        string  `json:"type"`
	IEEEAddress *string `json:"ieee_address"`
	Endpoint    *int    `json:"endpoint"`
	ID          *int    `json:"id"`
}

type z2mReporting struct {
	Cluster               string   `json:"cluster"`
	Attribute             string   `json:"attribute"`
	MinimumReportInterval *int     `json:"minimum_report_interval"`
	MaximumReportInterval *int     `json:"maximum_report_interval"`
	ReportableChange      *float64 `json:"reportable_change"`
}

type z2mBridgeGroup struct {
	ID           int                    `json:"id"`
	FriendlyName string                 `json:"friendly_name"`
	Members      []z2mBridgeGroupMember `json:"members"`
}

type z2mBridgeGroupMember struct {
	IEEEAddress string `json:"ieee_address"`
	Endpoint    int    `json:"endpoint"`
}

type z2mFeature struct {
	Type        string          `json:"type"`
	Name        string          `json:"name"`
	Property    string          `json:"property"`
	Label       string          `json:"label"`
	Description string          `json:"description"`
	Category    string          `json:"category"`
	Features    []z2mFeature    `json:"features"`
	Access      int             `json:"access"`
	Values      []string        `json:"values"`
	ValueMin    *float64        `json:"value_min"`
	ValueMax    *float64        `json:"value_max"`
	Unit        string          `json:"unit"`
	ValueOn     json.RawMessage `json:"value_on"`
	ValueOff    json.RawMessage `json:"value_off"`
}

type z2mDeviceState struct {
	State      string    `json:"state"`
	Brightness *int      `json:"brightness"`
	ColorTemp  *int      `json:"color_temp"`
	Color      *z2mColor `json:"color"`
	ColorMode  string    `json:"color_mode"`

	Temperature   *float64 `json:"temperature"`
	Humidity      *float64 `json:"humidity"`
	Battery       *float64 `json:"battery"`
	Pressure      *float64 `json:"pressure"`
	Illuminance   *float64 `json:"illuminance"`
	Occupancy     *bool    `json:"occupancy"`
	Contact       *bool    `json:"contact"`
	Orientation   *string  `json:"orientation"`
	DevicePosture *string  `json:"device_posture"`
	LinkQuality   *float64 `json:"linkquality"`

	Power   *float64   `json:"power"`
	Voltage *float64   `json:"voltage"`
	Current *float64   `json:"current"`
	Energy  *float64   `json:"energy"`
	Update  *z2mUpdate `json:"update"`

	Action string `json:"action"`
}

type z2mUpdate struct {
	State            *string  `json:"state"`
	InstalledVersion *int64   `json:"installed_version"`
	LatestVersion    *int64   `json:"latest_version"`
	Progress         *float64 `json:"progress"`
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
