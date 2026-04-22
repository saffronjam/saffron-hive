package store

import (
	"context"
	"fmt"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateUser inserts a new user row and returns it.
func (s *DB) CreateUser(ctx context.Context, params CreateUserParams) (User, error) {
	if err := s.q.CreateUser(ctx, sqlite.CreateUserParams{
		ID:           params.ID,
		Username:     params.Username,
		Name:         params.Name,
		PasswordHash: params.PasswordHash,
	}); err != nil {
		return User{}, fmt.Errorf("create user: %w", err)
	}
	return s.GetUserByID(ctx, params.ID)
}

// GetUserByID retrieves a user by its ID.
func (s *DB) GetUserByID(ctx context.Context, id string) (User, error) {
	row, err := s.q.GetUserByID(ctx, id)
	if err != nil {
		return User{}, fmt.Errorf("get user by id: %w", err)
	}
	return User{
		ID:           row.ID,
		Username:     row.Username,
		Name:         row.Name,
		PasswordHash: row.PasswordHash,
		AvatarPath:   row.AvatarPath,
		Theme:        row.Theme,
		CreatedAt:    row.CreatedAt,
	}, nil
}

// GetUserByUsername retrieves a user by username. Usernames are unique.
func (s *DB) GetUserByUsername(ctx context.Context, username string) (User, error) {
	row, err := s.q.GetUserByUsername(ctx, username)
	if err != nil {
		return User{}, fmt.Errorf("get user by username: %w", err)
	}
	return User{
		ID:           row.ID,
		Username:     row.Username,
		Name:         row.Name,
		PasswordHash: row.PasswordHash,
		AvatarPath:   row.AvatarPath,
		Theme:        row.Theme,
		CreatedAt:    row.CreatedAt,
	}, nil
}

// ListUsers returns all users ordered by creation time ascending.
func (s *DB) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.q.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	users := make([]User, 0, len(rows))
	for _, row := range rows {
		users = append(users, User{
			ID:           row.ID,
			Username:     row.Username,
			Name:         row.Name,
			PasswordHash: row.PasswordHash,
			AvatarPath:   row.AvatarPath,
			Theme:        row.Theme,
			CreatedAt:    row.CreatedAt,
		})
	}
	return users, nil
}

// CountUsers returns the total number of users.
func (s *DB) CountUsers(ctx context.Context) (int, error) {
	n, err := s.q.CountUsers(ctx)
	if err != nil {
		return 0, fmt.Errorf("count users: %w", err)
	}
	return int(n), nil
}

// UpdateUserProfile applies a partial update to name / theme / avatar_path.
// Nil fields leave their column untouched. AvatarPath cannot clear to NULL
// here; use ClearUserAvatar for that.
func (s *DB) UpdateUserProfile(ctx context.Context, params UpdateUserProfileParams) (User, error) {
	if err := s.q.UpdateUserProfile(ctx, sqlite.UpdateUserProfileParams{
		ID:         params.ID,
		Name:       params.Name,
		Theme:      params.Theme,
		AvatarPath: params.AvatarPath,
	}); err != nil {
		return User{}, fmt.Errorf("update user profile: %w", err)
	}
	return s.GetUserByID(ctx, params.ID)
}

// ClearUserAvatar sets the avatar_path column to NULL for the given user.
func (s *DB) ClearUserAvatar(ctx context.Context, id string) error {
	if err := s.q.ClearUserAvatar(ctx, id); err != nil {
		return fmt.Errorf("clear user avatar: %w", err)
	}
	return nil
}

// UpdateUserPasswordHash replaces the stored bcrypt hash for the given user.
func (s *DB) UpdateUserPasswordHash(ctx context.Context, id, hash string) error {
	if err := s.q.UpdateUserPasswordHash(ctx, sqlite.UpdateUserPasswordHashParams{
		ID:           id,
		PasswordHash: hash,
	}); err != nil {
		return fmt.Errorf("update user password hash: %w", err)
	}
	return nil
}

// DeleteUser removes a user row. Foreign keys on scenes/automations/groups/rooms
// are configured ON DELETE SET NULL, so creator attribution becomes null but
// the attributed rows remain.
func (s *DB) DeleteUser(ctx context.Context, id string) error {
	if err := s.q.DeleteUser(ctx, id); err != nil {
		return fmt.Errorf("delete user: %w", err)
	}
	return nil
}

// BatchDeleteUsers deletes the users with the given IDs. Same FK semantics as
// DeleteUser apply to every row removed. Returns the number of rows actually
// deleted; missing IDs are silently ignored. The caller is responsible for
// excluding the currently authenticated user from the input.
func (s *DB) BatchDeleteUsers(ctx context.Context, ids []string) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return 0, fmt.Errorf("batch delete users: %w", err)
	}
	n, err := s.q.BatchDeleteUsers(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("batch delete users: %w", err)
	}
	return n, nil
}

// GetUserAvatarPath returns the stored avatar filename for a user, or nil when
// no avatar is set. Returns a not-found error if the user does not exist.
func (s *DB) GetUserAvatarPath(ctx context.Context, id string) (*string, error) {
	path, err := s.q.GetUserAvatarPath(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get user avatar path: %w", err)
	}
	return path, nil
}

// GetUserAvatarPathsByIDs returns the (id, avatar_path) pairs for users with
// non-null avatars. Used to clean up files after BatchDeleteUsers.
func (s *DB) GetUserAvatarPathsByIDs(ctx context.Context, ids []string) (map[string]string, error) {
	if len(ids) == 0 {
		return map[string]string{}, nil
	}
	js, err := marshalStringArray(ids)
	if err != nil {
		return nil, fmt.Errorf("get user avatar paths: %w", err)
	}
	rows, err := s.q.GetUserAvatarPathsByIDs(ctx, js)
	if err != nil {
		return nil, fmt.Errorf("get user avatar paths: %w", err)
	}
	out := make(map[string]string, len(rows))
	for _, r := range rows {
		if r.AvatarPath != nil && *r.AvatarPath != "" {
			out[r.ID] = *r.AvatarPath
		}
	}
	return out, nil
}
