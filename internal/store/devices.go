package store

import (
	"context"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// CreateDevice inserts a new device and returns it.
func (s *DB) CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error) {
	capsJSON, err := marshalCapabilities(params.Capabilities)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	if err := s.q.CreateDevice(ctx, sqlite.CreateDeviceParams{
		ID:           params.ID,
		FriendlyName: params.FriendlyName,
		Source:       params.Source,
		Type:         params.Type,
		Capabilities: capsJSON,
	}); err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	return s.GetDevice(ctx, params.ID)
}

// UpsertDevice inserts a device or refreshes its adapter-owned fields if it already exists.
// It also clears the removed flag on conflict so devices become active when seen again.
func (s *DB) UpsertDevice(ctx context.Context, params CreateDeviceParams) error {
	capsJSON, err := marshalCapabilities(params.Capabilities)
	if err != nil {
		return fmt.Errorf("upsert device: %w", err)
	}
	if err := s.q.UpsertDevice(ctx, sqlite.UpsertDeviceParams{
		ID:           params.ID,
		FriendlyName: params.FriendlyName,
		Source:       params.Source,
		Type:         params.Type,
		Capabilities: capsJSON,
	}); err != nil {
		return fmt.Errorf("upsert device: %w", err)
	}
	return nil
}

// GetDevice retrieves a device by its ID.
func (s *DB) GetDevice(ctx context.Context, id device.DeviceID) (device.Device, error) {
	row, err := s.q.GetDevice(ctx, id)
	if err != nil {
		return device.Device{}, fmt.Errorf("get device: %w", err)
	}
	tags, err := s.q.ListDeviceTags(ctx, string(id))
	if err != nil {
		return device.Device{}, fmt.Errorf("list device tags: %w", err)
	}
	return device.Device{
		ID:           row.ID,
		Name:         row.Name,
		FriendlyName: row.FriendlyName,
		Icon:         row.Icon,
		Source:       row.Source,
		Type:         row.Type,
		Tags:         deviceTagsFromStrings(tags),
		Capabilities: unmarshalCapabilities(row.Capabilities),
		Available:    row.Available,
		Removed:      row.Removed,
		Disabled:     row.Disabled,
		Seen:         row.Seen,
		LastSeen:     derefTime(row.LastSeen),
	}, nil
}

// ListDevices returns all devices.
func (s *DB) ListDevices(ctx context.Context) ([]device.Device, error) {
	rows, err := s.q.ListDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	tagsByDevice, err := s.loadAllDeviceTags(ctx)
	if err != nil {
		return nil, err
	}
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:           r.ID,
			Name:         r.Name,
			FriendlyName: r.FriendlyName,
			Icon:         r.Icon,
			Source:       r.Source,
			Type:         r.Type,
			Tags:         tagsByDevice[r.ID],
			Capabilities: unmarshalCapabilities(r.Capabilities),
			Available:    r.Available,
			Removed:      r.Removed,
			Disabled:     r.Disabled,
			Seen:         r.Seen,
			LastSeen:     derefTime(r.LastSeen),
		})
	}
	return devices, nil
}

// ListDevicesBySource returns all devices matching a given source.
func (s *DB) ListDevicesBySource(ctx context.Context, source device.Source) ([]device.Device, error) {
	rows, err := s.q.ListDevicesBySource(ctx, source)
	if err != nil {
		return nil, fmt.Errorf("list devices by source: %w", err)
	}
	tagsByDevice, err := s.loadAllDeviceTags(ctx)
	if err != nil {
		return nil, err
	}
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:           r.ID,
			Name:         r.Name,
			FriendlyName: r.FriendlyName,
			Icon:         r.Icon,
			Source:       r.Source,
			Type:         r.Type,
			Tags:         tagsByDevice[r.ID],
			Capabilities: unmarshalCapabilities(r.Capabilities),
			Available:    r.Available,
			Removed:      r.Removed,
			Disabled:     r.Disabled,
			Seen:         r.Seen,
			LastSeen:     derefTime(r.LastSeen),
		})
	}
	return devices, nil
}

// UpdateDevice updates a device's mutable fields and returns the updated device.
// The icon column is intentionally not part of this update path; user-set icons
// must persist across MQTT-driven re-syncs. Use UpdateDeviceIcon for icon changes.
func (s *DB) UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error) {
	lastSeen := params.LastSeen
	var lastSeenArg *time.Time
	if !lastSeen.IsZero() {
		lastSeenArg = &lastSeen
	}
	err := s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.UpdateDevice(ctx, sqlite.UpdateDeviceParams{
			Available: params.Available,
			Removed:   params.Removed,
			LastSeen:  lastSeenArg,
			ID:        params.ID,
		}); err != nil {
			return fmt.Errorf("update device: %w", err)
		}
		if params.SetTags {
			if err := q.DeleteDeviceTags(ctx, string(params.ID)); err != nil {
				return fmt.Errorf("clear device tags: %w", err)
			}
			for _, tag := range dedupeDeviceTags(params.Tags) {
				if err := q.InsertDeviceTag(ctx, sqlite.InsertDeviceTagParams{
					DeviceID: string(params.ID),
					Tag:      string(tag),
				}); err != nil {
					return fmt.Errorf("insert device tag: %w", err)
				}
			}
		}
		return nil
	})
	if err != nil {
		return device.Device{}, err
	}
	return s.GetDevice(ctx, params.ID)
}

