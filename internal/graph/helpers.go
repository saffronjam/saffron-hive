package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/alarms"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/scene"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var graphLogger = logging.Named("graph")

// autoBucketSeconds picks a bucket size such that each state-history series
// returns at most ~2k points for the requested span. 0 means "return raw
// samples".
func autoBucketSeconds(span time.Duration) int {
	switch {
	case span <= 6*time.Hour:
		return 0
	case span <= 2*24*time.Hour:
		return 60
	case span <= 14*24*time.Hour:
		return 300
	case span <= 90*24*time.Hour:
		return 3600
	default:
		return 86400
	}
}

// mapAlarm converts a grouped domain Alarm into its GraphQL model.
func mapAlarm(a alarms.Alarm) *model.Alarm {
	return &model.Alarm{
		ID:            a.ID,
		LatestRowID:   strconv.FormatInt(a.LatestRowID, 10),
		Severity:      severityToModel(a.Severity),
		Kind:          kindToModel(a.Kind),
		Message:       a.Message,
		Source:        a.Source,
		Count:         a.Count,
		FirstRaisedAt: a.FirstRaisedAt,
		LastRaisedAt:  a.LastRaisedAt,
	}
}

// mapAlarmEvent converts a live bus Event into its GraphQL model.
func mapAlarmEvent(e alarms.Event) *model.AlarmEvent {
	out := &model.AlarmEvent{}
	switch e.Kind {
	case alarms.EventRaised:
		out.Kind = model.AlarmEventKindRaised
		if e.Alarm != nil {
			out.Alarm = mapAlarm(*e.Alarm)
		}
	case alarms.EventCleared:
		out.Kind = model.AlarmEventKindCleared
		if e.ClearedAlarmID != "" {
			id := e.ClearedAlarmID
			out.ClearedAlarmID = &id
		}
	}
	return out
}

func severityToModel(s store.AlarmSeverity) model.AlarmSeverity {
	switch s {
	case store.AlarmSeverityHigh:
		return model.AlarmSeverityHigh
	case store.AlarmSeverityMedium:
		return model.AlarmSeverityMedium
	case store.AlarmSeverityLow:
		return model.AlarmSeverityLow
	}
	return model.AlarmSeverityLow
}

func severityFromModel(s model.AlarmSeverity) store.AlarmSeverity {
	switch s {
	case model.AlarmSeverityHigh:
		return store.AlarmSeverityHigh
	case model.AlarmSeverityMedium:
		return store.AlarmSeverityMedium
	case model.AlarmSeverityLow:
		return store.AlarmSeverityLow
	}
	return store.AlarmSeverityLow
}

func kindToModel(k store.AlarmKind) model.AlarmKind {
	switch k {
	case store.AlarmKindAuto:
		return model.AlarmKindAuto
	case store.AlarmKindOneShot:
		return model.AlarmKindOneShot
	}
	return model.AlarmKindAuto
}

func kindFromModel(k model.AlarmKind) store.AlarmKind {
	switch k {
	case model.AlarmKindAuto:
		return store.AlarmKindAuto
	case model.AlarmKindOneShot:
		return store.AlarmKindOneShot
	}
	return store.AlarmKindAuto
}

// mapActivityEvent converts a persisted activity row into the GraphQL type.
// The source discriminator is chosen by which denormalised columns are set on
// the row: scene/automation/device take priority in that order; falling back
// to "system" when none are set.
func mapActivityEvent(row store.ActivityEvent) *model.ActivityEvent {
	return &model.ActivityEvent{
		ID:        strconv.FormatInt(row.ID, 10),
		Type:      row.Type,
		Timestamp: row.Timestamp,
		Message:   row.Message,
		Payload:   row.PayloadJSON,
		Source:    mapActivitySource(row),
	}
}

func mapActivitySource(row store.ActivityEvent) *model.ActivitySource {
	switch {
	case row.SceneID != nil:
		return &model.ActivitySource{
			Kind: "scene",
			ID:   row.SceneID,
			Name: row.SceneName,
		}
	case row.AutomationID != nil:
		return &model.ActivitySource{
			Kind: "automation",
			ID:   row.AutomationID,
			Name: row.AutomationName,
		}
	case row.DeviceID != nil:
		return &model.ActivitySource{
			Kind:     "device",
			ID:       row.DeviceID,
			Name:     row.DeviceName,
			Type:     row.DeviceType,
			RoomID:   row.RoomID,
			RoomName: row.RoomName,
		}
	default:
		return &model.ActivitySource{Kind: "system"}
	}
}

