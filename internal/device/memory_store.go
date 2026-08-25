package device

import (
	"fmt"
	"sync"
	"time"
)

// MemoryStore is an in-memory implementation of StateStore.
// It is safe for concurrent use.
type MemoryStore struct {
	mu            sync.RWMutex
	devices       map[DeviceID]Device
	states        map[DeviceID]DeviceState
	configuration map[DeviceID]map[string]ConfigurationValue
	groups        map[GroupID]Group
	members       map[GroupID][]GroupMember
}

// NewMemoryStore creates a new empty MemoryStore.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		devices:       make(map[DeviceID]Device),
		states:        make(map[DeviceID]DeviceState),
		configuration: make(map[DeviceID]map[string]ConfigurationValue),
		groups:        make(map[GroupID]Group),
		members:       make(map[GroupID][]GroupMember),
	}
}

// GetDeviceConfiguration returns the confirmed settings reported for a device.
func (s *MemoryStore) GetDeviceConfiguration(id DeviceID) []ConfigurationValue {
	s.mu.RLock()
	defer s.mu.RUnlock()
	values := s.configuration[id]
	out := make([]ConfigurationValue, 0, len(values))
	for _, value := range values {
		out = append(out, value)
	}
	return SortConfigurationValues(out)
}

// UpdateDeviceConfiguration merges a partial confirmed-settings update.
func (s *MemoryStore) UpdateDeviceConfiguration(id DeviceID, values []ConfigurationValue) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[id]; !ok {
		return
	}
	current := s.configuration[id]
	if current == nil {
		current = make(map[string]ConfigurationValue)
		s.configuration[id] = current
	}
	for _, value := range values {
		current[value.Capability] = value
	}
}

// GetDevice returns a device by ID and whether it was found.
func (s *MemoryStore) GetDevice(id DeviceID) (Device, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[id]
	return d, ok
}

// GetDeviceState returns the current state for a device and true when the
// device is registered. Returns (nil, false) for unknown devices. A
// zero-value state is returned for registered devices that have not yet
// reported anything — callers distinguish "no data" by checking each pointer
// field for nil.
func (s *MemoryStore) GetDeviceState(id DeviceID) (*DeviceState, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if _, ok := s.devices[id]; !ok {
		return nil, false
	}
	st, ok := s.states[id]
	if !ok {
		return &DeviceState{}, true
	}
	return &st, true
}

// ListDevices returns all registered devices that have not been removed.
func (s *MemoryStore) ListDevices() []Device {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Device, 0, len(s.devices))
	for _, d := range s.devices {
		if !d.Removed {
			result = append(result, d)
		}
	}
	return result
}

// Register inserts a device, or merges adapter-owned fields into an existing
// one. Name, Icon, Roles, Disabled, Deleted and Seen are user-owned: once a
// device is known, a re-registration from an adapter (re-discovery, periodic sync) keeps those
// values and updates only the adapter-owned fields (FriendlyName, Source, Type,
// Capabilities, Available, LastSeen). Roles are preserved while their category
// applies, defaulted when a category becomes applicable, and cleared otherwise.
// This mirrors the UpsertDevice query so the in-memory store and the database
// agree on which fields a re-sync may overwrite.
func (s *MemoryStore) Register(d Device) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if existing, ok := s.devices[d.ID]; ok {
		d.Name = existing.Name
		d.Icon = existing.Icon
		d.Roles = ReconcileDeviceRoles(d, existing.Roles)
		d.Disabled = existing.Disabled
		d.Deleted = existing.Deleted
		d.Seen = existing.Seen
	} else {
		d.Roles = ReconcileDeviceRoles(d, d.Roles)
	}
	s.devices[d.ID] = d
}

// UpdateUserFields copies the user-owned metadata (name, icon, roles, disabled,
// deleted, seen) off src onto the registered device, leaving runtime state
// (availability, last seen, reported state) untouched. A nil name clears the override so the
// device falls back to the name its integration reports. If the device is not
// registered, the call is a no-op.
//
// It takes the whole device rather than a field list because the caller is the
// device.updated handler, which already holds one, and because every field added
// to the user-owned set would otherwise lengthen the signature.
func (s *MemoryStore) UpdateUserFields(src Device) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.devices[src.ID]
	if !ok {
		return
	}
	d.Name = src.Name
	d.Icon = src.Icon
	d.Roles = src.Roles
	d.Disabled = src.Disabled
	d.Deleted = src.Deleted
	d.Seen = src.Seen
	s.devices[src.ID] = d
}

// Remove soft-deletes a device by setting its Removed flag.
func (s *MemoryStore) Remove(id DeviceID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if d, ok := s.devices[id]; ok {
		d.Removed = true
		s.devices[id] = d
	}
}

// UpdateDeviceState merges a partial DeviceState update for a device. Non-nil
// fields in state overwrite the corresponding fields in the stored snapshot;
// nil fields leave the stored value untouched. LastSeen is refreshed to now
// because any state message is fresh evidence that the device is reporting.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) UpdateDeviceState(id DeviceID, state DeviceState) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.devices[id]
	if !ok {
		return
	}
	s.states[id] = MergeDeviceState(s.states[id], state)
	d.LastSeen = time.Now()
	s.devices[id] = d
}

