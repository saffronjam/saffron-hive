package graph

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/effect"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type mockStateReader struct {
	mu      sync.RWMutex
	devices []device.Device
	states  map[device.DeviceID]*device.DeviceState
}

func newMockStateReader() *mockStateReader {
	return &mockStateReader{
		states: make(map[device.DeviceID]*device.DeviceState),
	}
}

func (m *mockStateReader) GetDevice(id device.DeviceID) (device.Device, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, d := range m.devices {
		if d.ID == id {
			return d, true
		}
	}
	return device.Device{}, false
}

func (m *mockStateReader) GetDeviceState(id device.DeviceID) (*device.DeviceState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	st, ok := m.states[id]
	return st, ok
}

func (m *mockStateReader) ListDevices() []device.Device {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]device.Device, len(m.devices))
	copy(out, m.devices)
	return out
}

func (m *mockStateReader) GetGroup(_ device.GroupID) (device.Group, bool) {
	return device.Group{}, false
}

func (m *mockStateReader) ListGroups() []device.Group { return nil }

func (m *mockStateReader) ListGroupMembers(_ device.GroupID) []device.GroupMember { return nil }

func (m *mockStateReader) ResolveGroupDevices(_ device.GroupID) []device.DeviceID { return nil }

func (m *mockStateReader) addDevice(d device.Device) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.devices = append(m.devices, d)
}

func (m *mockStateReader) setDeviceState(id device.DeviceID, st *device.DeviceState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.states[id] = st
}

type mockStore struct {
	mu              sync.RWMutex
	scenes          map[string]store.Scene
	sceneActions    map[string][]store.SceneAction
	scenePayloads   map[string][]store.SceneDevicePayload
	automations     map[string]store.Automation
	automationNodes map[string][]store.AutomationNode
	automationEdges map[string][]store.AutomationEdge
	groups          map[string]store.Group
	groupMembers    map[string][]store.GroupMember
	stateSamples    []store.StateHistoryPoint
	activityEvents  []store.ActivityEvent
	activityCounter int64
	users           map[string]store.User // keyed by id
	mqttConfig      *store.MQTTConfig
	effects         map[string]store.Effect
	activeEffects   map[string]effect.ActiveEffectRecord

	createSceneCalled      bool
	deleteSceneCalled      bool
	createAutomationCalled bool
	deleteAutomationCalled bool
	createGroupCalled      bool
	deleteGroupCalled      bool
	toggleCalled           bool
}

func newMockStore() *mockStore {
	return &mockStore{
		scenes:          make(map[string]store.Scene),
		sceneActions:    make(map[string][]store.SceneAction),
		scenePayloads:   make(map[string][]store.SceneDevicePayload),
		automations:     make(map[string]store.Automation),
		automationNodes: make(map[string][]store.AutomationNode),
		automationEdges: make(map[string][]store.AutomationEdge),
		groups:          make(map[string]store.Group),
		groupMembers:    make(map[string][]store.GroupMember),
		users:           make(map[string]store.User),
		effects:         make(map[string]store.Effect),
		activeEffects:   make(map[string]effect.ActiveEffectRecord),
	}
}

func (m *mockStore) GetDevice(_ context.Context, _ device.DeviceID) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) UpdateDevice(_ context.Context, _ store.UpdateDeviceParams) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) CreateScene(_ context.Context, params store.CreateSceneParams) (store.Scene, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createSceneCalled = true
	s := store.Scene{ID: params.ID, Name: params.Name}
	m.scenes[params.ID] = s
	return s, nil
}

func (m *mockStore) GetScene(_ context.Context, id string) (store.Scene, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.scenes[id]
	if !ok {
		return store.Scene{}, fmt.Errorf("scene %q not found", id)
	}
	return s, nil
}

func (m *mockStore) ListScenes(_ context.Context) ([]store.Scene, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Scene
	for _, s := range m.scenes {
		out = append(out, s)
	}
	return out, nil
}

func (m *mockStore) UpdateScene(_ context.Context, id string, params store.UpdateSceneParams) (store.Scene, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	s, ok := m.scenes[id]
	if !ok {
		return store.Scene{}, fmt.Errorf("scene %q not found", id)
	}
	if params.Name != nil {
		s.Name = *params.Name
		m.scenes[id] = s
	}
	return s, nil
}

