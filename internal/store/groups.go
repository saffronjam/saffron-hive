package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// CreateGroup inserts a new group and returns it.
func (s *SQLiteStore) CreateGroup(ctx context.Context, params CreateGroupParams) (Group, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO groups (id, name) VALUES (?, ?)`,
		params.ID, params.Name,
	)
	if err != nil {
		return Group{}, fmt.Errorf("create group: %w", err)
	}
	return s.GetGroup(ctx, params.ID)
}

// GetGroup retrieves a group by its ID.
func (s *SQLiteStore) GetGroup(ctx context.Context, id string) (Group, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, name, icon, created_at, updated_at FROM groups WHERE id = ?`, id,
	)
	var g Group
	err := row.Scan(&g.ID, &g.Name, &g.Icon, &g.CreatedAt, &g.UpdatedAt)
	if err != nil {
		return Group{}, fmt.Errorf("get group: %w", err)
	}
	return g, nil
}

// ListGroups returns all groups.
func (s *SQLiteStore) ListGroups(ctx context.Context) ([]Group, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, icon, created_at, updated_at FROM groups`)
	if err != nil {
		return nil, fmt.Errorf("list groups: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Icon, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan group: %w", err)
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}

// UpdateGroup updates a group's name and (optionally) its icon, returning the updated group.
// Icon is updated only when params.SetIcon is true; a nil params.Icon clears the column.
func (s *SQLiteStore) UpdateGroup(ctx context.Context, params UpdateGroupParams) (Group, error) {
	if _, err := s.db.ExecContext(ctx,
		`UPDATE groups SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		params.Name, params.ID,
	); err != nil {
		return Group{}, fmt.Errorf("update group name: %w", err)
	}
	if params.SetIcon {
		var iconArg any
		if params.Icon != nil {
			iconArg = *params.Icon
		}
		if _, err := s.db.ExecContext(ctx,
			`UPDATE groups SET icon = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			iconArg, params.ID,
		); err != nil {
			return Group{}, fmt.Errorf("update group icon: %w", err)
		}
	}
	return s.GetGroup(ctx, params.ID)
}

// DeleteGroup deletes a group by its ID. Cascading deletes remove associated members.
func (s *SQLiteStore) DeleteGroup(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM groups WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("delete group: %w", err)
	}
	return nil
}

// AddGroupMember inserts a new group member. Returns the created member.
// The caller is responsible for circular dependency checking before calling this method.
func (s *SQLiteStore) AddGroupMember(ctx context.Context, params AddGroupMemberParams) (GroupMember, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO group_members (id, group_id, member_type, member_id) VALUES (?, ?, ?, ?)`,
		params.ID, params.GroupID, params.MemberType, params.MemberID,
	)
	if err != nil {
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
func (s *SQLiteStore) ListGroupMembers(ctx context.Context, groupID string) ([]GroupMember, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, group_id, member_type, member_id FROM group_members WHERE group_id = ?`, groupID,
	)
	if err != nil {
		return nil, fmt.Errorf("list group members: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var members []GroupMember
	for rows.Next() {
		var m GroupMember
		if err := rows.Scan(&m.ID, &m.GroupID, &m.MemberType, &m.MemberID); err != nil {
			return nil, fmt.Errorf("scan group member: %w", err)
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

// RemoveGroupMember deletes a group member by its ID.
func (s *SQLiteStore) RemoveGroupMember(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM group_members WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("remove group member: %w", err)
	}
	return nil
}

// ListGroupsContainingMember returns all groups that contain a specific member.
func (s *SQLiteStore) ListGroupsContainingMember(ctx context.Context, memberType device.GroupMemberType, memberID string) ([]Group, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT g.id, g.name, g.icon, g.created_at, g.updated_at
		FROM groups g
		INNER JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.member_type = ? AND gm.member_id = ?`,
		memberType, memberID,
	)
	if err != nil {
		return nil, fmt.Errorf("list groups containing member: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var groups []Group
	for rows.Next() {
		var g Group
		if err := rows.Scan(&g.ID, &g.Name, &g.Icon, &g.CreatedAt, &g.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan group: %w", err)
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}
