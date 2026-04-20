package store

import (
	"context"
	"fmt"
)

// CreateUser inserts a new user row and returns it.
func (s *SQLiteStore) CreateUser(ctx context.Context, params CreateUserParams) (User, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, username, name, password_hash) VALUES (?, ?, ?, ?)`,
		params.ID, params.Username, params.Name, params.PasswordHash,
	)
	if err != nil {
		return User{}, fmt.Errorf("create user: %w", err)
	}
	return s.GetUserByID(ctx, params.ID)
}

// GetUserByID retrieves a user by its ID.
func (s *SQLiteStore) GetUserByID(ctx context.Context, id string) (User, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, username, name, password_hash, created_at FROM users WHERE id = ?`, id,
	)
	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.Name, &u.PasswordHash, &u.CreatedAt); err != nil {
		return User{}, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

// GetUserByUsername retrieves a user by username. Usernames are unique.
func (s *SQLiteStore) GetUserByUsername(ctx context.Context, username string) (User, error) {
	row := s.db.QueryRowContext(ctx,
		`SELECT id, username, name, password_hash, created_at FROM users WHERE username = ?`, username,
	)
	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.Name, &u.PasswordHash, &u.CreatedAt); err != nil {
		return User{}, fmt.Errorf("get user by username: %w", err)
	}
	return u, nil
}

// ListUsers returns all users ordered by creation time ascending.
func (s *SQLiteStore) ListUsers(ctx context.Context) ([]User, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, username, name, password_hash, created_at FROM users ORDER BY created_at ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer func() { _ = rows.Close() }()
	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Username, &u.Name, &u.PasswordHash, &u.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// CountUsers returns the total number of users.
func (s *SQLiteStore) CountUsers(ctx context.Context) (int, error) {
	var n int
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		return 0, fmt.Errorf("count users: %w", err)
	}
	return n, nil
}