func (m *mockStore) DeleteScene(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteSceneCalled = true
	delete(m.scenes, id)
	delete(m.sceneActions, id)
	return nil
}

func (m *mockStore) BatchDeleteScenes(_ context.Context, ids []string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for _, id := range ids {
		if _, ok := m.scenes[id]; ok {
			delete(m.scenes, id)
			delete(m.sceneActions, id)
			n++
		}
	}
	return n, nil
}

func (m *mockStore) CreateSceneAction(_ context.Context, params store.CreateSceneActionParams) (store.SceneAction, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	sa := store.SceneAction{
		SceneID:    params.SceneID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
	}
	m.sceneActions[params.SceneID] = append(m.sceneActions[params.SceneID], sa)
	return sa, nil
}

func (m *mockStore) ListSceneActions(_ context.Context, sceneID string) ([]store.SceneAction, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.sceneActions[sceneID], nil
}

func (m *mockStore) ListSceneDevicePayloads(_ context.Context, sceneID string) ([]store.SceneDevicePayload, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.scenePayloads[sceneID], nil
}

func (m *mockStore) SaveSceneContent(_ context.Context, params store.SaveSceneContentParams) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	actions := make([]store.SceneAction, len(params.Targets))
	for i, t := range params.Targets {
		actions[i] = store.SceneAction{
			SceneID:    params.SceneID,
			TargetType: t.TargetType,
			TargetID:   t.TargetID,
		}
	}
	m.sceneActions[params.SceneID] = actions
	m.scenePayloads[params.SceneID] = append([]store.SceneDevicePayload(nil), params.Payloads...)
	return nil
}

func (m *mockStore) CreateAutomation(_ context.Context, params store.CreateAutomationParams) (store.Automation, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createAutomationCalled = true
	a := store.Automation{
		ID:      params.ID,
		Name:    params.Name,
		Enabled: params.Enabled,
	}
	m.automations[params.ID] = a
	return a, nil
}

func (m *mockStore) GetAutomation(_ context.Context, id string) (store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.automations[id]
	if !ok {
		return store.Automation{}, fmt.Errorf("automation %q not found", id)
	}
	return a, nil
}

func (m *mockStore) ListAutomations(_ context.Context) ([]store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Automation
	for _, a := range m.automations {
		out = append(out, a)
	}
	return out, nil
}

func (m *mockStore) ListEnabledAutomations(_ context.Context) ([]store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Automation
	for _, a := range m.automations {
		if a.Enabled {
			out = append(out, a)
		}
	}
	return out, nil
}

func (m *mockStore) UpdateAutomation(_ context.Context, id string, _ store.UpdateAutomationParams) (store.Automation, error) {
	return store.Automation{ID: id}, nil
}

func (m *mockStore) UpdateAutomationEnabled(_ context.Context, id string, enabled bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.toggleCalled = true
	a, ok := m.automations[id]
	if !ok {
		return fmt.Errorf("automation %q not found", id)
	}
	a.Enabled = enabled
	m.automations[id] = a
	return nil
}

func (m *mockStore) DeleteAutomation(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteAutomationCalled = true
	delete(m.automations, id)
	delete(m.automationNodes, id)
	delete(m.automationEdges, id)
	return nil
}

func (m *mockStore) BatchDeleteAutomations(_ context.Context, ids []string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for _, id := range ids {
		if _, ok := m.automations[id]; ok {
			delete(m.automations, id)
			delete(m.automationNodes, id)
			delete(m.automationEdges, id)
			n++
		}
	}
	return n, nil
}

func (m *mockStore) CreateAutomationNode(_ context.Context, params store.CreateAutomationNodeParams) (store.AutomationNode, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	n := store.AutomationNode{
		ID:           params.ID,
		AutomationID: params.AutomationID,
		Type:         params.Type,
		Config:       params.Config,
	}
	m.automationNodes[params.AutomationID] = append(m.automationNodes[params.AutomationID], n)
	return n, nil
}

func (m *mockStore) ListAutomationNodes(_ context.Context, automationID string) ([]store.AutomationNode, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.automationNodes[automationID], nil
}

func (m *mockStore) CreateAutomationEdge(_ context.Context, params store.CreateAutomationEdgeParams) (store.AutomationEdge, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	e := store.AutomationEdge{
		AutomationID: params.AutomationID,
		FromNodeID:   params.FromNodeID,
		ToNodeID:     params.ToNodeID,
	}
	m.automationEdges[params.AutomationID] = append(m.automationEdges[params.AutomationID], e)
	return e, nil
}