func createUserRow(ctx context.Context, s GraphStore, username, name, password string) (store.User, error) {
	username = strings.TrimSpace(username)
	name = strings.TrimSpace(name)
	if username == "" {
		return store.User{}, fmt.Errorf("username is required")
	}
	if name == "" {
		return store.User{}, fmt.Errorf("name is required")
	}
	if err := validatePassword(password); err != nil {
		return store.User{}, err
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return store.User{}, err
	}
	u, err := s.CreateUser(ctx, store.CreateUserParams{
		ID:           uuid.New().String(),
		Username:     username,
		Name:         name,
		PasswordHash: hash,
	})
	if err != nil {
		return store.User{}, fmt.Errorf("create user: %w", err)
	}
	return u, nil
}

func signAuthPayload(svc *auth.Service, u store.User) (*model.AuthPayload, error) {
	token, err := svc.Sign(u.ID, u.Username, u.Name)
	if err != nil {
		return nil, fmt.Errorf("sign token: %w", err)
	}
	return &model.AuthPayload{
		Token: token,
		User:  mapUser(u),
	}, nil
}

// publishRoomMembershipChanged signals downstream caches (the activity
// recorder's RoomCache) that they should re-read room membership.
func (r *Resolver) publishRoomMembershipChanged() {
	if r.EventBus == nil {
		return
	}
	r.EventBus.Publish(eventbus.Event{
		Type:      eventbus.EventRoomMembershipChanged,
		Timestamp: time.Now(),
	})
}

// publishGroupMembershipChanged signals downstream caches that group
// membership shifted. The room cache subscribes because group reshuffles can
// move devices in and out of a room transitively.
func (r *Resolver) publishGroupMembershipChanged() {
	if r.EventBus == nil {
		return
	}
	r.EventBus.Publish(eventbus.Event{
		Type:      eventbus.EventGroupMembershipChanged,
		Timestamp: time.Now(),
	})
}

func currentUserID(ctx context.Context) *string {
	u, ok := auth.UserFromContext(ctx)
	if !ok {
		return nil
	}
	id := u.ID
	return &id
}

func mapDeviceFromReader(sr device.StateReader, d device.Device) *model.Device {
	md := &model.Device{
		ID:           string(d.ID),
		Name:         d.Name,
		Source:       string(d.Source),
		Type:         string(d.Type),
		Capabilities: mapCapabilities(d.Capabilities),
		Available:    d.Available,
		LastSeen:     &d.LastSeen,
	}
	md.State = resolveDeviceStateFromReader(sr, d.ID)
	return md
}

func mapCapabilities(caps []device.Capability) []*model.Capability {
	if caps == nil {
		return []*model.Capability{}
	}
	result := make([]*model.Capability, len(caps))
	for i, c := range caps {
		var unit *string
		if c.Unit != "" {
			unit = &c.Unit
		}
		result[i] = &model.Capability{
			Name:     c.Name,
			Type:     c.Type,
			Values:   c.Values,
			ValueMin: c.ValueMin,
			ValueMax: c.ValueMax,
			Unit:     unit,
			Access:   c.Access,
		}
	}
	return result
}

// resolveDeviceStateFromReader copies a device.DeviceState into its GraphQL
// model. Returns nil for unknown devices; optional fields pass through as nil
// when the device has not reported them.
func resolveDeviceStateFromReader(sr device.StateReader, id device.DeviceID) *model.DeviceState {
	ds, ok := sr.GetDeviceState(id)
	if !ok || ds == nil {
		return nil
	}
	out := &model.DeviceState{
		On:          ds.On,
		Brightness:  ds.Brightness,
		ColorTemp:   ds.ColorTemp,
		Transition:  ds.Transition,
		Temperature: ds.Temperature,
		Humidity:    ds.Humidity,
		Pressure:    ds.Pressure,
		Illuminance: ds.Illuminance,
		Battery:     ds.Battery,
		Power:       ds.Power,
		Voltage:     ds.Voltage,
		Current:     ds.Current,
		Energy:      ds.Energy,
	}
	if ds.Color != nil {
		out.Color = &model.Color{
			R: ds.Color.R,
			G: ds.Color.G,
			B: ds.Color.B,
			X: ds.Color.X,
			Y: ds.Color.Y,
		}
	}
	return out
}

