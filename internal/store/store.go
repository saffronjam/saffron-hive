package store

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateDeviceParams holds the parameters for creating a new device.
type CreateDeviceParams struct {
	ID     device.DeviceID
	Name   string
	Source device.Source
	Type   device.DeviceType
}

// UpdateDeviceParams holds the parameters for updating a device.
type UpdateDeviceParams struct {
	ID        device.DeviceID
	Name      string
	Available bool
	Removed   bool
	LastSeen  time.Time
}

// RegisterZigbeeDeviceParams holds the parameters for registering a zigbee device.
type RegisterZigbeeDeviceParams struct {
	DeviceID     device.DeviceID
	IEEEAddress  string
	FriendlyName string
}

// ZigbeeDevice represents a zigbee device row.
type ZigbeeDevice struct {
	DeviceID     device.DeviceID
	IEEEAddress  string
	FriendlyName string
}

// CreateSceneParams holds the parameters for creating a new scene.
type CreateSceneParams struct {
	ID   string
	Name string
}

// Scene represents a scene row.
type Scene struct {
	ID        string
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CreateSceneActionParams holds the parameters for adding a scene action.
type CreateSceneActionParams struct {
	ID       string
	SceneID  string
	DeviceID device.DeviceID
	Payload  string
}

// SceneAction represents a scene action row.
type SceneAction struct {
	ID       string
	SceneID  string
	DeviceID device.DeviceID
	Payload  string
}

// CreateAutomationParams holds the parameters for creating an automation.
type CreateAutomationParams struct {
	ID              string
	Name            string
	Enabled         bool
	TriggerEvent    string
	ConditionExpr   string
	CooldownSeconds int
}

// Automation represents an automation row.
type Automation struct {
	ID              string
	Name            string
	Enabled         bool
	TriggerEvent    string
	ConditionExpr   string
	CooldownSeconds int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// CreateAutomationActionParams holds the parameters for adding an automation action.
type CreateAutomationActionParams struct {
	ID           string
	AutomationID string
	ActionType   string
	DeviceID     *device.DeviceID
	Payload      string
}

// AutomationAction represents an automation action row.
type AutomationAction struct {
	ID           string
	AutomationID string
	ActionType   string
	DeviceID     *device.DeviceID
	Payload      string
}

// InsertSensorReadingParams holds the parameters for inserting a sensor reading.
type InsertSensorReadingParams struct {
	DeviceID    device.DeviceID
	Temperature *float64
	Humidity    *float64
	Battery     *int
	Pressure    *float64
	Illuminance *float64
	RecordedAt  time.Time
}

// SensorReading represents a sensor history row.
type SensorReading struct {
	ID          int64
	DeviceID    device.DeviceID
	Temperature *float64
	Humidity    *float64
	Battery     *int
	Pressure    *float64
	Illuminance *float64
	RecordedAt  time.Time
}

// SensorHistoryQuery holds the parameters for querying sensor history.
type SensorHistoryQuery struct {
	DeviceID device.DeviceID
	From     time.Time
	To       time.Time
	Limit    int
}

// Store defines the persistence interface for the application.
type Store interface {
	CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error)
	GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error)
	ListDevices(ctx context.Context) ([]device.Device, error)
	ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error)
	UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error)
	DeleteDevice(ctx context.Context, id device.DeviceID) error

	RegisterZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) (ZigbeeDevice, error)
	GetZigbeeDeviceByIEEEAddress(ctx context.Context, ieeeAddress string) (ZigbeeDevice, error)
	GetZigbeeDeviceByFriendlyName(ctx context.Context, friendlyName string) (ZigbeeDevice, error)

	CreateScene(ctx context.Context, params CreateSceneParams) (Scene, error)
	GetScene(ctx context.Context, id string) (Scene, error)
	ListScenes(ctx context.Context) ([]Scene, error)
	DeleteScene(ctx context.Context, id string) error
	CreateSceneAction(ctx context.Context, params CreateSceneActionParams) (SceneAction, error)
	ListSceneActions(ctx context.Context, sceneID string) ([]SceneAction, error)
	DeleteSceneAction(ctx context.Context, id string) error

	CreateAutomation(ctx context.Context, params CreateAutomationParams) (Automation, error)
	GetAutomation(ctx context.Context, id string) (Automation, error)
	ListAutomations(ctx context.Context) ([]Automation, error)
	ListEnabledAutomations(ctx context.Context) ([]Automation, error)
	UpdateAutomationEnabled(ctx context.Context, id string, enabled bool) error
	DeleteAutomation(ctx context.Context, id string) error
	CreateAutomationAction(ctx context.Context, params CreateAutomationActionParams) (AutomationAction, error)
	ListAutomationActions(ctx context.Context, automationID string) ([]AutomationAction, error)
	DeleteAutomationAction(ctx context.Context, id string) error

	InsertSensorReading(ctx context.Context, params InsertSensorReadingParams) (SensorReading, error)
	QuerySensorHistory(ctx context.Context, query SensorHistoryQuery) ([]SensorReading, error)
}