func (m *mockStore) ListAutomationEdges(_ context.Context, automationID string) ([]store.AutomationEdge, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.automationEdges[automationID], nil
}

func (m *mockStore) ReplaceAutomationGraph(_ context.Context, automationID string, nodes []store.CreateAutomationNodeParams, edges []store.CreateAutomationEdgeParams) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	replacedNodes := make([]store.AutomationNode, len(nodes))
	for i, n := range nodes {
		replacedNodes[i] = store.AutomationNode{
			ID:           n.ID,
			AutomationID: automationID,
			Type:         n.Type,
			Config:       n.Config,
			PositionX:    n.PositionX,
			PositionY:    n.PositionY,
		}
	}
	replacedEdges := make([]store.AutomationEdge, len(edges))
	for i, e := range edges {
		replacedEdges[i] = store.AutomationEdge{
			AutomationID: automationID,
			FromNodeID:   e.FromNodeID,
			ToNodeID:     e.ToNodeID,
		}
	}
	m.automationNodes[automationID] = replacedNodes
	m.automationEdges[automationID] = replacedEdges
	return nil
}

func (m *mockStore) GetAutomationGraph(_ context.Context, automationID string) (store.AutomationGraph, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	a, ok := m.automations[automationID]
	if !ok {
		return store.AutomationGraph{}, fmt.Errorf("automation %q not found", automationID)
	}
	return store.AutomationGraph{
		Automation: a,
		Nodes:      m.automationNodes[automationID],
		Edges:      m.automationEdges[automationID],
	}, nil
}

func (m *mockStore) CreateGroup(_ context.Context, params store.CreateGroupParams) (store.Group, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.createGroupCalled = true
	g := store.Group{ID: params.ID, Name: params.Name}
	m.groups[params.ID] = g
	return g, nil
}

func (m *mockStore) GetGroup(_ context.Context, id string) (store.Group, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	g, ok := m.groups[id]
	if !ok {
		return store.Group{}, fmt.Errorf("group %q not found", id)
	}
	return g, nil
}

func (m *mockStore) ListGroups(_ context.Context) ([]store.Group, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Group
	for _, g := range m.groups {
		out = append(out, g)
	}
	return out, nil
}

func (m *mockStore) UpdateGroup(_ context.Context, params store.UpdateGroupParams) (store.Group, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	g, ok := m.groups[params.ID]
	if !ok {
		return store.Group{}, fmt.Errorf("group %q not found", params.ID)
	}
	g.Name = params.Name
	m.groups[params.ID] = g
	return g, nil
}

func (m *mockStore) DeleteGroup(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.deleteGroupCalled = true
	delete(m.groups, id)
	delete(m.groupMembers, id)
	return nil
}

func (m *mockStore) BatchDeleteGroups(_ context.Context, ids []string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for _, id := range ids {
		if _, ok := m.groups[id]; ok {
			delete(m.groups, id)
			delete(m.groupMembers, id)
			n++
		}
	}
	return n, nil
}

func (m *mockStore) AddGroupMember(_ context.Context, params store.AddGroupMemberParams) (store.GroupMember, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	gm := store.GroupMember{
		ID:         params.ID,
		GroupID:    params.GroupID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}
	m.groupMembers[params.GroupID] = append(m.groupMembers[params.GroupID], gm)
	return gm, nil
}

func (m *mockStore) BatchAddGroupDevices(_ context.Context, groupID string, deviceIDs []string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	existing := make(map[string]struct{})
	for _, gm := range m.groupMembers[groupID] {
		if gm.MemberType == device.GroupMemberDevice {
			existing[gm.MemberID] = struct{}{}
		}
	}
	var n int64
	for _, did := range deviceIDs {
		if _, ok := existing[did]; ok {
			continue
		}
		m.groupMembers[groupID] = append(m.groupMembers[groupID], store.GroupMember{
			ID:         "mock-" + did,
			GroupID:    groupID,
			MemberType: device.GroupMemberDevice,
			MemberID:   did,
		})
		existing[did] = struct{}{}
		n++
	}
	return n, nil
}

func (m *mockStore) ListGroupMembers(_ context.Context, groupID string) ([]store.GroupMember, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.groupMembers[groupID], nil
}