func mapScene(ctx context.Context, sr device.StateReader, tr device.TargetResolver, s GraphStore, sc store.Scene, actions []store.SceneAction, payloads []store.SceneDevicePayload) *model.Scene {
	ms := &model.Scene{
		ID:          sc.ID,
		Name:        sc.Name,
		Icon:        sc.Icon,
		CreatedBy:   mapUserRef(sc.CreatedBy),
		ActivatedAt: sc.ActivatedAt,
	}
	ms.Actions = make([]*model.SceneAction, len(actions))
	for i, a := range actions {
		ms.Actions[i] = &model.SceneAction{
			TargetType: a.TargetType,
			TargetID:   a.TargetID,
			Target:     resolveSceneTarget(ctx, sr, s, a.TargetType, a.TargetID),
		}
	}
	ms.DevicePayloads = make([]*model.SceneDevicePayload, len(payloads))
	for i, p := range payloads {
		ms.DevicePayloads[i] = &model.SceneDevicePayload{
			DeviceID: string(p.DeviceID),
			Payload:  p.Payload,
		}
	}
	effective := resolveEffectiveScenePayloads(ctx, sr, tr, actions, payloads)
	ms.EffectivePayloads = make([]*model.SceneDevicePayload, len(effective))
	for i, p := range effective {
		ms.EffectivePayloads[i] = &model.SceneDevicePayload{
			DeviceID: string(p.DeviceID),
			Payload:  p.Payload,
		}
	}
	return ms
}

// resolveEffectiveScenePayloads returns one entry per unique device reached by
// the scene's action targets (rooms, groups, or direct devices). Devices with
// an explicit per-device override carry that payload; other devices get the
// capability-filtered warm-white default serialised as the same JSON shape.
func resolveEffectiveScenePayloads(
	ctx context.Context,
	sr device.StateReader,
	tr device.TargetResolver,
	actions []store.SceneAction,
	payloads []store.SceneDevicePayload,
) []store.SceneDevicePayload {
	payloadByDevice := make(map[device.DeviceID]string, len(payloads))
	for _, p := range payloads {
		payloadByDevice[p.DeviceID] = p.Payload
	}
	seen := make(map[device.DeviceID]struct{})
	var out []store.SceneDevicePayload
	for _, a := range actions {
		for _, did := range tr.ResolveTargetDeviceIDs(ctx, device.TargetType(a.TargetType), a.TargetID) {
			if _, ok := seen[did]; ok {
				continue
			}
			seen[did] = struct{}{}
			if raw, ok := payloadByDevice[did]; ok {
				out = append(out, store.SceneDevicePayload{DeviceID: did, Payload: raw})
				continue
			}
			cmd := scene.DefaultScenePayload(sr, did)
			raw, err := store.MarshalCommand(cmd)
			if err != nil {
				continue
			}
			out = append(out, store.SceneDevicePayload{DeviceID: did, Payload: raw})
		}
	}
	return out
}

// mapUserRef converts a store.UserRef into the GraphQL User type. Returns nil
// when the creator is unknown (unmigrated row or user deleted).
func mapUserRef(ref *store.UserRef) *model.User {
	if ref == nil {
		return nil
	}
	return &model.User{
		ID:       ref.ID,
		Username: ref.Username,
		Name:     ref.Name,
	}
}

// mapUser converts a full store.User into the public GraphQL User type. The
// password hash is intentionally not exposed. Theme and CreatedAt are returned
// as pointers because the GraphQL User type is also used for attribution
// references (e.g. scene.createdBy) which only populate id/username/name.
func mapUser(u store.User) *model.User {
	theme := themeFromStore(u.Theme)
	createdAt := u.CreatedAt
	return &model.User{
		ID:         u.ID,
		Username:   u.Username,
		Name:       u.Name,
		AvatarPath: u.AvatarPath,
		Theme:      &theme,
		CreatedAt:  &createdAt,
	}
}

