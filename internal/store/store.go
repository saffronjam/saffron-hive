// Package store holds the domain-facing persistence types and the *DB wrapper
// over sqlc-generated queries. Consumers import this package for the param /
// result structs and receive *DB concretely; they define their own narrow
// interfaces listing only the methods they need.
package store

import (
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
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

// UpdateDeviceIconParams holds the parameters for updating a device's icon.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateDeviceIconParams struct {
	ID      device.DeviceID
	SetIcon bool
	Icon    *string
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
	Rooms     []string
}

// UpdateSceneParams holds optional fields for updating a scene.
// SetIcon distinguishes "leave icon alone" (false) from "set icon to this value"
// (true, with Icon either a pointer to the new value or nil to clear the column).
// SetRooms likewise distinguishes "leave rooms alone" from "replace rooms with
// this set" (nil/empty Rooms clears all room assignments when SetRooms is true).
type UpdateSceneParams struct {
	Name     *string
	SetIcon  bool
	Icon     *string
	SetRooms bool
	Rooms    []string
}

// Scene represents a scene row. ActivatedAt is non-nil while the scene is
// currently active — every device it reached at apply time is still in the
// scene's desired state. Any scene-relevant state change on any of those
// devices clears ActivatedAt back to nil. Rooms is the list of room IDs the
// scene is tagged to (controls which room drawer surfaces it on the dashboard).
type Scene struct {
	ID          string
	Name        string
	Icon        *string
	Rooms       []string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CreatedBy   *UserRef
	ActivatedAt *time.Time
}

// SceneExpectedState is the scene-relevant state snapshot taken when a scene
// was applied to a device. The watcher compares incoming device state events
// against this snapshot to decide whether the scene is still active.
// Nil fields mean "unknown at apply time" — any later non-nil value invalidates.
type SceneExpectedState struct {
	SceneID    string
	DeviceID   device.DeviceID
	On         *bool
	Brightness *int
	ColorTemp  *int
	ColorR     *int
	ColorG     *int
	ColorB     *int
}

// ActiveSceneSnapshot pairs an active scene's ID and activation timestamp
// with the expected device states captured at apply time. Returned by
// ListActiveScenesWithExpectedStates for watcher hydration on startup.
type ActiveSceneSnapshot struct {
	SceneID     string
	ActivatedAt time.Time
	Expected    []SceneExpectedState
}

// CreateSceneActionParams holds the parameters for adding a scene action.
type CreateSceneActionParams struct {
	SceneID    string
	TargetType string
	TargetID   string
}

// SceneAction represents a scene action row.
type SceneAction struct {
	SceneID    string
	TargetType string
	TargetID   string
}

// SceneTargetRef is a logical membership entry in a scene's target list.
// TargetType is one of "device", "group", or "room".
type SceneTargetRef struct {
	TargetType string
	TargetID   string
}

// SceneDevicePayload is the per-device payload associated with a scene.
// Keyed by (SceneID, DeviceID). Payload is the raw on-disk JSON; callers
// parse it with ParseScenePayload to inspect the tagged-union shape.
type SceneDevicePayload struct {
	SceneID  string
	DeviceID device.DeviceID
	Payload  string
}

// ScenePayloadKind tags the polymorphic shape of a scene's per-device payload.
type ScenePayloadKind string

const (
	// ScenePayloadStatic is a desired-state command (on/brightness/color/...).
	ScenePayloadStatic ScenePayloadKind = "static"
	// ScenePayloadEffect references a stored timeline/native effect by ID
	// to start on the device when the scene is applied.
	ScenePayloadEffect ScenePayloadKind = "effect"
	// ScenePayloadNativeEffect references an auto-discovered native effect by
	// name (no stored Effect row) to start on the device when the scene is
	// applied.
	ScenePayloadNativeEffect ScenePayloadKind = "native_effect"
)

// ScenePayload is the parsed tagged-union form of a scene's per-device payload.
// Exactly one of Static / EffectID / NativeName is meaningful, selected by
// Kind. Static is the raw desired-state field map
// (on/brightness/colorTemp/color/transition); the apply path applies
// capability gating against it.
type ScenePayload struct {
	Kind       ScenePayloadKind
	Static     map[string]any
	EffectID   string
	NativeName string
}

