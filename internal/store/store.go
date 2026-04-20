// Package store holds the domain-facing persistence types and the *DB wrapper
// over sqlc-generated queries. Consumers import this package for the param /
// result structs and receive *DB concretely; they define their own narrow
// interfaces listing only the methods they need.
package store

import (
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
	ID        string
	Name      string
	CreatedBy *string
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
	CreatedBy *UserRef
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
	CreatedBy       *string
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
	CreatedBy       *UserRef
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
	ID        string
	Name      string
	CreatedBy *string
}

// Group represents a group row.
type Group struct {
	ID        string
	Name      string
	Icon      *string
	CreatedAt time.Time
	UpdatedAt time.Time
	CreatedBy *UserRef
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
	ID        string
	Name      string
	CreatedBy *string
}

// Room represents a room row.
type Room struct {
	ID        string
	Name      string
	Icon      *string
	CreatedAt time.Time
	UpdatedAt time.Time
	CreatedBy *UserRef
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

// CreateUserParams holds the parameters for creating a new user.
type CreateUserParams struct {
	ID           string
	Username     string
	Name         string
	PasswordHash string
}

// User represents a user row.
type User struct {
	ID           string
	Username     string
	Name         string
	PasswordHash string
	CreatedAt    time.Time
}

// UserRef is the lightweight creator reference embedded into other rows via
// LEFT JOIN. Contains only the columns needed to render attribution — no
// password hash, no timestamps.
type UserRef struct {
	ID       string
	Username string
	Name     string
}

// ActivityEvent represents a persisted activity log row. Source fields are
// denormalised so the list query never has to join against devices/scenes/rooms.
type ActivityEvent struct {
	ID          int64
	Type        string
	Timestamp   time.Time
	Message     string
	PayloadJSON string

	DeviceID   *string
	DeviceName *string
	DeviceType *string
	RoomID     *string
	RoomName   *string

	SceneID   *string
	SceneName *string

	AutomationID   *string
	AutomationName *string
}

// InsertActivityEventParams holds the parameters for inserting an activity event row.
type InsertActivityEventParams struct {
	Type        string
	Timestamp   time.Time
	Message     string
	PayloadJSON string

	DeviceID   *string
	DeviceName *string
	DeviceType *string
	RoomID     *string
	RoomName   *string

	SceneID   *string
	SceneName *string

	AutomationID   *string
	AutomationName *string
}

// ActivityQuery filters activity events. Zero values leave a filter unset.
// When Advanced is false, internal event types (command.requested,
// automation.node_activated) are excluded. Before is an exclusive cursor
// (id < Before) used for keyset pagination when scrolling into history.
type ActivityQuery struct {
	Types    []string
	DeviceID *string
	RoomID   *string
	Since    *time.Time
	Limit    int
	Advanced bool
	Before   *int64
}