func (m *mockStore) RemoveGroupMember(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for groupID, members := range m.groupMembers {
		var filtered []store.GroupMember
		for _, gm := range members {
			if gm.ID != id {
				filtered = append(filtered, gm)
			}
		}
		m.groupMembers[groupID] = filtered
	}
	return nil
}

func (m *mockStore) ListGroupsContainingMember(_ context.Context, memberType device.GroupMemberType, memberID string) ([]store.Group, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.Group
	for groupID, members := range m.groupMembers {
		for _, gm := range members {
			if gm.MemberType == memberType && gm.MemberID == memberID {
				if g, ok := m.groups[groupID]; ok {
					out = append(out, g)
				}
				break
			}
		}
	}
	return out, nil
}

func (m *mockStore) QueryStateHistory(_ context.Context, q store.StateHistoryQuery) ([]store.StateHistoryPoint, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	deviceSet := make(map[string]struct{}, len(q.DeviceIDs))
	for _, id := range q.DeviceIDs {
		deviceSet[string(id)] = struct{}{}
	}
	fieldSet := make(map[string]struct{}, len(q.Fields))
	for _, f := range q.Fields {
		fieldSet[f] = struct{}{}
	}
	var out []store.StateHistoryPoint
	for _, p := range m.stateSamples {
		if _, ok := deviceSet[string(p.DeviceID)]; !ok {
			continue
		}
		if len(fieldSet) > 0 {
			if _, ok := fieldSet[p.Field]; !ok {
				continue
			}
		}
		if !q.From.IsZero() && p.At.Before(q.From) {
			continue
		}
		if !q.To.IsZero() && p.At.After(q.To) {
			continue
		}
		out = append(out, p)
		if q.Limit > 0 && len(out) >= q.Limit {
			break
		}
	}
	return out, nil
}

func (m *mockStore) QueryActivityEvents(_ context.Context, q store.ActivityQuery) ([]store.ActivityEvent, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var out []store.ActivityEvent
	for i := len(m.activityEvents) - 1; i >= 0; i-- {
		e := m.activityEvents[i]
		if !q.Advanced && (e.Type == "command.requested" || e.Type == "automation.node_activated") {
			continue
		}
		if len(q.Types) > 0 {
			matched := false
			for _, t := range q.Types {
				if e.Type == t {
					matched = true
					break
				}
			}
			if !matched {
				continue
			}
		}
		if q.DeviceID != nil && (e.DeviceID == nil || *e.DeviceID != *q.DeviceID) {
			continue
		}
		if q.RoomID != nil && (e.RoomID == nil || *e.RoomID != *q.RoomID) {
			continue
		}
		if q.Since != nil && e.Timestamp.Before(*q.Since) {
			continue
		}
		out = append(out, e)
		if q.Limit > 0 && len(out) >= q.Limit {
			break
		}
	}
	return out, nil
}

func (m *mockStore) PruneActivityEventsOlderThan(_ context.Context, cutoff time.Time) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	kept := m.activityEvents[:0]
	var pruned int64
	for _, e := range m.activityEvents {
		if e.Timestamp.Before(cutoff) {
			pruned++
			continue
		}
		kept = append(kept, e)
	}
	m.activityEvents = kept
	return pruned, nil
}

func (m *mockStore) GetMQTTConfig(_ context.Context) (*store.MQTTConfig, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.mqttConfig, nil
}

func (m *mockStore) UpsertMQTTConfig(_ context.Context, _ store.MQTTConfig) error {
	return nil
}

func (m *mockStore) ListSettings(_ context.Context) ([]store.Setting, error) {
	return nil, nil
}

func (m *mockStore) UpsertSetting(_ context.Context, _, _ string) error {
	return nil
}

func (m *mockStore) CreateRoom(_ context.Context, _ store.CreateRoomParams) (store.Room, error) {
	return store.Room{}, nil
}

func (m *mockStore) GetRoom(_ context.Context, _ string) (store.Room, error) {
	return store.Room{}, nil
}

func (m *mockStore) ListRooms(_ context.Context) ([]store.Room, error) {
	return nil, nil
}

func (m *mockStore) UpdateRoom(_ context.Context, _ store.UpdateRoomParams) (store.Room, error) {
	return store.Room{}, nil
}