// SaveSceneContentParams holds the membership + per-device payload set for a scene.
type SaveSceneContentParams struct {
	SceneID  string
	Targets  []SceneTargetRef
	Payloads []SceneDevicePayload
}

// CreateAutomationParams holds the parameters for creating an automation.
type CreateAutomationParams struct {
	ID        string
	Name      string
	Enabled   bool
	CreatedBy *string
}

// UpdateAutomationParams holds optional fields for updating an automation.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateAutomationParams struct {
	Name    *string
	SetIcon bool
	Icon    *string
	Enabled *bool
}

// Automation represents an automation row.
type Automation struct {
	ID          string
	Name        string
	Icon        *string
	Enabled     bool
	LastFiredAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CreatedBy   *UserRef
}

// CreateAutomationNodeParams holds the parameters for creating an automation node.
type CreateAutomationNodeParams struct {
	ID           string
	AutomationID string
	Type         string
	Config       string
	PositionX    float64
	PositionY    float64
}

// AutomationNode represents an automation node row.
type AutomationNode struct {
	ID           string
	AutomationID string
	Type         string
	Config       string
	PositionX    float64
	PositionY    float64
}

// CreateAutomationEdgeParams holds the parameters for creating an automation edge.
type CreateAutomationEdgeParams struct {
	AutomationID string
	FromNodeID   string
	ToNodeID     string
}

// AutomationEdge represents an automation edge row.
type AutomationEdge struct {
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
	Tags      []device.GroupTag
}

// Group represents a group row.
type Group struct {
	ID        string
	Name      string
	Icon      *string
	Tags      []device.GroupTag
	CreatedAt time.Time
	UpdatedAt time.Time
	CreatedBy *UserRef
}

