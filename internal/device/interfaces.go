package device

// StateReader provides read-only access to device state.
type StateReader interface {
	GetDevice(DeviceID) (Device, bool)
	GetDeviceState(DeviceID) (*DeviceState, bool)
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
	UpdateDeviceState(DeviceID, DeviceState)
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
