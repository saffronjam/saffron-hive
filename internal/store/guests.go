package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateGuest inserts a guest after removing an expired guest that owns the
// same normalized name.
func (s *DB) CreateGuest(ctx context.Context, params CreateGuestParams) (Guest, error) {
	params.ExpiresAt = params.ExpiresAt.UTC()
	params.CreatedAt = params.CreatedAt.UTC()
	var guest Guest
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.DeleteExpiredGuestByNormalizedName(ctx, sqlite.DeleteExpiredGuestByNormalizedNameParams{
			NormalizedName: params.NormalizedName,
			Now:            params.CreatedAt,
		}); err != nil {
			return fmt.Errorf("delete expired guest name: %w", err)
		}
		if err := q.CreateGuest(ctx, sqlite.CreateGuestParams{
			ID:             params.ID,
			Name:           params.Name,
			NormalizedName: params.NormalizedName,
			ExpiresAt:      params.ExpiresAt,
			CreatedAt:      params.CreatedAt,
		}); err != nil {
			return fmt.Errorf("create guest: %w", err)
		}
		row, err := q.GetGuestByID(ctx, params.ID)
		if err != nil {
			return fmt.Errorf("get created guest: %w", err)
		}
		guest = guestFromRow(row)
		return nil
	})
	if err != nil {
		return Guest{}, err
	}
	return guest, nil
}

// GetGuestByID retrieves a guest without applying its expiry.
func (s *DB) GetGuestByID(ctx context.Context, id string) (Guest, error) {
	row, err := s.q.GetGuestByID(ctx, id)
	if err != nil {
		return Guest{}, fmt.Errorf("get guest by id: %w", err)
	}
	return guestFromRow(row), nil
}

// GetActiveGuestByID retrieves an unexpired guest by ID.
func (s *DB) GetActiveGuestByID(ctx context.Context, id string, now time.Time) (Guest, error) {
	row, err := s.q.GetActiveGuestByID(ctx, sqlite.GetActiveGuestByIDParams{ID: id, Now: now.UTC()})
	if err != nil {
		return Guest{}, fmt.Errorf("get active guest by id: %w", err)
	}
	return guestFromRow(row), nil
}

// GetActiveGuestByNormalizedName retrieves an unexpired guest by login name.
func (s *DB) GetActiveGuestByNormalizedName(ctx context.Context, name string, now time.Time) (Guest, error) {
	row, err := s.q.GetActiveGuestByNormalizedName(ctx, sqlite.GetActiveGuestByNormalizedNameParams{
		NormalizedName: name,
		Now:            now.UTC(),
	})
	if err != nil {
		return Guest{}, fmt.Errorf("get active guest by normalized name: %w", err)
	}
	return guestFromRow(row), nil
}

// ListActiveGuests returns unexpired guests ordered by creation time.
func (s *DB) ListActiveGuests(ctx context.Context, now time.Time) ([]Guest, error) {
	rows, err := s.q.ListActiveGuests(ctx, now.UTC())
	if err != nil {
		return nil, fmt.Errorf("list active guests: %w", err)
	}
	guests := make([]Guest, 0, len(rows))
	for _, row := range rows {
		guests = append(guests, guestFromRow(row))
	}
	return guests, nil
}

// UpdateGuestExpiresAt sets the guest's access deadline.
func (s *DB) UpdateGuestExpiresAt(ctx context.Context, id string, expiresAt time.Time) (Guest, error) {
	n, err := s.q.UpdateGuestExpiresAt(ctx, sqlite.UpdateGuestExpiresAtParams{ExpiresAt: expiresAt.UTC(), ID: id})
	if err != nil {
		return Guest{}, fmt.Errorf("update guest expiry: %w", err)
	}
	if n == 0 {
		return Guest{}, fmt.Errorf("guest not found")
	}
	return s.GetGuestByID(ctx, id)
}

// DeleteGuest deletes one guest and reports whether it existed.
func (s *DB) DeleteGuest(ctx context.Context, id string) (bool, error) {
	n, err := s.q.DeleteGuest(ctx, id)
	if err != nil {
		return false, fmt.Errorf("delete guest: %w", err)
	}
	return n > 0, nil
}

// BatchDeleteGuests deletes guests by ID and returns the deleted IDs.
func (s *DB) BatchDeleteGuests(ctx context.Context, ids []string) ([]string, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	idsJSON, err := marshalStringArray(ids)
	if err != nil {
		return nil, fmt.Errorf("batch delete guests: %w", err)
	}
	deleted, err := s.q.BatchDeleteGuests(ctx, idsJSON)
	if err != nil {
		return nil, fmt.Errorf("batch delete guests: %w", err)
	}
	return deleted, nil
}

// DeleteExpiredGuests removes expired guests and returns the deleted IDs.
func (s *DB) DeleteExpiredGuests(ctx context.Context, now time.Time) ([]string, error) {
	ids, err := s.q.DeleteExpiredGuests(ctx, now.UTC())
	if err != nil {
		return nil, fmt.Errorf("delete expired guests: %w", err)
	}
	return ids, nil
}

func guestFromRow(row sqlite.Guest) Guest {
	return Guest{
		ID:             row.ID,
		Name:           row.Name,
		NormalizedName: row.NormalizedName,
		ExpiresAt:      row.ExpiresAt,
		CreatedAt:      row.CreatedAt,
	}
}
