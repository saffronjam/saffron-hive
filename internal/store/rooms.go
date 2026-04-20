package store

import (
	"context"
	"database/sql"
	"fmt"
)

const roomSelectColumns = `r.id, r.name, r.icon, r.created_at, r.updated_at, u.id, u.username, u.name`

const roomFromJoin = `FROM rooms r LEFT JOIN users u ON u.id = r.created_by`

// CreateRoom inserts a new room and returns it.
func (s *SQLiteStore) CreateRoom(ctx context.Context, params CreateRoomParams) (Room, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO rooms (id, name, created_by) VALUES (?, ?, ?)`,
		params.ID, params.Name, params.CreatedBy,
	)
	if err != nil {
		return Room{}, fmt.Errorf("create room: %w", err)
	}
	return s.GetRoom(ctx, params.ID)
}

// GetRoom retrieves a room by its ID.
func (s *SQLiteStore) GetRoom(ctx context.Context, id string) (Room, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT `+roomSelectColumns+` `+roomFromJoin+` WHERE r.id = ?`, id,
	)
	r, err := scanRoom(row)
	if err != nil {
		return Room{}, fmt.Errorf("get room: %w", err)
	}
	return r, nil
}

// ListRooms returns all rooms.
func (s *SQLiteStore) ListRooms(ctx context.Context) ([]Room, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+roomSelectColumns+` `+roomFromJoin,
	)
	if err != nil {
		return nil, fmt.Errorf("list rooms: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var rooms []Room
	for rows.Next() {
		r, err := scanRoom(rows)
		if err != nil {
			return nil, fmt.Errorf("scan room: %w", err)
		}
		rooms = append(rooms, r)
	}
	return rooms, rows.Err()
}

// UpdateRoom updates a room's name and (optionally) its icon, returning the updated room.
// Icon is updated only when params.SetIcon is true; a nil params.Icon clears the column.
func (s *SQLiteStore) UpdateRoom(ctx context.Context, params UpdateRoomParams) (Room, error) {
	if _, err := s.db.ExecContext(ctx,
		`UPDATE rooms SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		params.Name, params.ID,
	); err != nil {
		return Room{}, fmt.Errorf("update room name: %w", err)
	}
	if params.SetIcon {
		var iconArg any
		if params.Icon != nil {
			iconArg = *params.Icon
		}
		if _, err := s.db.ExecContext(ctx,
			`UPDATE rooms SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			iconArg, params.ID,
		); err != nil {
			return Room{}, fmt.Errorf("update room icon: %w", err)
		}
	}
	return s.GetRoom(ctx, params.ID)
}

// DeleteRoom deletes a room by its ID. Cascading deletes remove associated device memberships.
func (s *SQLiteStore) DeleteRoom(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM rooms WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete room: %w", err)
	}
	return nil
}

// AddRoomDevice adds a device to a room and returns the created membership.
func (s *SQLiteStore) AddRoomDevice(ctx context.Context, params AddRoomDeviceParams) (RoomDevice, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO room_devices (id, room_id, device_id) VALUES (?, ?, ?)`,
		params.ID, params.RoomID, params.DeviceID,
	)
	if err != nil {
		return RoomDevice{}, fmt.Errorf("add room device: %w", err)
	}
	return RoomDevice{
		ID:       params.ID,
		RoomID:   params.RoomID,
		DeviceID: params.DeviceID,
	}, nil
}

// ListRoomDevices returns all device memberships for a room.
func (s *SQLiteStore) ListRoomDevices(ctx context.Context, roomID string) ([]RoomDevice, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, room_id, device_id FROM room_devices WHERE room_id = ?`, roomID,
	)
	if err != nil {
		return nil, fmt.Errorf("list room devices: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var devices []RoomDevice
	for rows.Next() {
		var rd RoomDevice
		if err := rows.Scan(&rd.ID, &rd.RoomID, &rd.DeviceID); err != nil {
			return nil, fmt.Errorf("scan room device: %w", err)
		}
		devices = append(devices, rd)
	}
	return devices, rows.Err()
}

// RemoveRoomDevice removes a device from a room by membership ID.
func (s *SQLiteStore) RemoveRoomDevice(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM room_devices WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("remove room device: %w", err)
	}
	return nil
}

// RemoveRoomDeviceByRoomAndDevice removes a device from a room by room ID and device ID.
func (s *SQLiteStore) RemoveRoomDeviceByRoomAndDevice(ctx context.Context, roomID, deviceID string) error {
	_, err := s.db.ExecContext(ctx,
		`DELETE FROM room_devices WHERE room_id = ? AND device_id = ?`,
		roomID, deviceID,
	)
	if err != nil {
		return fmt.Errorf("remove room device: %w", err)
	}
	return nil
}

// ListRoomsContainingDevice returns all rooms that contain a specific device.
func (s *SQLiteStore) ListRoomsContainingDevice(ctx context.Context, deviceID string) ([]Room, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+roomSelectColumns+`
		FROM rooms r
		INNER JOIN room_devices rd ON r.id = rd.room_id
		LEFT JOIN users u ON u.id = r.created_by
		WHERE rd.device_id = ?`,
		deviceID,
	)
	if err != nil {
		return nil, fmt.Errorf("list rooms containing device: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var rooms []Room
	for rows.Next() {
		r, err := scanRoom(rows)
		if err != nil {
			return nil, fmt.Errorf("scan room: %w", err)
		}
		rooms = append(rooms, r)
	}
	return rooms, rows.Err()
}

func scanRoom(row rowScanner) (Room, error) {
	var r Room
	var creatorID, creatorUsername, creatorName sql.NullString
	if err := row.Scan(&r.ID, &r.Name, &r.Icon, &r.CreatedAt, &r.UpdatedAt, &creatorID, &creatorUsername, &creatorName); err != nil {
		return Room{}, err
	}
	r.CreatedBy = buildUserRef(creatorID, creatorUsername, creatorName)
	return r, nil
}