// themeFromStore converts the DB's lowercase string representation into the
// GraphQL enum. Unknown values fall back to dark to match the column default.
func themeFromStore(s string) model.Theme {
	switch s {
	case "light":
		return model.ThemeLight
	case "dark":
		return model.ThemeDark
	default:
		return model.ThemeDark
	}
}

// themeToStore converts the GraphQL enum into the DB's lowercase string form.
func themeToStore(t model.Theme) string {
	switch t {
	case model.ThemeLight:
		return "light"
	case model.ThemeDark:
		return "dark"
	default:
		return "dark"
	}
}

// validatePassword enforces the minimum-length rule shared by every path that
// accepts a new password (createUser, changePassword, resetUserPassword).
func validatePassword(pw string) error {
	if len(pw) < 6 {
		return fmt.Errorf("password must be at least 6 characters")
	}
	return nil
}

func resolveSceneTarget(ctx context.Context, sr device.StateReader, s GraphStore, targetType string, targetID string) model.SceneTarget {
	switch targetType {
	case string(device.TargetGroup):
		g, err := s.GetGroup(ctx, targetID)
		if err != nil {
			return nil
		}
		members, err := s.ListGroupMembers(ctx, targetID)
		if err != nil {
			return nil
		}
		return mapGroupToSceneTarget(ctx, sr, s, g, members)
	case string(device.TargetRoom):
		r, err := s.GetRoom(ctx, targetID)
		if err != nil {
			return nil
		}
		return mapRoom(ctx, sr, s, r)
	default:
		d, ok := sr.GetDevice(device.DeviceID(targetID))
		if !ok {
			return nil
		}
		return mapDeviceFromReader(sr, d)
	}
}

func mapGroupToSceneTarget(ctx context.Context, sr device.StateReader, s GraphStore, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:        g.ID,
		Name:      g.Name,
		Icon:      g.Icon,
		CreatedBy: mapUserRef(g.CreatedBy),
	}
	mg.Members = make([]*model.GroupMember, len(members))
	for i, m := range members {
		gm := &model.GroupMember{
			MemberType: string(m.MemberType),
			MemberID:   m.MemberID,
		}
		if m.MemberType == device.GroupMemberDevice {
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				gm.Device = mapDeviceFromReader(sr, d)
			}
		}
		mg.Members[i] = gm
	}
	seen := make(map[string]bool)
	mg.ResolvedDevices = collectDevicesFromGroupMembers(ctx, sr, s, members, seen)
	return mg
}

func mapAutomationGraph(g store.AutomationGraph) *model.AutomationGraph {
	mg := &model.AutomationGraph{
		ID:          g.Automation.ID,
		Name:        g.Automation.Name,
		Icon:        g.Automation.Icon,
		Enabled:     g.Automation.Enabled,
		LastFiredAt: g.Automation.LastFiredAt,
		CreatedBy:   mapUserRef(g.Automation.CreatedBy),
	}
	mg.Nodes = make([]*model.AutomationNode, len(g.Nodes))
	for i, n := range g.Nodes {
		mg.Nodes[i] = &model.AutomationNode{
			ID:        n.ID,
			Type:      n.Type,
			Config:    n.Config,
			PositionX: n.PositionX,
			PositionY: n.PositionY,
		}
	}
	mg.Edges = make([]*model.AutomationEdge, len(g.Edges))
	for i, e := range g.Edges {
		mg.Edges[i] = &model.AutomationEdge{
			FromNodeID: e.FromNodeID,
			ToNodeID:   e.ToNodeID,
		}
	}
	return mg
}

func mapGroup(ctx context.Context, sr device.StateReader, s GraphStore, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:        g.ID,
		Name:      g.Name,
		Icon:      g.Icon,
		CreatedBy: mapUserRef(g.CreatedBy),
	}

	mg.Members = make([]*model.GroupMember, len(members))
	for i, m := range members {
		mg.Members[i] = mapGroupMember(ctx, sr, s, m)
	}

	seen := make(map[string]bool)
	mg.ResolvedDevices = collectDevicesFromGroupMembers(ctx, sr, s, members, seen)

	return mg
}