// UpdateGroupParams holds the parameters for updating a group.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
// SetTags likewise distinguishes "leave tags alone" from "replace tags with this set"
// (nil/empty Tags clears all tags when SetTags is true).
type UpdateGroupParams struct {
	ID      string
	Name    string
	SetIcon bool
	Icon    *string
	SetTags bool
	Tags    []device.GroupTag
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

// InsertStateSampleParams holds the parameters for inserting a single device state sample.
type InsertStateSampleParams struct {
	DeviceID   device.DeviceID
	Field      string
	Value      float64
	RecordedAt time.Time
}

// StateSample represents a single recorded device state field value at a point in time.
type StateSample struct {
	ID         int64
	DeviceID   device.DeviceID
	Field      string
	Value      float64
	RecordedAt time.Time
}

// StateHistoryQuery parameterises a device state history lookup. When
// BucketSeconds is > 0 the result is averaged over fixed-size time buckets;
// when it is 0 raw samples are returned. Fields empty means "every field".
type StateHistoryQuery struct {
	DeviceIDs     []device.DeviceID
	Fields        []string
	From          time.Time
	To            time.Time
	BucketSeconds int
	Limit         int
}

// StateHistoryPoint is one point on a device-state time series.
type StateHistoryPoint struct {
	DeviceID device.DeviceID
	Field    string
	At       time.Time
	Value    float64
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

// AddRoomMemberParams holds the parameters for adding a member to a room.
type AddRoomMemberParams struct {
	ID         string
	RoomID     string
	MemberType device.RoomMemberType
	MemberID   string
}

// RoomMember represents a room-member row (a device or group attached to a room).
type RoomMember struct {
	ID         string
	RoomID     string
	MemberType device.RoomMemberType
	MemberID   string
}

// RoomMemberInput is one entry in a batch-add call.
type RoomMemberInput struct {
	MemberType device.RoomMemberType
	MemberID   string
}

// RoomMembership pairs a member with one room it currently belongs to. A member
// can appear more than once in the slice if it is a member of multiple rooms.
type RoomMembership struct {
	ID         string
	RoomID     string
	RoomName   string
	MemberType device.RoomMemberType
	MemberID   string
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
	AvatarPath   *string
	Theme        string
	CreatedAt    time.Time
}

// UpdateUserProfileParams holds optional fields for updating a user's profile.
// Nil fields leave the corresponding column untouched. AvatarPath cannot clear
// the column to NULL here — use ClearUserAvatar for that.
type UpdateUserProfileParams struct {
	ID         string
	Name       *string
	Theme      *string
	AvatarPath *string
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

// AlarmSeverity classifies an alarm by how urgently it should be acted on.
type AlarmSeverity string

const (
	AlarmSeverityHigh   AlarmSeverity = "high"
	AlarmSeverityMedium AlarmSeverity = "medium"
	AlarmSeverityLow    AlarmSeverity = "low"
)

// AlarmKind classifies an alarm's lifecycle semantics. Auto alarms represent
// an ongoing condition that is normally cleared when the condition resolves;
// one-shot alarms represent a point-in-time event that sticks until the user
// deletes it.
type AlarmKind string

const (
	AlarmKindAuto    AlarmKind = "auto"
	AlarmKindOneShot AlarmKind = "one_shot"
)

// AlarmRow is a single persisted alarm raise. Multiple rows may share the same
// AlarmID; grouping happens above the store.
type AlarmRow struct {
	ID       int64
	AlarmID  string
	Severity AlarmSeverity
	Kind     AlarmKind
	Message  string
	Source   string
	RaisedAt time.Time
}

// InsertAlarmParams holds the fields for inserting a new alarm raise.
type InsertAlarmParams struct {
	AlarmID  string
	Severity AlarmSeverity
	Kind     AlarmKind
	Message  string
	Source   string
	RaisedAt time.Time
}

// CreateEffectParams holds the parameters for creating a new effect. Tracks is
// optional at create time; callers can populate the timeline later via
// SaveEffectTracks.
type CreateEffectParams struct {
	ID         string
	Name       string
	Icon       *string
	Kind       effect.Kind
	NativeName *string
	Loop       bool
	DurationMs int
	CreatedBy  *string
	Tracks     []EffectTrackInput
}

// UpdateEffectParams holds optional fields for updating an effect. Nil pointers
// leave the corresponding column untouched. SetIcon / SetNativeName distinguish
// "leave alone" from "set / clear" so the nullable columns can be cleared
// explicitly without conflating with "no-op".
type UpdateEffectParams struct {
	Name          *string
	SetIcon       bool
	Icon          *string
	Kind          *effect.Kind
	SetNativeName bool
	NativeName    *string
	Loop          *bool
	DurationMs    *int
}

// EffectTrackInput is one track in a save-effect-tracks batch. The caller
// picks the ID; Index is the track's position in the effect (must be unique
// within the effect). Name is the user-supplied label shown in the editor;
// empty string is allowed and rendered as a placeholder by the UI. Clips
// holds the ordered, mutually-exclusive clips on this track.
type EffectTrackInput struct {
	ID    string
	Index int
	Name  string
	Clips []EffectClipInput
}

// EffectClipInput is one clip on a track in a save-effect-tracks batch. The
// caller picks the ID. ConfigJSON is the marshalled clip config matching Kind.
type EffectClipInput struct {
	ID              string
	StartMs         int
	TransitionMinMs int
	TransitionMaxMs int
	Kind            effect.ClipKind
	ConfigJSON      string
}

// EffectClip is the persistence-layer representation of a single clip on a
// track. ConfigJSON is the raw on-disk JSON; callers parse it with
// effect.UnmarshalClipConfig.
type EffectClip struct {
	ID              string
	TrackID         string
	StartMs         int
	TransitionMinMs int
	TransitionMaxMs int
	Kind            effect.ClipKind
	ConfigJSON      string
}

// EffectTrack is the persistence-layer representation of a single track on an
// effect. Clips are ordered by start_ms. Name is a user-supplied label shown
// in the editor; the empty string is valid and rendered as a placeholder.
type EffectTrack struct {
	ID       string
	EffectID string
	Index    int
	Name     string
	Clips    []EffectClip
}

// Effect is the persistence-layer representation of an effect row paired with
// its track list. Frontend / runtime code maps this to the domain effect.Effect
// (with parsed ClipConfig payloads).
type Effect struct {
	ID         string
	Name       string
	Icon       *string
	Kind       effect.Kind
	NativeName *string
	Loop       bool
	DurationMs int
	CreatedAt  time.Time
	UpdatedAt  time.Time
	CreatedBy  *UserRef
	Tracks     []EffectTrack
}
