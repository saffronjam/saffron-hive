package automation

import (
	"context"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

type mockStateReader struct {
	mu       sync.RWMutex
	devices  []device.Device
	lights   map[device.DeviceID]*device.LightState
	sensors  map[device.DeviceID]*device.SensorState
	switches map[device.DeviceID]*device.SwitchState
	groups   map[device.GroupID][]device.DeviceID
}

func newMockStateReader() *mockStateReader {
	return &mockStateReader{
		lights:   make(map[device.DeviceID]*device.LightState),
		sensors:  make(map[device.DeviceID]*device.SensorState),
		switches: make(map[device.DeviceID]*device.SwitchState),
		groups:   make(map[device.GroupID][]device.DeviceID),
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

func (m *mockStateReader) GetLightState(id device.DeviceID) (*device.LightState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	ls, ok := m.lights[id]
	return ls, ok
}

func (m *mockStateReader) GetSensorState(id device.DeviceID) (*device.SensorState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	ss, ok := m.sensors[id]
	return ss, ok
}

func (m *mockStateReader) GetSwitchState(id device.DeviceID) (*device.SwitchState, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sw, ok := m.switches[id]
	return sw, ok
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

func (m *mockStateReader) ResolveGroupDevices(gid device.GroupID) []device.DeviceID {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.groups[gid]
}

func (m *mockStateReader) addDevice(d device.Device) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.devices = append(m.devices, d)
}

func (m *mockStateReader) setLightState(id device.DeviceID, ls *device.LightState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.lights[id] = ls
}

func (m *mockStateReader) setSensorState(id device.DeviceID, ss *device.SensorState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sensors[id] = ss
}

func (m *mockStateReader) setSwitchState(id device.DeviceID, sw *device.SwitchState) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.switches[id] = sw
}

func (m *mockStateReader) setGroupDevices(gid device.GroupID, deviceIDs []device.DeviceID) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.groups[gid] = deviceIDs
}

type mockStore struct {
	mu           sync.RWMutex
	automations  []store.Automation
	nodes        map[string][]store.AutomationNode
	edges        map[string][]store.AutomationEdge
	sceneActions map[string][]store.SceneAction
	sceneErr     map[string]error
	groupMembers map[string][]store.GroupMember
}

func newMockStore() *mockStore {
	return &mockStore{
		nodes:        make(map[string][]store.AutomationNode),
		edges:        make(map[string][]store.AutomationEdge),
		sceneActions: make(map[string][]store.SceneAction),
		sceneErr:     make(map[string]error),
		groupMembers: make(map[string][]store.GroupMember),
	}
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

func (m *mockStore) GetAutomation(_ context.Context, id string) (store.Automation, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, a := range m.automations {
		if a.ID == id {
			return a, nil
		}
	}
	return store.Automation{}, nil
}

func (m *mockStore) GetAutomationGraph(_ context.Context, automationID string) (store.AutomationGraph, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var auto store.Automation
	for _, a := range m.automations {
		if a.ID == automationID {
			auto = a
			break
		}
	}
	return store.AutomationGraph{
		Automation: auto,
		Nodes:      m.nodes[automationID],
		Edges:      m.edges[automationID],
	}, nil
}

func (m *mockStore) ListAutomationNodes(_ context.Context, automationID string) ([]store.AutomationNode, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.nodes[automationID], nil
}

func (m *mockStore) ListAutomationEdges(_ context.Context, automationID string) ([]store.AutomationEdge, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.edges[automationID], nil
}

func (m *mockStore) ListSceneActions(_ context.Context, sceneID string) ([]store.SceneAction, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if err, ok := m.sceneErr[sceneID]; ok {
		return nil, err
	}
	return m.sceneActions[sceneID], nil
}

func (m *mockStore) addAutomationGraph(a store.Automation, nodes []store.AutomationNode, edges []store.AutomationEdge) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.automations = append(m.automations, a)
	m.nodes[a.ID] = nodes
	m.edges[a.ID] = edges
}

func (m *mockStore) removeAutomation(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	var out []store.Automation
	for _, a := range m.automations {
		if a.ID != id {
			out = append(out, a)
		}
	}
	m.automations = out
	delete(m.nodes, id)
	delete(m.edges, id)
}

func (m *mockStore) setSceneActions(sceneID string, actions []store.SceneAction) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sceneActions[sceneID] = actions
}

func (m *mockStore) setSceneError(sceneID string, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sceneErr[sceneID] = err
}

func (m *mockStore) CreateDevice(_ context.Context, _ store.CreateDeviceParams) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) UpsertDevice(_ context.Context, _ store.CreateDeviceParams) error {
	return nil
}