// collectDevicesFromGroupMembers walks the given group members and returns the
// flat list of devices reachable from them, recursing through nested groups and
// rooms. The shared `seen` map is keyed by composite "kind:id" strings so a
// single map covers both group and room cycle prevention.
func collectDevicesFromGroupMembers(ctx context.Context, sr device.StateReader, s GraphStore, members []store.GroupMember, seen map[string]bool) []*model.Device {
	var result []*model.Device
	for _, m := range members {
		switch m.MemberType {
		case device.GroupMemberDevice:
			key := "device:" + m.MemberID
			if seen[key] {
				continue
			}
			seen[key] = true
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				result = append(result, mapDeviceFromReader(sr, d))
			}
		case device.GroupMemberGroup:
			key := "group:" + m.MemberID
			if seen[key] {
				continue
			}
			seen[key] = true
			subMembers, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				result = append(result, collectDevicesFromGroupMembers(ctx, sr, s, subMembers, seen)...)
			}
		case device.GroupMemberRoom:
			key := "room:" + m.MemberID
			if seen[key] {
				continue
			}
			seen[key] = true
			roomMembers, err := s.ListRoomMembers(ctx, m.MemberID)
			if err == nil {
				result = append(result, collectDevicesFromRoomMembers(ctx, sr, s, roomMembers, seen)...)
			}
		}
	}
	return result
}

func collectDevicesFromRoomMembers(ctx context.Context, sr device.StateReader, s GraphStore, members []store.RoomMember, seen map[string]bool) []*model.Device {
	var result []*model.Device
	for _, m := range members {
		switch m.MemberType {
		case device.RoomMemberDevice:
			key := "device:" + m.MemberID
			if seen[key] {
				continue
			}
			seen[key] = true
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				result = append(result, mapDeviceFromReader(sr, d))
			}
		case device.RoomMemberGroup:
			key := "group:" + m.MemberID
			if seen[key] {
				continue
			}
			seen[key] = true
			subMembers, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				result = append(result, collectDevicesFromGroupMembers(ctx, sr, s, subMembers, seen)...)
			}
		}
	}
	return result
}

func mapGroupMember(ctx context.Context, sr device.StateReader, s GraphStore, m store.GroupMember) *model.GroupMember {
	gm := &model.GroupMember{
		ID:         m.ID,
		MemberType: string(m.MemberType),
		MemberID:   m.MemberID,
	}
	switch m.MemberType {
	case device.GroupMemberDevice:
		d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
		if ok {
			gm.Device = mapDeviceFromReader(sr, d)
		}
	case device.GroupMemberGroup:
		g, err := s.GetGroup(ctx, m.MemberID)
		if err == nil {
			members, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				gm.Group = mapGroup(ctx, sr, s, g, members)
			}
		}
	case device.GroupMemberRoom:
		r, err := s.GetRoom(ctx, m.MemberID)
		if err == nil {
			gm.Room = mapRoom(ctx, sr, s, r)
		}
	}
	return gm
}

func resolveSceneActionTargetDevices(ctx context.Context, tr device.TargetResolver, targetType string, targetID string) []device.DeviceID {
	return tr.ResolveTargetDeviceIDs(ctx, device.TargetType(targetType), targetID)
}

func toSceneTargetRefs(actions []*model.SceneActionInput) []store.SceneTargetRef {
	out := make([]store.SceneTargetRef, len(actions))
	for i, a := range actions {
		out[i] = store.SceneTargetRef{TargetType: a.TargetType, TargetID: a.TargetID}
	}
	return out
}

func toSceneDevicePayloads(sceneID string, inputs []*model.SceneDevicePayloadInput) []store.SceneDevicePayload {
	out := make([]store.SceneDevicePayload, len(inputs))
	for i, p := range inputs {
		out[i] = store.SceneDevicePayload{
			SceneID:  sceneID,
			DeviceID: device.DeviceID(p.DeviceID),
			Payload:  p.Payload,
		}
	}
	return out
}

