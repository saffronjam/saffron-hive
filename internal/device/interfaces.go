package device

// StateReader provides read-only access to device state.
type StateReader interface {
	GetDevice(DeviceID) (Device, bool)
	GetLightState(DeviceID) (*LightState, bool)
	GetSensorState(DeviceID) (*SensorState, bool)
	GetSwitchState(DeviceID) (*SwitchState, bool)
	ListDevices() []Device
	GetGroup(GroupID) (Group, bool)
	ListGroups() []Group
	ListGroupMembers(GroupID) []GroupMember
	ResolveGroupDevices(GroupID) []DeviceID
}

// StateWriter provides write access to device state.
type StateWriter interface {
	Register(Device)
	Remove(DeviceID)
	UpdateLightState(DeviceID, LightState)
	UpdateSensorState(DeviceID, SensorState)
	UpdateSwitchState(DeviceID, SwitchState)
	SetAvailability(DeviceID, bool)
	CreateGroup(Group) error
	DeleteGroup(GroupID)
	AddGroupMember(GroupMember) error
	RemoveGroupMember(GroupID, GroupMemberType, string)
}

// StateStore combines read and write access.
type StateStore interface {
	StateReader
	StateWriter
}