func (m *mockStore) DeleteRoom(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) BatchDeleteRooms(_ context.Context, _ []string) (int64, error) {
	return 0, nil
}

func (m *mockStore) AddRoomMember(_ context.Context, params store.AddRoomMemberParams) (store.RoomMember, error) {
	return store.RoomMember{
		ID:         params.ID,
		RoomID:     params.RoomID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}, nil
}

func (m *mockStore) BatchAddRoomMembers(_ context.Context, _ string, members []store.RoomMemberInput) (int64, error) {
	return int64(len(members)), nil
}

func (m *mockStore) ListRoomMembers(_ context.Context, _ string) ([]store.RoomMember, error) {
	return nil, nil
}

func (m *mockStore) RemoveRoomMember(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) ListRoomsContainingMember(_ context.Context, _ device.RoomMemberType, _ string) ([]store.Room, error) {
	return nil, nil
}

func (m *mockStore) CreateUser(_ context.Context, params store.CreateUserParams) (store.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, u := range m.users {
		if u.Username == params.Username {
			return store.User{}, fmt.Errorf("username %q already exists", params.Username)
		}
	}
	u := store.User{
		ID:           params.ID,
		Username:     params.Username,
		Name:         params.Name,
		PasswordHash: params.PasswordHash,
	}
	m.users[params.ID] = u
	return u, nil
}

func (m *mockStore) GetUserByUsername(_ context.Context, username string) (store.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, u := range m.users {
		if u.Username == username {
			return u, nil
		}
	}
	return store.User{}, fmt.Errorf("user %q not found", username)
}

func (m *mockStore) ListUsers(_ context.Context) ([]store.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]store.User, 0, len(m.users))
	for _, u := range m.users {
		out = append(out, u)
	}
	return out, nil
}

func (m *mockStore) CountUsers(_ context.Context) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.users), nil
}

func (m *mockStore) GetUserByID(_ context.Context, id string) (store.User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	u, ok := m.users[id]
	if !ok {
		return store.User{}, fmt.Errorf("user %q not found", id)
	}
	return u, nil
}

func (m *mockStore) UpdateUserProfile(_ context.Context, params store.UpdateUserProfileParams) (store.User, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.users[params.ID]
	if !ok {
		return store.User{}, fmt.Errorf("user %q not found", params.ID)
	}
	if params.Name != nil {
		u.Name = *params.Name
	}
	if params.Theme != nil {
		u.Theme = *params.Theme
	}
	if params.AvatarPath != nil {
		u.AvatarPath = params.AvatarPath
	}
	m.users[params.ID] = u
	return u, nil
}

func (m *mockStore) ClearUserAvatar(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.users[id]
	if !ok {
		return fmt.Errorf("user %q not found", id)
	}
	u.AvatarPath = nil
	m.users[id] = u
	return nil
}

func (m *mockStore) UpdateUserPasswordHash(_ context.Context, id, hash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	u, ok := m.users[id]
	if !ok {
		return fmt.Errorf("user %q not found", id)
	}
	u.PasswordHash = hash
	m.users[id] = u
	return nil
}

func (m *mockStore) DeleteUser(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.users[id]; !ok {
		return fmt.Errorf("user %q not found", id)
	}
	delete(m.users, id)
	return nil
}

func (m *mockStore) BatchDeleteUsers(_ context.Context, ids []string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var n int64
	for _, id := range ids {
		if _, ok := m.users[id]; ok {
			delete(m.users, id)
			n++
		}
	}
	return n, nil
}

func (m *mockStore) GetUserAvatarPath(_ context.Context, id string) (*string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	u, ok := m.users[id]
	if !ok {
		return nil, fmt.Errorf("user %q not found", id)
	}
	return u.AvatarPath, nil
}

func (m *mockStore) GetUserAvatarPathsByIDs(_ context.Context, ids []string) (map[string]string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make(map[string]string)
	for _, id := range ids {
		u, ok := m.users[id]
		if !ok {
			continue
		}
		if u.AvatarPath != nil && *u.AvatarPath != "" {
			out[id] = *u.AvatarPath
		}
	}
	return out, nil
}

func (m *mockStore) ResolveTargetDeviceIDs(_ context.Context, _ device.TargetType, targetID string) []device.DeviceID {
	return []device.DeviceID{device.DeviceID(targetID)}
}