// ClearDeviceStateFields nils the listed fields in the cached state for a
// device. Used by adapters that learn a previously-cached field is no longer
// authoritative — e.g. a colour bulb that flipped from color_temp mode into
// xy mode invalidates its cached color_temp value, and the merge protocol on
// its own can only overwrite, not clear. If the device is not registered or
// has never reported state, the call is a no-op.
func (s *MemoryStore) ClearDeviceStateFields(id DeviceID, fields ...DeviceStateField) {
	if len(fields) == 0 {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[id]; !ok {
		return
	}
	cur, ok := s.states[id]
	if !ok {
		return
	}
	for _, f := range fields {
		switch f {
		case FieldColorTemp:
			cur.ColorTemp = nil
		case FieldColor:
			cur.Color = nil
		}
	}
	s.states[id] = cur
}

// SetAvailability updates the availability of a device. An "available=true"
// transition is treated as a fresh signal from the device and refreshes
// LastSeen; an "available=false" transition is the absence of a signal and
// leaves LastSeen alone so the monitor's staleness check remains meaningful.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) SetAvailability(id DeviceID, available bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.devices[id]
	if !ok {
		return
	}
	d.Available = available
	if available {
		d.LastSeen = time.Now()
	}
	s.devices[id] = d
}

// GetGroup returns a group by ID and whether it was found.
func (s *MemoryStore) GetGroup(id GroupID) (Group, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	g, ok := s.groups[id]
	return g, ok
}

// ListGroups returns all groups.
func (s *MemoryStore) ListGroups() []Group {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Group, 0, len(s.groups))
	for _, g := range s.groups {
		result = append(result, g)
	}
	return result
}

// ListGroupMembers returns the direct members of a group.
// Returns an empty slice if the group does not exist.
func (s *MemoryStore) ListGroupMembers(id GroupID) []GroupMember {
	s.mu.RLock()
	defer s.mu.RUnlock()
	members := s.members[id]
	result := make([]GroupMember, len(members))
	copy(result, members)
	return result
}

// ResolveGroupDevices recursively resolves all device IDs that belong to a group,
// expanding nested group members. Returns an empty slice if the group does not exist.
// Each device ID appears at most once in the result.
func (s *MemoryStore) ResolveGroupDevices(id GroupID) []DeviceID {
	s.mu.RLock()
	defer s.mu.RUnlock()

	seen := make(map[DeviceID]struct{})
	s.resolveDevicesLocked(id, seen, make(map[GroupID]struct{}))

	result := make([]DeviceID, 0, len(seen))
	for did := range seen {
		result = append(result, did)
	}
	return result
}

func (s *MemoryStore) resolveDevicesLocked(id GroupID, devices map[DeviceID]struct{}, visited map[GroupID]struct{}) {
	if _, ok := visited[id]; ok {
		return
	}
	visited[id] = struct{}{}

	for _, m := range s.members[id] {
		switch m.MemberType {
		case GroupMemberDevice:
			devices[DeviceID(m.MemberID)] = struct{}{}
		case GroupMemberGroup:
			s.resolveDevicesLocked(GroupID(m.MemberID), devices, visited)
		}
	}
}

// CreateGroup adds a new group to the store. Returns an error if a group
// with the same ID already exists.
func (s *MemoryStore) CreateGroup(g Group) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.groups[g.ID]; ok {
		return fmt.Errorf("group %s already exists", g.ID)
	}
	s.groups[g.ID] = g
	return nil
}

// DeleteGroup removes a group and all its membership records.
// Also removes this group from any parent groups that reference it as a member.
func (s *MemoryStore) DeleteGroup(id GroupID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.groups, id)
	delete(s.members, id)

	idStr := string(id)
	for parentID, parentMembers := range s.members {
		filtered := parentMembers[:0]
		for _, m := range parentMembers {
			if !(m.MemberType == GroupMemberGroup && m.MemberID == idStr) {
				filtered = append(filtered, m)
			}
		}
		if len(filtered) == 0 {
			delete(s.members, parentID)
		} else {
			s.members[parentID] = filtered
		}
	}
}

// AddGroupMember adds a member (device or group) to a group.
// Returns ErrGroupNotFound if the group does not exist.
// Returns ErrCircularDependency if adding a group member would create a cycle.
func (s *MemoryStore) AddGroupMember(m GroupMember) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.groups[m.GroupID]; !ok {
		return ErrGroupNotFound
	}

	if m.MemberType == GroupMemberGroup {
		if s.wouldCreateCycleLocked(m.GroupID, GroupID(m.MemberID)) {
			return ErrCircularDependency
		}
	}

	for _, existing := range s.members[m.GroupID] {
		if existing.MemberType == m.MemberType && existing.MemberID == m.MemberID {
			return nil
		}
	}

	s.members[m.GroupID] = append(s.members[m.GroupID], m)
	return nil
}

// wouldCreateCycleLocked checks if adding childID as a member of parentID
// would create a circular dependency. It walks the descendants of childID
// to see if parentID appears among them.
func (s *MemoryStore) wouldCreateCycleLocked(parentID, childID GroupID) bool {
	if parentID == childID {
		return true
	}
	return s.isDescendantLocked(childID, parentID, make(map[GroupID]struct{}))
}

func (s *MemoryStore) isDescendantLocked(current, target GroupID, visited map[GroupID]struct{}) bool {
	if _, ok := visited[current]; ok {
		return false
	}
	visited[current] = struct{}{}

	for _, m := range s.members[current] {
		if m.MemberType != GroupMemberGroup {
			continue
		}
		mid := GroupID(m.MemberID)
		if mid == target {
			return true
		}
		if s.isDescendantLocked(mid, target, visited) {
			return true
		}
	}
	return false
}

// RemoveGroupMember removes a specific member from a group.
func (s *MemoryStore) RemoveGroupMember(groupID GroupID, memberType GroupMemberType, memberID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	members, ok := s.members[groupID]
	if !ok {
		return
	}

	filtered := members[:0]
	for _, m := range members {
		if !(m.MemberType == memberType && m.MemberID == memberID) {
			filtered = append(filtered, m)
		}
	}
	if len(filtered) == 0 {
		delete(s.members, groupID)
	} else {
		s.members[groupID] = filtered
	}
}
