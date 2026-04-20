package store

import (
	"context"
	"fmt"

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

// DeleteGroup deletes a group by its ID. Cascading deletes remove associated members.
func (s *DB) DeleteGroup(ctx context.Context, id string) error {
	if err := s.q.DeleteGroup(ctx, id); err != nil {
		return fmt.Errorf("delete group: %w", err)
	}
	return nil
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
