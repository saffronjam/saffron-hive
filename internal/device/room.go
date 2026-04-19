package device

import "fmt"

// RoomID is a unique identifier for a room.
type RoomID string

// Room represents a spatial grouping of devices.
type Room struct {
	ID   RoomID
	Name string
}

// ErrRoomNotFound is returned when a room does not exist.
var ErrRoomNotFound = fmt.Errorf("room not found")