func dedupeDeviceTags(tags []device.DeviceTag) []device.DeviceTag {
	if len(tags) == 0 {
		return nil
	}
	seen := make(map[device.DeviceTag]bool, len(tags))
	out := make([]device.DeviceTag, 0, len(tags))
	for _, t := range tags {
		if !device.IsValidDeviceTag(t) || seen[t] {
			continue
		}
		seen[t] = true
		out = append(out, t)
	}
	return out
}

func (s *DB) loadAllDeviceTags(ctx context.Context) (map[device.DeviceID][]device.DeviceTag, error) {
	rows, err := s.q.ListAllDeviceTags(ctx)
	if err != nil {
		return nil, fmt.Errorf("list all device tags: %w", err)
	}
	out := make(map[device.DeviceID][]device.DeviceTag, len(rows))
	for _, r := range rows {
		id := device.DeviceID(r.DeviceID)
		tag := device.DeviceTag(r.Tag)
		if !device.IsValidDeviceTag(tag) {
			continue
		}
		out[id] = append(out[id], tag)
	}
	return out, nil
}

func deviceTagsFromStrings(tags []string) []device.DeviceTag {
	if len(tags) == 0 {
		return nil
	}
	out := make([]device.DeviceTag, 0, len(tags))
	for _, t := range tags {
		tag := device.DeviceTag(t)
		if device.IsValidDeviceTag(tag) {
			out = append(out, tag)
		}
	}
	return out
}

// SetDeviceDisabled toggles the user-owned disabled flag and returns the updated
// device. Deliberately separate from UpdateDevice, which overwrites every column
// it names and is called with an otherwise zero-value struct by the
// device-removal path.
func (s *DB) SetDeviceDisabled(ctx context.Context, id device.DeviceID, disabled bool) (device.Device, error) {
	if err := s.q.SetDeviceDisabled(ctx, sqlite.SetDeviceDisabledParams{
		Disabled: disabled,
		ID:       id,
	}); err != nil {
		return device.Device{}, fmt.Errorf("set device disabled: %w", err)
	}
	return s.GetDevice(ctx, id)
}

// MarkDevicesSeen clears the new-device flag for the given ids and returns how
// many rows changed. The device list calls it with everything it just rendered,
// so an empty slice is the common case and does no work.
func (s *DB) MarkDevicesSeen(ctx context.Context, ids []device.DeviceID) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}
	raw := make([]string, len(ids))
	for i, id := range ids {
		raw[i] = string(id)
	}
	js, err := marshalStringArray(raw)
	if err != nil {
		return 0, fmt.Errorf("mark devices seen: %w", err)
	}
	n, err := s.q.MarkDevicesSeen(ctx, js)
	if err != nil {
		return 0, fmt.Errorf("mark devices seen: %w", err)
	}
	return n, nil
}

// ListDisabledDeviceIDs returns the ids of every disabled device, so callers that
// resolve a device set through joins can subtract them in one pass.
func (s *DB) ListDisabledDeviceIDs(ctx context.Context) ([]device.DeviceID, error) {
	ids, err := s.q.ListDisabledDeviceIDs(ctx)
	if err != nil {
		return nil, fmt.Errorf("list disabled device ids: %w", err)
	}
	return ids, nil
}

// SetDeviceName sets the user's name override and returns the updated device. A
// nil name clears the override, so the device falls back to the name its
// integration reports. Deliberately separate from UpdateDevice for the same
// reason SetDeviceDisabled is: UpdateDevice overwrites every column it names and
// the device-removal path calls it with an otherwise zero-value struct.
func (s *DB) SetDeviceName(ctx context.Context, id device.DeviceID, name *string) (device.Device, error) {
	if err := s.q.SetDeviceName(ctx, sqlite.SetDeviceNameParams{
		Name: name,
		ID:   id,
	}); err != nil {
		return device.Device{}, fmt.Errorf("set device name: %w", err)
	}
	return s.GetDevice(ctx, id)
}

// UpdateDeviceIcon sets a device's user-overridable icon and returns the updated
// device. A nil params.Icon clears the column (frontend then falls back to the
// type-based icon). SetIcon must be true; this is a dedicated entry point and
// the bool exists for parity with UpdateRoomParams / UpdateGroupParams callers.
func (s *DB) UpdateDeviceIcon(ctx context.Context, params UpdateDeviceIconParams) (device.Device, error) {
	if params.SetIcon {
		if params.Icon == nil {
			if err := s.q.ClearDeviceIcon(ctx, params.ID); err != nil {
				return device.Device{}, fmt.Errorf("clear device icon: %w", err)
			}
		} else {
			if err := s.q.UpdateDeviceIcon(ctx, sqlite.UpdateDeviceIconParams{
				Icon: params.Icon,
				ID:   params.ID,
			}); err != nil {
				return device.Device{}, fmt.Errorf("update device icon: %w", err)
			}
		}
	}
	return s.GetDevice(ctx, params.ID)
}

// DeleteDevice deletes a device by its ID.
func (s *DB) DeleteDevice(ctx context.Context, id device.DeviceID) error {
	if err := s.q.DeleteDevice(ctx, id); err != nil {
		return fmt.Errorf("delete device: %w", err)
	}
	return nil
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
