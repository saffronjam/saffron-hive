package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateRoom inserts a new room and returns it.
func (s *DB) CreateRoom(ctx context.Context, params CreateRoomParams) (Room, error) {
	if err := s.q.CreateRoom(ctx, sqlite.CreateRoomParams{
		ID:        params.ID,
		Name:      params.Name,
		CreatedBy: params.CreatedBy,
	}); err != nil {
		return Room{}, fmt.Errorf("create room: %w", err)
	}
	return s.GetRoom(ctx, params.ID)
}

// GetRoom retrieves a room by its ID.
func (s *DB) GetRoom(ctx context.Context, id string) (Room, error) {
	row, err := s.q.GetRoom(ctx, id)
	if err != nil {
		return Room{}, fmt.Errorf("get room: %w", err)
	}
	return Room{
		ID:        row.ID,
		Name:      row.Name,
		Icon:      row.Icon,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
		CreatedBy: userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
	}, nil
}

// ListRooms returns all rooms.
func (s *DB) ListRooms(ctx context.Context) ([]Room, error) {
	rows, err := s.q.ListRooms(ctx)
	if err != nil {
		return nil, fmt.Errorf("list rooms: %w", err)
	}
	var rooms []Room
	for _, r := range rows {
		rooms = append(rooms, Room{
			ID:        r.ID,
			Name:      r.Name,
			Icon:      r.Icon,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
			CreatedBy: userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return rooms, nil
}

// UpdateRoom updates a room's name and (optionally) its icon, returning the updated room.
// Icon is updated only when params.SetIcon is true; a nil params.Icon clears the column.
func (s *DB) UpdateRoom(ctx context.Context, params UpdateRoomParams) (Room, error) {
	if err := s.q.UpdateRoomName(ctx, sqlite.UpdateRoomNameParams{
		Name: params.Name,
		ID:   params.ID,
	}); err != nil {
		return Room{}, fmt.Errorf("update room name: %w", err)
	}
	if params.SetIcon {
		if params.Icon == nil {
			if err := s.q.ClearRoomIcon(ctx, params.ID); err != nil {
				return Room{}, fmt.Errorf("clear room icon: %w", err)
			}
		} else {
			if err := s.q.UpdateRoomIcon(ctx, sqlite.UpdateRoomIconParams{
				Icon: params.Icon,
				ID:   params.ID,
			}); err != nil {
				return Room{}, fmt.Errorf("update room icon: %w", err)
			}
		}
	}
	return s.GetRoom(ctx, params.ID)
}

// DeleteRoom deletes a room by its ID. Cascading deletes remove associated device memberships.
func (s *DB) DeleteRoom(ctx context.Context, id string) error {
	if err := s.q.DeleteRoom(ctx, id); err != nil {
		return fmt.Errorf("delete room: %w", err)
	}
	return nil
}

// AddRoomDevice adds a device to a room and returns the created membership.
func (s *DB) AddRoomDevice(ctx context.Context, params AddRoomDeviceParams) (RoomDevice, error) {
	if err := s.q.AddRoomDevice(ctx, sqlite.AddRoomDeviceParams{
		ID:       params.ID,
		RoomID:   params.RoomID,
		DeviceID: params.DeviceID,
	}); err != nil {
		return RoomDevice{}, fmt.Errorf("add room device: %w", err)
	}
	return RoomDevice{
		ID:       params.ID,
		RoomID:   params.RoomID,
		DeviceID: params.DeviceID,
	}, nil
}

// ListRoomDevices returns all device memberships for a room.
func (s *DB) ListRoomDevices(ctx context.Context, roomID string) ([]RoomDevice, error) {
	rows, err := s.q.ListRoomDevices(ctx, roomID)
	if err != nil {
		return nil, fmt.Errorf("list room devices: %w", err)
	}
	var devices []RoomDevice
	for _, r := range rows {
		devices = append(devices, RoomDevice{
			ID:       r.ID,
			RoomID:   r.RoomID,
			DeviceID: r.DeviceID,
		})
	}
	return devices, nil
}

// RemoveRoomDevice removes a device from a room by membership ID.
func (s *DB) RemoveRoomDevice(ctx context.Context, id string) error {
	if err := s.q.RemoveRoomDevice(ctx, id); err != nil {
		return fmt.Errorf("remove room device: %w", err)
	}
	return nil
}

// RemoveRoomDeviceByRoomAndDevice removes a device from a room by room ID and device ID.
func (s *DB) RemoveRoomDeviceByRoomAndDevice(ctx context.Context, roomID, deviceID string) error {
	if err := s.q.RemoveRoomDeviceByRoomAndDevice(ctx, sqlite.RemoveRoomDeviceByRoomAndDeviceParams{
		RoomID:   roomID,
		DeviceID: deviceID,
	}); err != nil {
		return fmt.Errorf("remove room device: %w", err)
	}
	return nil
}

// ListRoomsContainingDevice returns all rooms that contain a specific device.
func (s *DB) ListRoomsContainingDevice(ctx context.Context, deviceID string) ([]Room, error) {
	rows, err := s.q.ListRoomsContainingDevice(ctx, deviceID)
	if err != nil {
		return nil, fmt.Errorf("list rooms containing device: %w", err)
	}
	var rooms []Room
	for _, r := range rows {
		rooms = append(rooms, Room{
			ID:        r.ID,
			Name:      r.Name,
			Icon:      r.Icon,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
			CreatedBy: userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return rooms, nil
}