func loadAndMapScene(ctx context.Context, r *mutationResolver, id string) (*model.Scene, error) {
	s, err := r.Store.GetScene(ctx, id)
	if err != nil {
		return nil, err
	}
	actions, err := r.Store.ListSceneActions(ctx, id)
	if err != nil {
		return nil, err
	}
	payloads, err := r.Store.ListSceneDevicePayloads(ctx, id)
	if err != nil {
		return nil, err
	}
	return mapScene(ctx, r.StateReader, r.TargetResolver, r.Store, s, actions, payloads), nil
}

// entityRef identifies a container in the membership graph for cycle detection.
// kind is "group" or "room"; devices are leaves and never appear here.
type entityRef struct {
	kind string
	id   string
}

// checkCircularDependency reports an error when adding `child` as a member of
// `parent` would form a cycle. Walks the descendants of `child` (through both
// group and room membership edges) to see whether `parent` is reachable.
//
// `parent` and `child` are both container kinds (group or room). Adding a
// device to anything is always safe and should not call this function.
func (r *mutationResolver) checkCircularDependency(ctx context.Context, parent, child entityRef) error {
	if parent == child {
		return device.ErrCircularDependency
	}
	return r.walkDescendants(ctx, child, parent, map[entityRef]struct{}{})
}

func (r *mutationResolver) walkDescendants(ctx context.Context, current, target entityRef, visited map[entityRef]struct{}) error {
	if _, ok := visited[current]; ok {
		return nil
	}
	visited[current] = struct{}{}

	switch current.kind {
	case "group":
		members, err := r.Store.ListGroupMembers(ctx, current.id)
		if err != nil {
			return err
		}
		for _, m := range members {
			var next entityRef
			switch m.MemberType {
			case device.GroupMemberGroup:
				next = entityRef{kind: "group", id: m.MemberID}
			case device.GroupMemberRoom:
				next = entityRef{kind: "room", id: m.MemberID}
			default:
				continue
			}
			if next == target {
				return device.ErrCircularDependency
			}
			if err := r.walkDescendants(ctx, next, target, visited); err != nil {
				return err
			}
		}
	case "room":
		members, err := r.Store.ListRoomMembers(ctx, current.id)
		if err != nil {
			return err
		}
		for _, m := range members {
			if m.MemberType != device.RoomMemberGroup {
				continue
			}
			next := entityRef{kind: "group", id: m.MemberID}
			if next == target {
				return device.ErrCircularDependency
			}
			if err := r.walkDescendants(ctx, next, target, visited); err != nil {
				return err
			}
		}
	}
	return nil
}

func mapRoom(ctx context.Context, sr device.StateReader, s GraphStore, r store.Room) *model.Room {
	mr := &model.Room{
		ID:        r.ID,
		Name:      r.Name,
		Icon:      r.Icon,
		CreatedBy: mapUserRef(r.CreatedBy),
	}
	members, err := s.ListRoomMembers(ctx, r.ID)
	if err != nil {
		mr.Members = []*model.RoomMember{}
		mr.ResolvedDevices = []*model.Device{}
		return mr
	}
	mr.Members = make([]*model.RoomMember, len(members))
	for i, m := range members {
		mr.Members[i] = mapRoomMember(ctx, sr, s, m)
	}
	seen := make(map[string]bool)
	mr.ResolvedDevices = collectDevicesFromRoomMembers(ctx, sr, s, members, seen)
	return mr
}

func mapRoomMember(ctx context.Context, sr device.StateReader, s GraphStore, m store.RoomMember) *model.RoomMember {
	rm := &model.RoomMember{
		ID:         m.ID,
		MemberType: string(m.MemberType),
		MemberID:   m.MemberID,
	}
	switch m.MemberType {
	case device.RoomMemberDevice:
		d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
		if ok {
			rm.Device = mapDeviceFromReader(sr, d)
		}
	case device.RoomMemberGroup:
		g, err := s.GetGroup(ctx, m.MemberID)
		if err == nil {
			members, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				rm.Group = mapGroup(ctx, sr, s, g, members)
			}
		}
	}
	return rm
}

