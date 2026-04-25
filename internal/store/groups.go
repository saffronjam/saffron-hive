package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateGroup inserts a new group and returns it.
func (s *DB) CreateGroup(ctx context.Context, params CreateGroupParams) (Group, error) {
	if err := s.q.CreateGroup(ctx, sqlite.CreateGroupParams{
		ID:        params.ID,
		Name:      params.Name,
		CreatedBy: params.CreatedBy,
	}); err != nil {
		return Group{}, fmt.Errorf("create group: %w", err)
	}
	return s.GetGroup(ctx, params.ID)
}

// GetGroup retrieves a group by its ID.
func (s *DB) GetGroup(ctx context.Context, id string) (Group, error) {
	row, err := s.q.GetGroup(ctx, id)
	if err != nil {
		return Group{}, fmt.Errorf("get group: %w", err)
	}
	return Group{
		ID:        row.ID,
		Name:      row.Name,
		Icon:      row.Icon,
		CreatedAt: row.CreatedAt,
		UpdatedAt: row.UpdatedAt,
		CreatedBy: userRefFromPtrs(row.CreatorID, row.CreatorUsername, row.CreatorName),
	}, nil
}

// ListGroups returns all groups.
func (s *DB) ListGroups(ctx context.Context) ([]Group, error) {
	rows, err := s.q.ListGroups(ctx)
	if err != nil {
		return nil, fmt.Errorf("list groups: %w", err)
	}
	var groups []Group
	for _, r := range rows {
		groups = append(groups, Group{
			ID:        r.ID,
			Name:      r.Name,
			Icon:      r.Icon,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
			CreatedBy: userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return groups, nil
}

// UpdateGroup updates a group's name and (optionally) its icon, returning the updated group.
// Icon is updated only when params.SetIcon is true; a nil params.Icon clears the column.
func (s *DB) UpdateGroup(ctx context.Context, params UpdateGroupParams) (Group, error) {
	if err := s.q.UpdateGroupName(ctx, sqlite.UpdateGroupNameParams{
		Name: params.Name,
		ID:   params.ID,
	}); err != nil {
		return Group{}, fmt.Errorf("update group name: %w", err)
	}
	if params.SetIcon {
		if params.Icon == nil {
			if err := s.q.ClearGroupIcon(ctx, params.ID); err != nil {
				return Group{}, fmt.Errorf("clear group icon: %w", err)
			}
		} else {
			if err := s.q.UpdateGroupIcon(ctx, sqlite.UpdateGroupIconParams{
				Icon: params.Icon,
				ID:   params.ID,
			}); err != nil {
				return Group{}, fmt.Errorf("update group icon: %w", err)
			}
		}
	}
	return s.GetGroup(ctx, params.ID)
}

// DeleteGroup deletes a group and any room_members rows that pointed to it.
// group_members owns its members via FK cascade; the polymorphic reverse
// reference from room_members has no FK and is cleaned up explicitly here.
func (s *DB) DeleteGroup(ctx context.Context, id string) error {
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.RemoveRoomMembersByGroup(ctx, id); err != nil {
			return fmt.Errorf("clean room members for group: %w", err)
		}
		if err := q.DeleteGroup(ctx, id); err != nil {
			return fmt.Errorf("delete group: %w", err)
		}
		return nil
	})
	return err
}

// BatchDeleteGroups deletes the groups with the given IDs. Returns the number
// of rows actually deleted; missing IDs are silently ignored. Also clears any
// room_members rows that referenced these groups.
func (s *DB) BatchDeleteGroups(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete groups: %w", err)
	}
	var deleted int64
	err = s.execTx(ctx, func(q *sqlite.Queries) error {
		for _, id := range ids {
			if err := q.RemoveRoomMembersByGroup(ctx, id); err != nil {
				return fmt.Errorf("clean room members for group %s: %w", id, err)
			}
		}
		n, err := q.BatchDeleteGroups(ctx, js)
		if err != nil {
			return fmt.Errorf("batch delete groups: %w", err)
		}
		deleted = n
		return nil
	})
	if err != nil {
		return 0, err
	}
	return deleted, nil
}

// AddGroupMember inserts a new group member. Returns the created member.
// The caller is responsible for circular dependency checking before calling this method.
func (s *DB) AddGroupMember(ctx context.Context, params AddGroupMemberParams) (GroupMember, error) {
	if err := s.q.AddGroupMember(ctx, sqlite.AddGroupMemberParams{
		ID:         params.ID,
		GroupID:    params.GroupID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}); err != nil {
		return GroupMember{}, fmt.Errorf("add group member: %w", err)
	}
	return GroupMember{
		ID:         params.ID,
		GroupID:    params.GroupID,
		MemberType: params.MemberType,
		MemberID:   params.MemberID,
	}, nil
}

// BatchAddGroupDevices adds the listed devices as members of a group. Devices
// already members are silently skipped (UNIQUE(group_id, member_type, member_id)).
// Membership IDs are generated for each new row. Returns the number of newly
// added rows.
func (s *DB) BatchAddGroupDevices(ctx context.Context, groupID string, deviceIDs []string) (int64, error) {
	if len(deviceIDs) == 0 {
		return 0, nil
	}
	var added int64
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		for _, did := range deviceIDs {
			n, err := q.AddGroupMemberIfMissing(ctx, sqlite.AddGroupMemberIfMissingParams{
				ID:         uuid.New().String(),
				GroupID:    groupID,
				MemberType: device.GroupMemberDevice,
				MemberID:   did,
			})
			if err != nil {
				return fmt.Errorf("add group device %s: %w", did, err)
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

// ListGroupMembers returns all members belonging to a group.
func (s *DB) ListGroupMembers(ctx context.Context, groupID string) ([]GroupMember, error) {
	rows, err := s.q.ListGroupMembers(ctx, groupID)
	if err != nil {
		return nil, fmt.Errorf("list group members: %w", err)
	}
	var members []GroupMember
	for _, r := range rows {
		members = append(members, GroupMember{
			ID:         r.ID,
			GroupID:    r.GroupID,
			MemberType: r.MemberType,
			MemberID:   r.MemberID,
		})
	}
	return members, nil
}

// RemoveGroupMember deletes a group member by its ID.
func (s *DB) RemoveGroupMember(ctx context.Context, id string) error {
	if err := s.q.RemoveGroupMember(ctx, id); err != nil {
		return fmt.Errorf("remove group member: %w", err)
	}
	return nil
}

// ListGroupsContainingMember returns all groups that contain a specific member.
func (s *DB) ListGroupsContainingMember(ctx context.Context, memberType device.GroupMemberType, memberID string) ([]Group, error) {
	rows, err := s.q.ListGroupsContainingMember(ctx, sqlite.ListGroupsContainingMemberParams{
		MemberType: memberType,
		MemberID:   memberID,
	})
	if err != nil {
		return nil, fmt.Errorf("list groups containing member: %w", err)
	}
	var groups []Group
	for _, r := range rows {
		groups = append(groups, Group{
			ID:        r.ID,
			Name:      r.Name,
			Icon:      r.Icon,
			CreatedAt: r.CreatedAt,
			UpdatedAt: r.UpdatedAt,
			CreatedBy: userRefFromPtrs(r.CreatorID, r.CreatorUsername, r.CreatorName),
		})
	}
	return groups, nil
}
