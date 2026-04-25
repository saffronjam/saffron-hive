package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
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

// DeleteRoom deletes a room and any group_members rows that pointed to it.
// room_members.room_id has an FK ON DELETE CASCADE so direct memberships are
// removed automatically; the polymorphic reverse reference from group_members
// has no FK and is cleaned up explicitly here.
func (s *DB) DeleteRoom(ctx context.Context, id string) error {
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.RemoveGroupMembersByRoom(ctx, id); err != nil {
			return fmt.Errorf("clean group members for room: %w", err)
		}
		if err := q.DeleteRoom(ctx, id); err != nil {
			return fmt.Errorf("delete room: %w", err)
		}
		return nil
	})
	return err
}

// BatchDeleteRooms deletes the rooms with the given IDs. Returns the number of
// rows actually deleted; missing IDs are silently ignored. Also clears any
// group_members rows that referenced these rooms.
func (s *DB) BatchDeleteRooms(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete rooms: %w", err)
	}
	var deleted int64
	err = s.execTx(ctx, func(q *sqlite.Queries) error {
		for _, id := range ids {
			if err := q.RemoveGroupMembersByRoom(ctx, id); err != nil {
				return fmt.Errorf("clean group members for room %s: %w", id, err)
			}
		}
		n, err := q.BatchDeleteRooms(ctx, js)
		if err != nil {
			return fmt.Errorf("batch delete rooms: %w", err)
		}
		deleted = n
		return nil
	})
	if err != nil {
		return 0, err
	}
	return deleted, nil
}

// AddRoomMember inserts a new room member. Returns the created membership.
// The caller is responsible for circular dependency checking before calling this method.
func (s *DB) AddRoomMember(ctx context.Context, params AddRoomMemberParams) (RoomMember, error) {
	if err := s.q.AddRoomMember(ctx, sqlite.AddRoomMemberParams{
		ID:         params.ID,
		RoomID:     params.RoomID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}); err != nil {
		return RoomMember{}, fmt.Errorf("add room member: %w", err)
	}
	return RoomMember{
		ID:         params.ID,
		RoomID:     params.RoomID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}, nil
}