func (m *mockStore) CreateEffect(_ context.Context, params store.CreateEffectParams) (store.Effect, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	tracks := make([]store.EffectTrack, len(params.Tracks))
	for i, t := range params.Tracks {
		clips := make([]store.EffectClip, len(t.Clips))
		for j, c := range t.Clips {
			clips[j] = store.EffectClip{
				ID:              c.ID,
				TrackID:         t.ID,
				StartMs:         c.StartMs,
				TransitionMinMs: c.TransitionMinMs,
				TransitionMaxMs: c.TransitionMaxMs,
				Kind:            c.Kind,
				ConfigJSON:      c.ConfigJSON,
			}
		}
		tracks[i] = store.EffectTrack{
			ID:       t.ID,
			EffectID: params.ID,
			Index:    t.Index,
			Clips:    clips,
		}
	}
	now := time.Now()
	e := store.Effect{
		ID:         params.ID,
		Name:       params.Name,
		Icon:       params.Icon,
		Kind:       params.Kind,
		NativeName: params.NativeName,
		Loop:       params.Loop,
		DurationMs: params.DurationMs,
		CreatedAt:  now,
		UpdatedAt:  now,
		Tracks:     tracks,
	}
	m.effects[params.ID] = e
	return e, nil
}

func (m *mockStore) GetEffect(_ context.Context, id string) (store.Effect, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	e, ok := m.effects[id]
	if !ok {
		return store.Effect{}, fmt.Errorf("effect %q not found", id)
	}
	return e, nil
}

func (m *mockStore) ListEffects(_ context.Context) ([]store.Effect, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]store.Effect, 0, len(m.effects))
	for _, e := range m.effects {
		out = append(out, e)
	}
	return out, nil
}

func (m *mockStore) UpdateEffect(_ context.Context, id string, params store.UpdateEffectParams) (store.Effect, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	e, ok := m.effects[id]
	if !ok {
		return store.Effect{}, fmt.Errorf("effect %q not found", id)
	}
	if params.Name != nil {
		e.Name = *params.Name
	}
	if params.SetIcon {
		e.Icon = params.Icon
	}
	if params.Kind != nil {
		e.Kind = *params.Kind
	}
	if params.SetNativeName {
		e.NativeName = params.NativeName
	}
	if params.Loop != nil {
		e.Loop = *params.Loop
	}
	if params.DurationMs != nil {
		e.DurationMs = *params.DurationMs
	}
	e.UpdatedAt = time.Now()
	m.effects[id] = e
	return e, nil
}

func (m *mockStore) DeleteEffect(_ context.Context, id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.effects[id]; !ok {
		return fmt.Errorf("effect %q not found", id)
	}
	delete(m.effects, id)
	for k, ae := range m.activeEffects {
		if ae.EffectID == id {
			delete(m.activeEffects, k)
		}
	}
	return nil
}

func (m *mockStore) SaveEffectTracks(_ context.Context, effectID string, tracks []store.EffectTrackInput) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	e, ok := m.effects[effectID]
	if !ok {
		return fmt.Errorf("effect %q not found", effectID)
	}
	out := make([]store.EffectTrack, len(tracks))
	for i, t := range tracks {
		clips := make([]store.EffectClip, len(t.Clips))
		for j, c := range t.Clips {
			clips[j] = store.EffectClip{
				ID:              c.ID,
				TrackID:         t.ID,
				StartMs:         c.StartMs,
				TransitionMinMs: c.TransitionMinMs,
				TransitionMaxMs: c.TransitionMaxMs,
				Kind:            c.Kind,
				ConfigJSON:      c.ConfigJSON,
			}
		}
		out[i] = store.EffectTrack{
			ID:       t.ID,
			EffectID: effectID,
			Index:    t.Index,
			Clips:    clips,
		}
	}
	e.Tracks = out
	e.UpdatedAt = time.Now()
	m.effects[effectID] = e
	return nil
}

