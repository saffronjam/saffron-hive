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

// Automation represents an automation row.
type Automation struct {
	ID              string
	Name            string
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
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UpdateGroupParams holds the parameters for updating a group.
type UpdateGroupParams struct {
	ID   string
	Name string
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
}
