package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// NativeEffectObservation is a definitive effect result learned from a device.
type NativeEffectObservation struct {
	DeviceID            device.DeviceID
	EffectName          string
	Result              string
	EvidenceFingerprint string
	ObservedAt          time.Time
}

// UpsertNativeEffectObservationParams identifies a definitive learned result.
type UpsertNativeEffectObservationParams struct {
	DeviceID            device.DeviceID
	EffectName          string
	Result              string
	EvidenceFingerprint string
}

// GetNativeEffectObservation returns a learned result for one device and effect.
func (s *DB) GetNativeEffectObservation(ctx context.Context, deviceID device.DeviceID, effectName string) (*NativeEffectObservation, error) {
	row, err := s.q.GetNativeEffectObservation(ctx, sqlite.GetNativeEffectObservationParams{
		DeviceID:   string(deviceID),
		EffectName: effectName,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get native effect observation: %w", err)
	}
	observation := nativeEffectObservationFromRow(row)
	return &observation, nil
}

// ListNativeEffectObservations returns every learned compatibility result.
func (s *DB) ListNativeEffectObservations(ctx context.Context) ([]NativeEffectObservation, error) {
	rows, err := s.q.ListNativeEffectObservations(ctx)
	if err != nil {
		return nil, fmt.Errorf("list native effect observations: %w", err)
	}
	out := make([]NativeEffectObservation, 0, len(rows))
	for _, row := range rows {
		out = append(out, nativeEffectObservationFromRow(row))
	}
	return out, nil
}

// UpsertNativeEffectObservation records a definitive learned result and reports whether it changed.
func (s *DB) UpsertNativeEffectObservation(ctx context.Context, params UpsertNativeEffectObservationParams) (bool, error) {
	_, err := s.q.UpsertNativeEffectObservation(ctx, sqlite.UpsertNativeEffectObservationParams{
		DeviceID:            string(params.DeviceID),
		EffectName:          params.EffectName,
		Result:              params.Result,
		EvidenceFingerprint: params.EvidenceFingerprint,
	})
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("upsert native effect observation: %w", err)
	}
	return true, nil
}

// DeleteNativeEffectObservation removes a learned result for one device and effect.
func (s *DB) DeleteNativeEffectObservation(ctx context.Context, deviceID device.DeviceID, effectName string) error {
	if err := s.q.DeleteNativeEffectObservation(ctx, sqlite.DeleteNativeEffectObservationParams{
		DeviceID:   string(deviceID),
		EffectName: effectName,
	}); err != nil {
		return fmt.Errorf("delete native effect observation: %w", err)
	}
	return nil
}

func nativeEffectObservationFromRow(row sqlite.NativeEffectObservation) NativeEffectObservation {
	return NativeEffectObservation{
		DeviceID:            device.DeviceID(row.DeviceID),
		EffectName:          row.EffectName,
		Result:              row.Result,
		EvidenceFingerprint: row.EvidenceFingerprint,
		ObservedAt:          row.ObservedAt,
	}
}
