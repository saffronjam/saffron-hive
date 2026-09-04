// Package store holds the domain-facing persistence types and the *DB wrapper
// over sqlc-generated queries. Consumers import this package for the param /
// result structs and receive *DB concretely; they define their own narrow
// interfaces listing only the methods they need.
package store

import (
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/lightfield"
)

// CreateDeviceParams holds the parameters for creating a new device. Every
// field is adapter-owned; the name override is set separately through
// SetDeviceName so a re-sync cannot clobber it.
type CreateDeviceParams struct {
	ID           device.DeviceID
	FriendlyName string
	Source       device.Source
	Type         device.DeviceType
	Capabilities []device.Capability
}

// UpdateDeviceParams holds the parameters for updating a device.
type UpdateDeviceParams struct {
	ID        device.DeviceID
	Available bool
	Removed   bool
	LastSeen  time.Time
	SetRoles  bool
	Roles     device.DeviceRoles
}

// UpdateDeviceIconParams holds the parameters for updating a device's icon.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
type UpdateDeviceIconParams struct {
	ID      device.DeviceID
	SetIcon bool
	Icon    *string
}

// UpdateDeviceDisplayColorParams holds the parameters for updating a device's
// floor-plan display colour. SetColor distinguishes "leave alone" from "set to
// this value" (nil clears the column).
type UpdateDeviceDisplayColorParams struct {
	ID       device.DeviceID
	SetColor bool
	Color    *string
}

// UpdateDeviceDisplayBrightnessParams holds the parameters for updating a
// device's floor-plan display brightness. SetBrightness distinguishes "leave
// alone" from "set to this value" (nil clears the column).
type UpdateDeviceDisplayBrightnessParams struct {
	ID            device.DeviceID
	SetBrightness bool
	Brightness    *int64
}

// CreateSceneParams holds the parameters for creating a new scene.
type CreateSceneParams struct {
	ID         string
	Name       string
	CreatedBy  *string
	Definition SceneDefinition
}

// UpdateSceneParams holds optional fields for updating a scene.
// SetIcon distinguishes "leave icon alone" (false) from "set icon to this value"
// (true, with Icon either a pointer to the new value or nil to clear the column).
type UpdateSceneParams struct {
	Name       *string
	SetIcon    bool
	Icon       *string
	Definition *SceneDefinition
}

// Scene represents a scene row. ActivatedAt is non-nil while its runtime owns
// the current resolved member set and every owned state field matches the
// Scene output.
type Scene struct {
	ID          string
	Name        string
	Icon        *string
	CreatedAt   time.Time
	UpdatedAt   time.Time
	CreatedBy   *UserRef
	ActivatedAt *time.Time
	Definition  SceneDefinition
}

// SceneTarget is one ordered structural or Selector lighting target.
type SceneTarget struct {
	EntryID    string
	Type       device.TargetType
	ID         string
	Expression device.Expression
	Name       string
}

// DesiredState is a concrete Scene state without transport identity or origin.
type DesiredState struct {
	On                *bool
	Brightness        *int
	ColorTemp         *int
	Color             *device.Color
	Transition        *float64
	TargetTemperature *float64
	HvacMode          *string
	FanMode           *string
	Swing             *string
}

// DynamicLighting stores an optional canonical field and its runtime controls.
type DynamicLighting struct {
	Field      lightfield.Field
	Seed       int64
	Brightness float64
	Movement   float64
	Cycle      time.Duration
	Provenance lightfield.Provenance
}

// SceneLightOverrideKind selects a target-bound per-light override.
type SceneLightOverrideKind string

const (
	SceneLightOverrideState        SceneLightOverrideKind = "state"
	SceneLightOverrideEffect       SceneLightOverrideKind = "effect"
	SceneLightOverrideNativeEffect SceneLightOverrideKind = "native_effect"
)

// SceneLightOverride replaces selected lighting channels while its device is
// resolved through a Scene target. Effects replace the composed state.
type SceneLightOverride struct {
	DeviceID         device.DeviceID
	Kind             SceneLightOverrideKind
	State            *DesiredState
	EffectID         string
	NativeEffectName string
}

// SceneSupportingState is an explicit non-light Scene member.
type SceneSupportingState struct {
	DeviceID device.DeviceID
	State    DesiredState
}

// SceneLighting composes an optional dynamic field and sparse target-bound
// light overrides.
type SceneLighting struct {
	Dynamic   *DynamicLighting
	Overrides []SceneLightOverride
}