func mapLogEntry(e logging.Entry) *model.LogEntry {
	attrsJSON, _ := json.Marshal(e.Attrs)
	return &model.LogEntry{
		Timestamp: e.Timestamp,
		Level:     e.Level.String(),
		Message:   e.Message,
		Attrs:     string(attrsJSON),
	}
}

func containsFold(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

func attrsContainFold(attrs map[string]string, substr string) bool {
	lower := strings.ToLower(substr)
	for k, v := range attrs {
		if strings.Contains(strings.ToLower(k), lower) || strings.Contains(strings.ToLower(v), lower) {
			return true
		}
	}
	return false
}

// validateAutomationInput validates automation node/edge inputs before persisting.
// Returns a user-friendly error if the graph has structural issues (no triggers,
// invalid cron expressions, cycles, etc.).
func validateAutomationInput(ctx context.Context, store GraphStore, inputNodes []*model.AutomationNodeInput, inputEdges []*model.AutomationEdgeInput) error {
	domainNodes := make([]automation.Node, 0, len(inputNodes))
	for _, n := range inputNodes {
		domainNodes = append(domainNodes, automation.Node{
			ID:     automation.NodeID(n.ID),
			Type:   automation.NodeType(n.Type),
			Config: parseAutomationNodeConfigForValidation(automation.NodeType(n.Type), n.Config),
		})
	}
	domainEdges := make([]automation.Edge, 0, len(inputEdges))
	for _, e := range inputEdges {
		domainEdges = append(domainEdges, automation.Edge{
			FromNodeID: automation.NodeID(e.FromNodeID),
			ToNodeID:   automation.NodeID(e.ToNodeID),
		})
	}

	result := automation.ValidateGraph(automation.AutomationGraph{
		Nodes: domainNodes,
		Edges: domainEdges,
	})
	if result.Valid() {
		if err := validateAlarmActionPayloads(inputNodes); err != nil {
			return err
		}
		if err := validateRunEffectActions(ctx, store, inputNodes); err != nil {
			return err
		}
		return nil
	}

	msgs := make([]string, 0, len(result.Errors))
	for _, err := range result.Errors {
		msgs = append(msgs, err.Error())
	}
	return fmt.Errorf("automation validation failed: %s", strings.Join(msgs, "; "))
}

// validateRunEffectActions checks every run_effect action node: the payload
// must parse and supply exactly one of effect_id (referring to a stored
// effect) or native_name (referring to an auto-discovered native effect);
// the node's target_type must be one of device/group/room and target_id must
// be non-empty. Capability coverage is intentionally not enforced here — the
// runner logs at debug when a step is dropped per device, so a partial cap
// match is a soft warning rather than a hard rejection.
func validateRunEffectActions(ctx context.Context, store GraphStore, nodes []*model.AutomationNodeInput) error {
	for _, n := range nodes {
		if automation.NodeType(n.Type) != automation.NodeAction {
			continue
		}
		var outer struct {
			ActionType string `json:"action_type"`
			TargetType string `json:"target_type"`
			TargetID   string `json:"target_id"`
			Payload    string `json:"payload"`
		}
		if err := json.Unmarshal([]byte(n.Config), &outer); err != nil {
			continue
		}
		if outer.ActionType != automation.ActionRunEffect {
			continue
		}
		var p struct {
			EffectID   string `json:"effect_id"`
			NativeName string `json:"native_name"`
		}
		if err := json.Unmarshal([]byte(outer.Payload), &p); err != nil {
			return fmt.Errorf("node %s: invalid run_effect payload JSON", n.ID)
		}
		hasEffect := p.EffectID != ""
		hasNative := p.NativeName != ""
		if !hasEffect && !hasNative {
			return fmt.Errorf("node %s: run_effect requires effect_id or native_name", n.ID)
		}
		if hasEffect && hasNative {
			return fmt.Errorf("node %s: run_effect must set exactly one of effect_id or native_name", n.ID)
		}
		switch automation.TargetType(outer.TargetType) {
		case automation.TargetDevice, automation.TargetGroup, automation.TargetRoom:
		default:
			return fmt.Errorf("node %s: run_effect target_type must be device, group, or room (got %q)", n.ID, outer.TargetType)
		}
		if outer.TargetID == "" {
			return fmt.Errorf("node %s: run_effect requires target_id", n.ID)
		}
		if hasEffect {
			if _, err := store.GetEffect(ctx, p.EffectID); err != nil {
				return fmt.Errorf("node %s: run_effect effect_id %q not found", n.ID, p.EffectID)
			}
		}
	}
	return nil
}

// validateAlarmActionPayloads type-checks the alarm-specific fields carried
// inside action-node payloads. The outer automation.ValidateGraph treats
// action payloads as opaque so this lives here.
func validateAlarmActionPayloads(nodes []*model.AutomationNodeInput) error {
	for _, n := range nodes {
		if automation.NodeType(n.Type) != automation.NodeAction {
			continue
		}
		var outer struct {
			ActionType string `json:"action_type"`
			Payload    string `json:"payload"`
		}
		if err := json.Unmarshal([]byte(n.Config), &outer); err != nil {
			continue
		}
		switch outer.ActionType {
		case automation.ActionRaiseAlarm:
			var p struct {
				AlarmID  string `json:"alarm_id"`
				Severity string `json:"severity"`
				Kind     string `json:"kind"`
				Message  string `json:"message"`
			}
			if err := json.Unmarshal([]byte(outer.Payload), &p); err != nil {
				return fmt.Errorf("node %s: invalid raise_alarm payload JSON", n.ID)
			}
			if p.AlarmID == "" {
				return fmt.Errorf("node %s: raise_alarm requires alarm_id", n.ID)
			}
			if p.Severity != "high" && p.Severity != "medium" && p.Severity != "low" {
				return fmt.Errorf("node %s: raise_alarm severity must be high, medium, or low", n.ID)
			}
			if p.Kind != "auto" && p.Kind != "one_shot" {
				return fmt.Errorf("node %s: raise_alarm kind must be auto or one_shot", n.ID)
			}
			if p.Message == "" {
				return fmt.Errorf("node %s: raise_alarm requires message", n.ID)
			}
		case automation.ActionClearAlarm:
			var p struct {
				AlarmID string `json:"alarm_id"`
			}
			if err := json.Unmarshal([]byte(outer.Payload), &p); err != nil {
				return fmt.Errorf("node %s: invalid clear_alarm payload JSON", n.ID)
			}
			if p.AlarmID == "" {
				return fmt.Errorf("node %s: clear_alarm requires alarm_id", n.ID)
			}
		}
	}
	return nil
}

func parseAutomationNodeConfigForValidation(nodeType automation.NodeType, configJSON string) automation.NodeConfig {
	switch nodeType {
	case automation.NodeTrigger:
		var raw struct {
			Kind       string `json:"kind"`
			EventType  string `json:"event_type"`
			FilterExpr string `json:"filter_expr"`
			CronExpr   string `json:"cron_expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.TriggerConfig{}
		}
		kind := automation.TriggerKind(raw.Kind)
		if kind == "" {
			if raw.CronExpr != "" {
				kind = automation.TriggerSchedule
			} else {
				kind = automation.TriggerEvent
			}
		}
		return automation.TriggerConfig{
			Kind:       kind,
			EventType:  raw.EventType,
			FilterExpr: raw.FilterExpr,
			CronExpr:   raw.CronExpr,
		}
	case automation.NodeCondition:
		var raw struct {
			Expr string `json:"expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.ConditionConfig{}
		}
		return automation.ConditionConfig{Expr: raw.Expr}
	case automation.NodeOperator:
		var raw struct {
			Kind string `json:"kind"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.OperatorConfig{}
		}
		return automation.OperatorConfig{Kind: automation.OperatorKind(raw.Kind)}
	case automation.NodeAction:
		var raw struct {
			ActionType string `json:"action_type"`
			TargetType string `json:"target_type"`
			TargetID   string `json:"target_id"`
			Payload    string `json:"payload"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.ActionConfig{}
		}
		return automation.ActionConfig{
			ActionType: raw.ActionType,
			TargetType: automation.TargetType(raw.TargetType),
			TargetID:   raw.TargetID,
			Payload:    raw.Payload,
		}
	default:
		return nil
	}
}
