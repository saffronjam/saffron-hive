package device

import "fmt"

// RoomID is a unique identifier for a room.
type RoomID string

// Room represents a spatial grouping of devices.
type Room struct {
	ID   RoomID
	Name string
}

// RoomMemberType classifies what kind of entity a room member is. Only devices
// and groups are valid; rooms cannot directly contain other rooms.
type RoomMemberType string

const (
	// RoomMemberDevice indicates the member is a device.
	RoomMemberDevice RoomMemberType = "device"
	// RoomMemberGroup indicates the member is a group.
	RoomMemberGroup RoomMemberType = "group"
)

// RoomMember represents a direct membership relationship between a room and
// either a device or a group.
type RoomMember struct {
	ID         string
	RoomID     RoomID
	MemberType RoomMemberType
	MemberID   string
}

// ErrRoomNotFound is returned when a room does not exist.
var ErrRoomNotFound = fmt.Errorf("room not found")

// ErrInvalidRoomMemberType is returned when a caller supplies a room member
// type the system doesn't accept (e.g. "room").
var ErrInvalidRoomMemberType = fmt.Errorf("invalid room member type")