// BatchAddRoomMembers adds the listed members to a room. Members already
// associated with the room are silently skipped (UNIQUE(room_id, member_type,
// member_id) deduplicates). Returns the number of newly added rows.
func (s *DB) BatchAddRoomMembers(ctx context.Context, roomID string, members []RoomMemberInput) (int64, error) {
	if len(members) == 0 {
		return 0, nil
	}
	var added int64
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		for _, m := range members {
			n, err := q.AddRoomMemberIfMissing(ctx, sqlite.AddRoomMemberIfMissingParams{
				ID:         uuid.New().String(),
				RoomID:     roomID,
				MemberType: m.MemberType,
				MemberID:   m.MemberID,
			})
			if err != nil {
				return fmt.Errorf("add room member %s: %w", m.MemberID, err)
			}
			added += n
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return added, nil
}

// ListRoomMembers returns all members belonging to a room.
func (s *DB) ListRoomMembers(ctx context.Context, roomID string) ([]RoomMember, error) {
	rows, err := s.q.ListRoomMembers(ctx, roomID)
	if err != nil {
		return nil, fmt.Errorf("list room members: %w", err)
	}
	var members []RoomMember
	for _, r := range rows {
		members = append(members, RoomMember{
			ID:         r.ID,
			RoomID:     r.RoomID,
			MemberType: r.MemberType,
			MemberID:   r.MemberID,
		})
	}
	return members, nil
}

// RemoveRoomMember deletes a room membership by its ID.
func (s *DB) RemoveRoomMember(ctx context.Context, id string) error {
	if err := s.q.RemoveRoomMember(ctx, id); err != nil {
		return fmt.Errorf("remove room member: %w", err)
	}
	return nil
}

// ListRoomsContainingMember returns all rooms that directly contain a specific member.
// "Directly" means the membership row exists in room_members; transitive
// membership via groups is not reflected.
func (s *DB) ListRoomsContainingMember(ctx context.Context, memberType device.RoomMemberType, memberID string) ([]Room, error) {
	rows, err := s.q.ListRoomsContainingMember(ctx, sqlite.ListRoomsContainingMemberParams{
		MemberType: memberType,
		MemberID:   memberID,
	})
	if err != nil {
		return nil, fmt.Errorf("list rooms containing member: %w", err)
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

// ListRoomMemberships returns every room-member row joined with the room name
// in one scan. Activity-hot paths use this together with ListAllGroupMemberships
// to compute transitive device→room attribution without a per-event JOIN.
func (s *DB) ListRoomMemberships(ctx context.Context) ([]RoomMembership, error) {
	rows, err := s.q.ListRoomMemberships(ctx)
	if err != nil {
		return nil, fmt.Errorf("list room memberships: %w", err)
	}
	out := make([]RoomMembership, 0, len(rows))
	for _, r := range rows {
		out = append(out, RoomMembership{
			ID:         r.ID,
			RoomID:     r.RoomID,
			RoomName:   r.RoomName,
			MemberType: r.MemberType,
			MemberID:   r.MemberID,
		})
	}
	return out, nil
}

// RoomDeviceMembership pairs a device with one room it currently belongs to.
// A device can appear more than once in the slice if it is reachable from
// multiple rooms (via direct membership and/or nested groups). Used by the
// activity recorder to enrich events with room names.
type RoomDeviceMembership struct {
	RoomID   string
	RoomName string
	DeviceID string
}

// ListTransitiveRoomDeviceMemberships expands every room's reachable device set
// — including devices nested through group members — and returns one row per
// (room, device) pair. Cycle-safe via a per-room seen set.
//
// This is the counterpart to ResolveTargetDeviceIDs but in bulk: it answers the
// question "for every room, which devices end up in it?" with one round trip.
func (s *DB) ListTransitiveRoomDeviceMemberships(ctx context.Context) ([]RoomDeviceMembership, error) {
	roomMs, err := s.ListRoomMemberships(ctx)
	if err != nil {
		return nil, err
	}
	groupMs, err := s.q.ListAllGroupMemberships(ctx)
	if err != nil {
		return nil, fmt.Errorf("list all group memberships: %w", err)
	}

	roomChildren := map[string][]RoomMember{}
	roomNames := map[string]string{}
	for _, m := range roomMs {
		roomNames[m.RoomID] = m.RoomName
		roomChildren[m.RoomID] = append(roomChildren[m.RoomID], RoomMember{
			ID:         m.ID,
			RoomID:     m.RoomID,
			MemberType: m.MemberType,
			MemberID:   m.MemberID,
		})
	}

	type groupChild struct {
		memberType device.GroupMemberType
		memberID   string
	}
	groupChildren := map[string][]groupChild{}
	for _, m := range groupMs {
		groupChildren[m.GroupID] = append(groupChildren[m.GroupID], groupChild{
			memberType: m.MemberType,
			memberID:   m.MemberID,
		})
	}

	var out []RoomDeviceMembership
	for roomID, name := range roomNames {
		seen := map[string]bool{}
		devSeen := map[string]bool{}
		var walkRoom func(id string)
		var walkGroup func(id string)
		walkRoom = func(id string) {
			key := "room:" + id
			if seen[key] {
				return
			}
			seen[key] = true
			for _, m := range roomChildren[id] {
				switch m.MemberType {
				case device.RoomMemberDevice:
					if !devSeen[m.MemberID] {
						devSeen[m.MemberID] = true
						out = append(out, RoomDeviceMembership{
							RoomID:   roomID,
							RoomName: name,
							DeviceID: m.MemberID,
						})
					}
				case device.RoomMemberGroup:
					walkGroup(m.MemberID)
				}
			}
		}
		walkGroup = func(id string) {
			key := "group:" + id
			if seen[key] {
				return
			}
			seen[key] = true
			for _, m := range groupChildren[id] {
				switch m.memberType {
				case device.GroupMemberDevice:
					if !devSeen[m.memberID] {
						devSeen[m.memberID] = true
						out = append(out, RoomDeviceMembership{
							RoomID:   roomID,
							RoomName: name,
							DeviceID: m.memberID,
						})
					}
				case device.GroupMemberGroup:
					walkGroup(m.memberID)
				case device.GroupMemberRoom:
					walkRoom(m.memberID)
				}
			}
		}
		walkRoom(roomID)
	}
	return out, nil
}
