package graph

import (
	"context"
	"log/slog"
	"time"

	"github.com/saffronjam/saffron-hive/internal/activity"
	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// AutomationReloader reloads automation rules after configuration changes.
type AutomationReloader interface {
	Reload() error
}

// AutomationTriggerer fires a manual trigger node on demand. Used by the
// fireAutomationTrigger mutation for in-editor debugging.
type AutomationTriggerer interface {
	FireManualTrigger(ctx context.Context, automationID, nodeID string) error
}

// MQTTReconnector reconnects the MQTT adapter with the latest DB config.
type MQTTReconnector interface {
	Reconnect(ctx context.Context) error
}

// GraphStore is the store surface the GraphQL layer touches. Every method is
// invoked by a resolver, mutation, or helper in this package; *store.DB
// satisfies it implicitly.
type GraphStore interface {
	// Devices
	GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error)
	UpdateDevice(ctx context.Context, params store.UpdateDeviceParams) (device.Device, error)

	// Scenes
	CreateScene(ctx context.Context, params store.CreateSceneParams) (store.Scene, error)
	GetScene(ctx context.Context, id string) (store.Scene, error)
	ListScenes(ctx context.Context) ([]store.Scene, error)
	UpdateScene(ctx context.Context, id string, params store.UpdateSceneParams) (store.Scene, error)
	DeleteScene(ctx context.Context, id string) error
	BatchDeleteScenes(ctx context.Context, ids []string) (int64, error)
	CreateSceneAction(ctx context.Context, params store.CreateSceneActionParams) (store.SceneAction, error)
	ListSceneActions(ctx context.Context, sceneID string) ([]store.SceneAction, error)
	ListSceneDevicePayloads(ctx context.Context, sceneID string) ([]store.SceneDevicePayload, error)
	SaveSceneContent(ctx context.Context, params store.SaveSceneContentParams) error

	// Automations
	CreateAutomation(ctx context.Context, params store.CreateAutomationParams) (store.Automation, error)
	GetAutomation(ctx context.Context, id string) (store.Automation, error)
	ListAutomations(ctx context.Context) ([]store.Automation, error)
	UpdateAutomation(ctx context.Context, id string, params store.UpdateAutomationParams) (store.Automation, error)
	UpdateAutomationEnabled(ctx context.Context, id string, enabled bool) error
	DeleteAutomation(ctx context.Context, id string) error
	BatchDeleteAutomations(ctx context.Context, ids []string) (int64, error)
	CreateAutomationNode(ctx context.Context, params store.CreateAutomationNodeParams) (store.AutomationNode, error)
	ListAutomationNodes(ctx context.Context, automationID string) ([]store.AutomationNode, error)
	CreateAutomationEdge(ctx context.Context, params store.CreateAutomationEdgeParams) (store.AutomationEdge, error)
	ListAutomationEdges(ctx context.Context, automationID string) ([]store.AutomationEdge, error)
	ReplaceAutomationGraph(ctx context.Context, automationID string, nodes []store.CreateAutomationNodeParams, edges []store.CreateAutomationEdgeParams) error
	GetAutomationGraph(ctx context.Context, automationID string) (store.AutomationGraph, error)

	// Groups
	CreateGroup(ctx context.Context, params store.CreateGroupParams) (store.Group, error)
	GetGroup(ctx context.Context, id string) (store.Group, error)
	ListGroups(ctx context.Context) ([]store.Group, error)
	UpdateGroup(ctx context.Context, params store.UpdateGroupParams) (store.Group, error)
	DeleteGroup(ctx context.Context, id string) error
	BatchDeleteGroups(ctx context.Context, ids []string) (int64, error)
	AddGroupMember(ctx context.Context, params store.AddGroupMemberParams) (store.GroupMember, error)
	BatchAddGroupDevices(ctx context.Context, groupID string, deviceIDs []string) (int64, error)
	ListGroupMembers(ctx context.Context, groupID string) ([]store.GroupMember, error)
	RemoveGroupMember(ctx context.Context, id string) error
	ListGroupsContainingMember(ctx context.Context, memberType device.GroupMemberType, memberID string) ([]store.Group, error)

	// Rooms
	CreateRoom(ctx context.Context, params store.CreateRoomParams) (store.Room, error)
	GetRoom(ctx context.Context, id string) (store.Room, error)
	ListRooms(ctx context.Context) ([]store.Room, error)
	UpdateRoom(ctx context.Context, params store.UpdateRoomParams) (store.Room, error)
	DeleteRoom(ctx context.Context, id string) error
	BatchDeleteRooms(ctx context.Context, ids []string) (int64, error)
	AddRoomMember(ctx context.Context, params store.AddRoomMemberParams) (store.RoomMember, error)
	BatchAddRoomMembers(ctx context.Context, roomID string, members []store.RoomMemberInput) (int64, error)
	ListRoomMembers(ctx context.Context, roomID string) ([]store.RoomMember, error)
	RemoveRoomMember(ctx context.Context, id string) error
	ListRoomsContainingMember(ctx context.Context, memberType device.RoomMemberType, memberID string) ([]store.Room, error)

	// State history, activity, settings, mqtt, users
	QueryStateHistory(ctx context.Context, query store.StateHistoryQuery) ([]store.StateHistoryPoint, error)
	QueryActivityEvents(ctx context.Context, query store.ActivityQuery) ([]store.ActivityEvent, error)
	PruneActivityEventsOlderThan(ctx context.Context, cutoff time.Time) (int64, error)
	GetMQTTConfig(ctx context.Context) (*store.MQTTConfig, error)
	UpsertMQTTConfig(ctx context.Context, cfg store.MQTTConfig) error
	ListSettings(ctx context.Context) ([]store.Setting, error)
	UpsertSetting(ctx context.Context, key, value string) error
	CreateUser(ctx context.Context, params store.CreateUserParams) (store.User, error)
	GetUserByID(ctx context.Context, id string) (store.User, error)
	GetUserByUsername(ctx context.Context, username string) (store.User, error)
	ListUsers(ctx context.Context) ([]store.User, error)
	CountUsers(ctx context.Context) (int, error)
	UpdateUserProfile(ctx context.Context, params store.UpdateUserProfileParams) (store.User, error)
	ClearUserAvatar(ctx context.Context, id string) error
	UpdateUserPasswordHash(ctx context.Context, id, hash string) error
	DeleteUser(ctx context.Context, id string) error
	BatchDeleteUsers(ctx context.Context, ids []string) (int64, error)
	GetUserAvatarPath(ctx context.Context, id string) (*string, error)
	GetUserAvatarPathsByIDs(ctx context.Context, ids []string) (map[string]string, error)
}

// Resolver is the root resolver that holds all dependencies required by the
// GraphQL query, mutation, and subscription resolvers.
type Resolver struct {
	StateReader         device.StateReader
	Store               GraphStore
	TargetResolver      device.TargetResolver
	EventBus            eventbus.EventBus
	AutomationReloader  AutomationReloader
	AutomationTriggerer AutomationTriggerer
	LogBuffer           *logging.Buffer
	ActivityBuffer      *activity.Buffer
	Alarms              *alarms.Service
	AlarmBuffer         *alarms.Buffer
	LevelVar            *slog.LevelVar
	Reconnector         MQTTReconnector
	Auth                *auth.Service
	// AvatarDir is the filesystem directory where per-user avatar files live.
	// Used by deleteUser to remove the file alongside the row.
	AvatarDir string
}
