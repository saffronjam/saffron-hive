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
	return mapUserRow(row), nil
}

// GetUserByUsername retrieves a user by username. Usernames are unique.
func (s *DB) GetUserByUsername(ctx context.Context, username string) (User, error) {
	row, err := s.q.GetUserByUsername(ctx, username)
	if err != nil {
		return User{}, fmt.Errorf("get user by username: %w", err)
	}
	return mapUserRow(row), nil
}

// ListUsers returns all users ordered by creation time ascending.
func (s *DB) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.q.ListUsers(ctx)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	var users []User
	for _, row := range rows {
		users = append(users, mapUserRow(row))
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

func mapUserRow(row sqlite.User) User {
	return User{
		ID:           row.ID,
		Username:     row.Username,
		Name:         row.Name,
		PasswordHash: row.PasswordHash,
		CreatedAt:    row.CreatedAt,
	}
}
