package store

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateDeviceParams holds the parameters for creating a new device.
type CreateDeviceParams struct {
	ID           device.DeviceID
	Name         string
	Source       device.Source
	Type         device.DeviceType
	Capabilities []device.Capability
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

// UpdateSceneParams holds optional fields for updating a scene.
// SetIcon distinguishes "leave icon alone" (false) from "set icon to this value"
// (true, with Icon either a pointer to the new value or nil to clear the column).
type UpdateSceneParams struct {
	Name    *string
	SetIcon bool
	Icon    *string
}

// Scene represents a scene row.
type Scene struct {
	ID        string
	Name      string
	Icon      *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// CreateSceneActionParams holds the parameters for adding a scene action.
type CreateSceneActionParams struct {
	ID         string
	SceneID    string
	TargetType string
	TargetID   string
	Payload    string
}

// SceneAction represents a scene action row.
type SceneAction struct {
	ID         string
	SceneID    string
	TargetType string
	TargetID   string
	Payload    string
}

// CreateAutomationParams holds the parameters for creating an automation.
type CreateAutomationParams struct {
	ID              string
	Name            string
	Enabled         bool
	CooldownSeconds int
}

// UpdateAutomationParams holds optional fields for updating an automation.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateAutomationParams struct {
	Name            *string
	SetIcon         bool
	Icon            *string
	Enabled         *bool
	CooldownSeconds *int
}

// Automation represents an automation row.
type Automation struct {
	ID              string
	Name            string
	Icon            *string
	Enabled         bool
	CooldownSeconds int
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// CreateAutomationNodeParams holds the parameters for creating an automation node.
type CreateAutomationNodeParams struct {
	ID           string
	AutomationID string
	Type         string
	Config       string
}

// AutomationNode represents an automation node row.
type AutomationNode struct {
	ID           string
	AutomationID string
	Type         string
	Config       string
}

// CreateAutomationEdgeParams holds the parameters for creating an automation edge.
type CreateAutomationEdgeParams struct {
	ID           string
	AutomationID string
	FromNodeID   string
	ToNodeID     string
}

// AutomationEdge represents an automation edge row.
type AutomationEdge struct {
	ID           string
	AutomationID string
	FromNodeID   string
	ToNodeID     string
}

// AutomationGraph represents a full automation graph loaded from the database.
type AutomationGraph struct {
	Automation Automation
	Nodes      []AutomationNode
	Edges      []AutomationEdge
}

// CreateGroupParams holds the parameters for creating a new group.
type CreateGroupParams struct {
	ID   string
	Name string
}

// Group represents a group row.
type Group struct {
	ID        string
	Name      string
	Icon      *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UpdateGroupParams holds the parameters for updating a group.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateGroupParams struct {
	ID      string
	Name    string
	SetIcon bool
	Icon    *string
}

// AddGroupMemberParams holds the parameters for adding a group member.
type AddGroupMemberParams struct {
	ID         string
	GroupID    string
	MemberType device.GroupMemberType
	MemberID   string
}

// GroupMember represents a group member row.
type GroupMember struct {
	ID         string
	GroupID    string
	MemberType device.GroupMemberType
	MemberID   string
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

// MQTTConfig represents the MQTT broker configuration stored in the database.
type MQTTConfig struct {
	Broker   string
	Username string
	Password string
	UseWSS   bool
}

// Setting represents a key-value setting row.
type Setting struct {
	Key   string
	Value string
}

// CreateRoomParams holds the parameters for creating a new room.
type CreateRoomParams struct {
	ID   string
	Name string
}

// Room represents a room row.
type Room struct {
	ID        string
	Name      string
	Icon      *string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UpdateRoomParams holds the parameters for updating a room.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateRoomParams struct {
	ID      string
	Name    string
	SetIcon bool
	Icon    *string
}

// AddRoomDeviceParams holds the parameters for adding a device to a room.
type AddRoomDeviceParams struct {
	ID       string
	RoomID   string
	DeviceID string
}

// RoomDevice represents a room-device membership row.
type RoomDevice struct {
	ID       string
	RoomID   string
	DeviceID string
}

// Store defines the persistence interface for the application.
type Store interface {
	CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error)
	UpsertDevice(ctx context.Context, params CreateDeviceParams) error
	GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error)
	ListDevices(ctx context.Context) ([]device.Device, error)
	ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error)
	UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error)
	DeleteDevice(ctx context.Context, id device.DeviceID) error

	RegisterZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) (ZigbeeDevice, error)
	UpsertZigbeeDevice(ctx context.Context, params RegisterZigbeeDeviceParams) error
	GetZigbeeDeviceByIEEEAddress(ctx context.Context, ieeeAddress string) (ZigbeeDevice, error)
	GetZigbeeDeviceByFriendlyName(ctx context.Context, friendlyName string) (ZigbeeDevice, error)

	CreateScene(ctx context.Context, params CreateSceneParams) (Scene, error)
	GetScene(ctx context.Context, id string) (Scene, error)
	ListScenes(ctx context.Context) ([]Scene, error)
	UpdateScene(ctx context.Context, id string, params UpdateSceneParams) (Scene, error)
	DeleteScene(ctx context.Context, id string) error
	CreateSceneAction(ctx context.Context, params CreateSceneActionParams) (SceneAction, error)
	ListSceneActions(ctx context.Context, sceneID string) ([]SceneAction, error)
	DeleteSceneAction(ctx context.Context, id string) error

	CreateAutomation(ctx context.Context, params CreateAutomationParams) (Automation, error)
	GetAutomation(ctx context.Context, id string) (Automation, error)
	ListAutomations(ctx context.Context) ([]Automation, error)
	ListEnabledAutomations(ctx context.Context) ([]Automation, error)
	UpdateAutomation(ctx context.Context, id string, params UpdateAutomationParams) (Automation, error)
	UpdateAutomationEnabled(ctx context.Context, id string, enabled bool) error
	DeleteAutomation(ctx context.Context, id string) error
	CreateAutomationNode(ctx context.Context, params CreateAutomationNodeParams) (AutomationNode, error)
	ListAutomationNodes(ctx context.Context, automationID string) ([]AutomationNode, error)
	DeleteAutomationNode(ctx context.Context, id string) error
	CreateAutomationEdge(ctx context.Context, params CreateAutomationEdgeParams) (AutomationEdge, error)
	ListAutomationEdges(ctx context.Context, automationID string) ([]AutomationEdge, error)
	DeleteAutomationEdge(ctx context.Context, id string) error
	GetAutomationGraph(ctx context.Context, automationID string) (AutomationGraph, error)

	CreateGroup(ctx context.Context, params CreateGroupParams) (Group, error)
	GetGroup(ctx context.Context, id string) (Group, error)
	ListGroups(ctx context.Context) ([]Group, error)
	UpdateGroup(ctx context.Context, params UpdateGroupParams) (Group, error)
	DeleteGroup(ctx context.Context, id string) error
	AddGroupMember(ctx context.Context, params AddGroupMemberParams) (GroupMember, error)
	ListGroupMembers(ctx context.Context, groupID string) ([]GroupMember, error)
	RemoveGroupMember(ctx context.Context, id string) error
	ListGroupsContainingMember(ctx context.Context, memberType device.GroupMemberType, memberID string) ([]Group, error)

	InsertSensorReading(ctx context.Context, params InsertSensorReadingParams) (SensorReading, error)
	QuerySensorHistory(ctx context.Context, query SensorHistoryQuery) ([]SensorReading, error)

	GetMQTTConfig(ctx context.Context) (*MQTTConfig, error)
	UpsertMQTTConfig(ctx context.Context, cfg MQTTConfig) error

	GetSetting(ctx context.Context, key string) (Setting, error)
	ListSettings(ctx context.Context) ([]Setting, error)
	UpsertSetting(ctx context.Context, key, value string) error

	CreateRoom(ctx context.Context, params CreateRoomParams) (Room, error)
	GetRoom(ctx context.Context, id string) (Room, error)
	ListRooms(ctx context.Context) ([]Room, error)
	UpdateRoom(ctx context.Context, params UpdateRoomParams) (Room, error)
	DeleteRoom(ctx context.Context, id string) error
	AddRoomDevice(ctx context.Context, params AddRoomDeviceParams) (RoomDevice, error)
	ListRoomDevices(ctx context.Context, roomID string) ([]RoomDevice, error)
	RemoveRoomDevice(ctx context.Context, id string) error
	RemoveRoomDeviceByRoomAndDevice(ctx context.Context, roomID, deviceID string) error
	ListRoomsContainingDevice(ctx context.Context, deviceID string) ([]Room, error)
}