// SceneDefinition is the complete atomic content of a Scene.
type SceneDefinition struct {
	Targets    []SceneTarget
	Lighting   SceneLighting
	Supporting []SceneSupportingState
}

// SceneMemberKind identifies how one physical member participates in a run.
type SceneMemberKind string

const (
	SceneMemberField        SceneMemberKind = "field"
	SceneMemberState        SceneMemberKind = "state"
	SceneMemberEffect       SceneMemberKind = "effect"
	SceneMemberNativeEffect SceneMemberKind = "native_effect"
)

// SceneOwnedFields identifies the reported state controlled by one run member.
type SceneOwnedFields struct {
	On                bool
	Brightness        bool
	ColorTemp         bool
	Color             bool
	TargetTemperature bool
	HvacMode          bool
	FanMode           bool
	Swing             bool
}

// ActiveSceneMember is one physical device owned by an active Scene run.
type ActiveSceneMember struct {
	DeviceID    device.DeviceID
	Kind        SceneMemberKind
	Owned       SceneOwnedFields
	Expected    DesiredState
	EffectRunID string
}

// ActiveSceneRun is the persistent identity and member snapshot of one run.
type ActiveSceneRun struct {
	SceneID             string
	RunID               string
	StartedAt           time.Time
	DefinitionUpdatedAt time.Time
	Members             []ActiveSceneMember
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
// NodeStates carries persistent runtime state keyed by [nodeID][stateKey];
// graph fetches populate it from automation_node_state in one query.
type AutomationGraph struct {
	Automation Automation
	Nodes      []AutomationNode
	Edges      []AutomationEdge
	NodeStates map[string]map[string]string
}

// WebhookEndpoint is an externally callable event source. SecretHash is kept
// out of this domain type so authenticated read paths cannot expose it.
type WebhookEndpoint struct {
	ID                string
	Name              string
	Enabled           bool
	RateLimitCount    int
	RateLimitWindowMs int
	CreatedAt         time.Time
	UpdatedAt         time.Time
	CreatedBy         *UserRef
	LastDeliveryAt    *time.Time
}

// WebhookEndpointAuth is the private endpoint shape used to authenticate an
// incoming request by its secret hash.
type WebhookEndpointAuth struct {
	ID                string
	Name              string
	Enabled           bool
	SecretHash        string
	RateLimitCount    int
	RateLimitWindowMs int
}

// CreateWebhookEndpointParams holds persisted endpoint fields.
type CreateWebhookEndpointParams struct {
	ID                string
	Name              string
	Enabled           bool
	SecretHash        string
	RateLimitCount    int
	RateLimitWindowMs int
	CreatedBy         *string
}

// UpdateWebhookEndpointParams replaces the editable endpoint fields.
type UpdateWebhookEndpointParams struct {
	ID                string
	Name              string
	Enabled           bool
	RateLimitCount    int
	RateLimitWindowMs int
}

// WebhookDelivery is request metadata and content retained for diagnostics.
type WebhookDelivery struct {
	ID              string
	EndpointID      string
	ReceivedAt      time.Time
	Outcome         string
	HTTPStatus      int
	ClientIP        string
	UserAgent       string
	ContentType     string
	BodySize        int64
	Body            *string
	DurationMs      int64
	RequestID       *string
	QueryKeysJSON   string
	HeaderNamesJSON string
}

// InsertWebhookDeliveryParams holds sanitized delivery metadata.
type InsertWebhookDeliveryParams = WebhookDelivery

// WebhookAutomationReference identifies an automation using an endpoint.
type WebhookAutomationReference struct {
	ID   string
	Name string
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
	ID              string
	Name            *string
	FriendlyName    string
	Icon            *string
	Tags            []device.GroupTag
	Provider        string
	ProviderGroupID *string
	Removed         bool
	CreatedAt       time.Time
	UpdatedAt       time.Time
	CreatedBy       *UserRef
}

// DisplayName resolves the name to show for a group: the user's override, then
// the name its integration reports, then the id.
func (g Group) DisplayName() string {
	if g.Name != nil && *g.Name != "" {
		return *g.Name
	}
	if g.FriendlyName != "" {
		return g.FriendlyName
	}
	return g.ID
}

const (
	GroupProviderHive        = "hive"
	GroupProviderZigbee2MQTT = "zigbee2mqtt"
)

// UpdateGroupParams holds the parameters for updating a group. SetName
// distinguishes leaving the user-owned override untouched from setting or clearing it.
// SetIcon distinguishes "leave icon alone" from "set icon to this value" (nil clears the column).
// SetTags likewise distinguishes "leave tags alone" from "replace tags with this set"
// (nil/empty Tags clears all tags when SetTags is true).
type UpdateGroupParams struct {
	ID      string
	Name    *string
	SetName bool
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
	ID               string
	GroupID          string
	MemberType       device.GroupMemberType
	MemberID         string
	ProviderEndpoint *int64
}

// InsertStateSampleParams holds the parameters for inserting a single device state sample.
type InsertStateSampleParams struct {
	DeviceID     device.DeviceID
	Field        string
	NumericValue *float64
	TextValue    *string
	Deduplicate  bool
	RecordedAt   time.Time
}

// StateSample represents a single recorded device state field value at a point in time.
type StateSample struct {
	ID           int64
	DeviceID     device.DeviceID
	Field        string
	NumericValue *float64
	TextValue    *string
	RecordedAt   time.Time
}

// StateHistoryQuery parameterises a device state history lookup. Numeric
// measurements are averaged in buckets while stateful values retain the last
// value in each bucket. Fields empty means "every field".
type StateHistoryQuery struct {
	DeviceIDs      []device.DeviceID
	Fields         []string
	StatefulFields []string
	From           time.Time
	To             time.Time
	BucketSeconds  int
	Limit          int
}

// StateHistoryPoint is one point on a device-state time series.
type StateHistoryPoint struct {
	DeviceID     device.DeviceID
	Field        string
	At           time.Time
	NumericValue *float64
	TextValue    *string
}

// Zigbee2MQTTConfig represents the singleton Zigbee2MQTT integration
// configuration: the MQTT broker the zigbee2mqtt bridge publishes to, and the
// opt-in daily topology-scan schedule and provider output rates.
// ScanHour/ScanMinute stay set while the schedule is disabled so re-enabling
// restores the chosen time; nil means never set.
type Zigbee2MQTTConfig struct {
	Broker                       string
	FrontendURL                  *string
	Username                     string
	Password                     string
	UseWSS                       bool
	Enabled                      bool
	ScanScheduleEnabled          bool
	ScanHour                     *int64
	ScanMinute                   *int64
	InteractiveCommandsPerSecond int64
	ContinuousCommandsPerSecond  int64
}

// TuyaConfig represents the singleton Tuya cloud integration configuration.
type TuyaConfig struct {
	AccessID     string
	AccessSecret string
	Region       string
	Enabled      bool
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
	ID                 string
	Username           string
	Name               string
	PasswordHash       string
	MustChangePassword bool
}

// User represents a user row. TokenVersion is bumped on password change,
// password reset, or explicit force-logout — the auth middleware compares it
// against the value embedded in the JWT and refuses mismatched tokens.
type User struct {
	ID                 string
	Username           string
	Name               string
	PasswordHash       string
	AvatarPath         *string
	Theme              string
	TimeFormat         string
	TemperatureUnit    string
	HapticsEnabled     bool
	Language           string
	MustChangePassword bool
	TokenVersion       int64
	CreatedAt          time.Time
}

// UpdateUserProfileParams holds optional fields for updating a user's profile.
// Nil fields leave the corresponding column untouched. AvatarPath cannot clear
// the column to NULL here — use ClearUserAvatar for that.
type UpdateUserProfileParams struct {
	ID              string
	Name            *string
	Theme           *string
	AvatarPath      *string
	TimeFormat      *string
	TemperatureUnit *string
	HapticsEnabled  *bool
	Language        *string
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

	WebhookID   *string
	WebhookName *string
}

// InsertActivityEventParams holds the parameters for inserting an activity event row.
type InsertActivityEventParams struct {
	Type        string
	Timestamp   time.Time
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

	WebhookID   *string
	WebhookName *string
}

// ActivityQuery filters activity events. Zero values leave a filter unset.
// When Advanced is false, internal event types (command.dispatched,
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
	ID               int64
	AlarmID          string
	Severity         AlarmSeverity
	Kind             AlarmKind
	Message          *string
	MessageCode      *string
	MessageArguments string
	Source           string
	RaisedAt         time.Time
}