func (m *mockStore) LoadEffect(ctx context.Context, id string) (effect.Effect, error) {
	row, err := m.GetEffect(ctx, id)
	if err != nil {
		return effect.Effect{}, err
	}
	tracks := make([]effect.Track, 0, len(row.Tracks))
	for _, tr := range row.Tracks {
		clips := make([]effect.Clip, 0, len(tr.Clips))
		for _, cl := range tr.Clips {
			cfg, err := effect.UnmarshalClipConfig(cl.Kind, []byte(cl.ConfigJSON))
			if err != nil {
				return effect.Effect{}, err
			}
			clips = append(clips, effect.Clip{
				ID:              cl.ID,
				StartMs:         cl.StartMs,
				TransitionMinMs: cl.TransitionMinMs,
				TransitionMaxMs: cl.TransitionMaxMs,
				Kind:            cl.Kind,
				Config:          cfg,
			})
		}
		tracks = append(tracks, effect.Track{
			ID:    tr.ID,
			Index: tr.Index,
			Clips: clips,
		})
	}
	out := effect.Effect{
		ID:         row.ID,
		Name:       row.Name,
		Kind:       row.Kind,
		Loop:       row.Loop,
		DurationMs: row.DurationMs,
		Tracks:     tracks,
		CreatedAt:  row.CreatedAt,
		UpdatedAt:  row.UpdatedAt,
	}
	if row.Icon != nil {
		out.Icon = *row.Icon
	}
	if row.NativeName != nil {
		out.NativeName = *row.NativeName
	}
	return out, nil
}

func (m *mockStore) ListActiveEffects(_ context.Context) ([]effect.ActiveEffectRecord, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	out := make([]effect.ActiveEffectRecord, 0, len(m.activeEffects))
	for _, ae := range m.activeEffects {
		out = append(out, ae)
	}
	return out, nil
}

func (m *mockStore) upsertActiveEffectRecord(rec effect.ActiveEffectRecord) {
	m.mu.Lock()
	defer m.mu.Unlock()
	for k, ae := range m.activeEffects {
		if ae.TargetType == rec.TargetType && ae.TargetID == rec.TargetID {
			delete(m.activeEffects, k)
		}
	}
	m.activeEffects[rec.ID] = rec
}

type mockReloader struct {
	mu         sync.Mutex
	called     bool
	firedCalls []firedTrigger
	fireErr    error
}

type firedTrigger struct {
	automationID string
	nodeID       string
}

func (m *mockReloader) Reload() error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.called = true
	return nil
}

func (m *mockReloader) wasCalled() bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.called
}

func (m *mockReloader) FireManualTrigger(_ context.Context, automationID, nodeID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.fireErr != nil {
		return m.fireErr
	}
	m.firedCalls = append(m.firedCalls, firedTrigger{automationID: automationID, nodeID: nodeID})
	return nil
}

type mockEffectRunner struct {
	mu               sync.Mutex
	store            *mockStore
	startCalls       []effectStartCall
	startNativeCalls []effectStartNativeCall
	stopCalls        []effect.Target
	runIDSeq         int
	startErr         error
}

type effectStartCall struct {
	effectID string
	target   effect.Target
}

type effectStartNativeCall struct {
	nativeName string
	target     effect.Target
}

func newMockEffectRunner(st *mockStore) *mockEffectRunner {
	return &mockEffectRunner{store: st}
}

func (m *mockEffectRunner) Start(_ context.Context, effectID string, target effect.Target) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.startErr != nil {
		return "", m.startErr
	}
	m.runIDSeq++
	runID := fmt.Sprintf("run-%d", m.runIDSeq)
	m.startCalls = append(m.startCalls, effectStartCall{effectID: effectID, target: target})
	if m.store != nil {
		m.store.upsertActiveEffectRecord(effect.ActiveEffectRecord{
			ID:         runID,
			EffectID:   effectID,
			TargetType: string(target.Type),
			TargetID:   target.ID,
			StartedAt:  time.Now(),
		})
	}
	return runID, nil
}

func (m *mockEffectRunner) StartNative(_ context.Context, nativeName string, target effect.Target) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if m.startErr != nil {
		return "", m.startErr
	}
	m.runIDSeq++
	runID := fmt.Sprintf("run-%d", m.runIDSeq)
	m.startNativeCalls = append(m.startNativeCalls, effectStartNativeCall{nativeName: nativeName, target: target})
	return runID, nil
}

func (m *mockEffectRunner) Stop(target effect.Target) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.stopCalls = append(m.stopCalls, target)
	if m.store != nil {
		m.store.mu.Lock()
		for k, ae := range m.store.activeEffects {
			if ae.TargetType == string(target.Type) && ae.TargetID == target.ID {
				delete(m.store.activeEffects, k)
			}
		}
		m.store.mu.Unlock()
	}
	return true
}