func (m *mockStore) GetDevice(_ context.Context, _ device.DeviceID) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) ListDevices(_ context.Context) ([]device.Device, error) {
	return nil, nil
}

func (m *mockStore) ListDevicesBySource(_ context.Context, _ device.Source) ([]device.Device, error) {
	return nil, nil
}

func (m *mockStore) UpdateDevice(_ context.Context, _ store.UpdateDeviceParams) (device.Device, error) {
	return device.Device{}, nil
}

func (m *mockStore) DeleteDevice(_ context.Context, _ device.DeviceID) error {
	return nil
}

func (m *mockStore) RegisterZigbeeDevice(_ context.Context, _ store.RegisterZigbeeDeviceParams) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) UpsertZigbeeDevice(_ context.Context, _ store.RegisterZigbeeDeviceParams) error {
	return nil
}

func (m *mockStore) GetZigbeeDeviceByIEEEAddress(_ context.Context, _ string) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) GetZigbeeDeviceByFriendlyName(_ context.Context, _ string) (store.ZigbeeDevice, error) {
	return store.ZigbeeDevice{}, nil
}

func (m *mockStore) CreateScene(_ context.Context, _ store.CreateSceneParams) (store.Scene, error) {
	return store.Scene{}, nil
}

func (m *mockStore) GetScene(_ context.Context, _ string) (store.Scene, error) {
	return store.Scene{}, nil
}

func (m *mockStore) ListScenes(_ context.Context) ([]store.Scene, error) {
	return nil, nil
}

func (m *mockStore) UpdateScene(_ context.Context, _ string, _ store.UpdateSceneParams) (store.Scene, error) {
	return store.Scene{}, nil
}

func (m *mockStore) DeleteScene(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) CreateSceneAction(_ context.Context, params store.CreateSceneActionParams) (store.SceneAction, error) {
	return store.SceneAction{
		ID:         params.ID,
		SceneID:    params.SceneID,
		TargetType: params.TargetType,
		TargetID:   params.TargetID,
		Payload:    params.Payload,
	}, nil
}

func (m *mockStore) DeleteSceneAction(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) CreateAutomation(_ context.Context, _ store.CreateAutomationParams) (store.Automation, error) {
	return store.Automation{}, nil
}

func (m *mockStore) ListAutomations(_ context.Context) ([]store.Automation, error) {
	return nil, nil
}

func (m *mockStore) UpdateAutomation(_ context.Context, id string, _ store.UpdateAutomationParams) (store.Automation, error) {
	return store.Automation{ID: id}, nil
}

func (m *mockStore) UpdateAutomationEnabled(_ context.Context, _ string, _ bool) error {
	return nil
}

func (m *mockStore) DeleteAutomation(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) CreateAutomationNode(_ context.Context, _ store.CreateAutomationNodeParams) (store.AutomationNode, error) {
	return store.AutomationNode{}, nil
}

func (m *mockStore) DeleteAutomationNode(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) CreateAutomationEdge(_ context.Context, _ store.CreateAutomationEdgeParams) (store.AutomationEdge, error) {
	return store.AutomationEdge{}, nil
}

func (m *mockStore) DeleteAutomationEdge(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) CreateGroup(_ context.Context, _ store.CreateGroupParams) (store.Group, error) {
	return store.Group{}, nil
}

func (m *mockStore) GetGroup(_ context.Context, _ string) (store.Group, error) {
	return store.Group{}, nil
}

func (m *mockStore) ListGroups(_ context.Context) ([]store.Group, error) {
	return nil, nil
}

func (m *mockStore) UpdateGroup(_ context.Context, _ store.UpdateGroupParams) (store.Group, error) {
	return store.Group{}, nil
}

func (m *mockStore) DeleteGroup(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) AddGroupMember(_ context.Context, _ store.AddGroupMemberParams) (store.GroupMember, error) {
	return store.GroupMember{}, nil
}

func (m *mockStore) ListGroupMembers(_ context.Context, groupID string) ([]store.GroupMember, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.groupMembers[groupID], nil
}

func (m *mockStore) setGroupMembers(groupID string, members []store.GroupMember) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.groupMembers[groupID] = members
}

func (m *mockStore) RemoveGroupMember(_ context.Context, _ string) error {
	return nil
}

func (m *mockStore) ListGroupsContainingMember(_ context.Context, _ device.GroupMemberType, _ string) ([]store.Group, error) {
	return nil, nil
}

func (m *mockStore) InsertSensorReading(_ context.Context, _ store.InsertSensorReadingParams) (store.SensorReading, error) {
	return store.SensorReading{}, nil
}

func (m *mockStore) QuerySensorHistory(_ context.Context, _ store.SensorHistoryQuery) ([]store.SensorReading, error) {
	return nil, nil
}