// InsertAlarmParams holds the fields for inserting a new alarm raise.
type InsertAlarmParams struct {
	AlarmID          string
	Severity         AlarmSeverity
	Kind             AlarmKind
	Message          *string
	MessageCode      *string
	MessageArguments string
	Source           string
	RaisedAt         time.Time
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

// Floorplan is a full floor plan: the plan row plus its wall graph, the gaps
// cut into it, derived room faces, and placements. World units are meters.
type Floorplan struct {
	ID           string
	Name         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Vertices     []FloorplanVertex
	Walls        []FloorplanWall
	Openings     []FloorplanOpening
	DoorBindings []FloorplanDoorBinding
	Rooms        []FloorplanRoom
	Placements   []FloorplanPlacement
	Furniture    []FloorplanFurniture
}

// FloorplanVertex is one endpoint in the centerline wall graph.
type FloorplanVertex struct {
	ID string
	X  float64
	Y  float64
}

// FloorplanWall is one edge in the centerline wall graph, referencing its two
// endpoint vertices. CurveX/CurveY, when both set, are the control point of a
// quadratic bezier; nil means the wall is straight.
type FloorplanWall struct {
	ID        string
	VertexA   string
	VertexB   string
	Thickness float64
	CurveX    *float64
	CurveY    *float64
}

// FloorplanOpeningKind is what a gap in a wall represents.
type FloorplanOpeningKind string

const (
	// FloorplanOpeningDoor is a doorway.
	FloorplanOpeningDoor FloorplanOpeningKind = "door"
	// FloorplanOpeningWindow is a window; daylight enters through these.
	FloorplanOpeningWindow FloorplanOpeningKind = "window"
	// FloorplanOpeningCased is a cased opening with nothing in it.
	FloorplanOpeningCased FloorplanOpeningKind = "opening"
)

// FloorplanOpening is a gap cut out of a wall body. T is the gap's centre in
// the wall's own parameterisation (0 at VertexA, 1 at VertexB); Width is in
// meters, so splitting a wall rescales T while Width carries across untouched.
// Openings leave the centerline graph alone, so the derived faces are the same
// with or without them.
type FloorplanOpening struct {
	ID     string
	WallID string
	T      float64
	Width  float64
	Kind   FloorplanOpeningKind
}

// FloorplanDoorHingeSide identifies which endpoint of an opening carries its hinge.
type FloorplanDoorHingeSide string

const (
	FloorplanDoorHingeStart FloorplanDoorHingeSide = "start"
	FloorplanDoorHingeEnd   FloorplanDoorHingeSide = "end"
)

// FloorplanDoorSwingSide identifies the side of the directed wall into which a door opens.
type FloorplanDoorSwingSide string

const (
	FloorplanDoorSwingLeft  FloorplanDoorSwingSide = "left"
	FloorplanDoorSwingRight FloorplanDoorSwingSide = "right"
)

// FloorplanDoorBinding connects a door opening to its contact sensor and posture.
type FloorplanDoorBinding struct {
	OpeningID string
	DeviceID  device.DeviceID
	HingeSide FloorplanDoorHingeSide
	SwingSide FloorplanDoorSwingSide
}

// FloorplanRoom is a derived face of the wall graph. Name is the user's label
// (nil when anonymous); RoomID links the face to a Hive room (nil when
// unlinked, at most one face per room). VertexIDs holds the face's vertex ids
// in canonical rotation so the face keeps its identity across edits.
type FloorplanRoom struct {
	ID        string
	Name      *string
	RoomID    *string
	VertexIDs []string
}

// FloorplanPlacement pins a target ref — a device or a group — to a point on
// the plan. Each ref appears at most once on the map; membership stays in
// room_members and group_members, this is coordinates only.
type FloorplanPlacement struct {
	MemberType device.TargetType
	MemberID   string
	X          float64
	Y          float64
}

// FloorplanFurniture is a piece standing on the plan: a bed, a sofa, a plain
// box. X/Y is its centre and Width/Height its unrotated footprint in meters,
// Rotation degrees clockwise. Kind names a shape in the client's catalogue.
// An occluder blocks light where it stands.
type FloorplanFurniture struct {
	ID       string
	Kind     string
	X        float64
	Y        float64
	Width    float64
	Height   float64
	Rotation float64
	Occluder bool
}

// ReplaceFloorplanParams bundles the whole plan for a single-transaction
// replace: the plan row is upserted and every child list is swapped.
type ReplaceFloorplanParams struct {
	ID           string
	Name         string
	Vertices     []FloorplanVertex
	Walls        []FloorplanWall
	Openings     []FloorplanOpening
	DoorBindings []FloorplanDoorBinding
	Rooms        []FloorplanRoom
	Placements   []FloorplanPlacement
	Furniture    []FloorplanFurniture
}
