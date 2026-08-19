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

// CreateDevice inserts a new device and returns it.
func (s *DB) CreateDevice(ctx context.Context, params CreateDeviceParams) (device.Device, error) {
	capsJSON, err := marshalCapabilities(params.Capabilities)
	if err != nil {
		return device.Device{}, fmt.Errorf("create device: %w", err)
	}
	roles := device.DefaultDeviceRoles(device.Device{Type: params.Type, Capabilities: params.Capabilities})
	if err := s.q.CreateDevice(ctx, sqlite.CreateDeviceParams{
		ID:                 params.ID,
		FriendlyName:       params.FriendlyName,
		Source:             params.Source,
		Type:               params.Type,
		Capabilities:       capsJSON,
		ControlledLoadRole: controlledLoadRoleString(roles.ControlledLoad),
		ContactRole:        contactRoleString(roles.Contact),
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
	roles := device.DefaultDeviceRoles(device.Device{Type: params.Type, Capabilities: params.Capabilities})
	if err := s.q.UpsertDevice(ctx, sqlite.UpsertDeviceParams{
		ID:                 params.ID,
		FriendlyName:       params.FriendlyName,
		Source:             params.Source,
		Type:               params.Type,
		Capabilities:       capsJSON,
		ControlledLoadRole: controlledLoadRoleString(roles.ControlledLoad),
		ContactRole:        contactRoleString(roles.Contact),
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
	return device.Device{
		ID:                row.ID,
		Name:              row.Name,
		FriendlyName:      row.FriendlyName,
		Icon:              row.Icon,
		DisplayColor:      row.DisplayColor,
		DisplayBrightness: row.DisplayBrightness,
		Source:            row.Source,
		Type:              row.Type,
		Roles:             deviceRolesFromStrings(row.ControlledLoadRole, row.ContactRole),
		Capabilities:      unmarshalCapabilities(row.Capabilities),
		Available:         row.Available,
		Removed:           row.Removed,
		Disabled:          row.Disabled,
		Seen:              row.Seen,
		LastSeen:          derefTime(row.LastSeen),
	}, nil
}

// ListDevices returns all devices.
func (s *DB) ListDevices(ctx context.Context) ([]device.Device, error) {
	rows, err := s.q.ListDevices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list devices: %w", err)
	}
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:                r.ID,
			Name:              r.Name,
			FriendlyName:      r.FriendlyName,
			Icon:              r.Icon,
			DisplayColor:      r.DisplayColor,
			DisplayBrightness: r.DisplayBrightness,
			Source:            r.Source,
			Type:              r.Type,
			Roles:             deviceRolesFromStrings(r.ControlledLoadRole, r.ContactRole),
			Capabilities:      unmarshalCapabilities(r.Capabilities),
			Available:         r.Available,
			Removed:           r.Removed,
			Disabled:          r.Disabled,
			Seen:              r.Seen,
			LastSeen:          derefTime(r.LastSeen),
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
	var devices []device.Device
	for _, r := range rows {
		devices = append(devices, device.Device{
			ID:                r.ID,
			Name:              r.Name,
			FriendlyName:      r.FriendlyName,
			Icon:              r.Icon,
			DisplayColor:      r.DisplayColor,
			DisplayBrightness: r.DisplayBrightness,
			Source:            r.Source,
			Type:              r.Type,
			Roles:             deviceRolesFromStrings(r.ControlledLoadRole, r.ContactRole),
			Capabilities:      unmarshalCapabilities(r.Capabilities),
			Available:         r.Available,
			Removed:           r.Removed,
			Disabled:          r.Disabled,
			Seen:              r.Seen,
			LastSeen:          derefTime(r.LastSeen),
		})
	}
	return devices, nil
}

// UpdateDevice updates a device's mutable fields and returns the updated device.
// The icon column is intentionally not part of this update path; user-set icons
// must persist across MQTT-driven re-syncs. Use UpdateDeviceIcon for icon changes.
func (s *DB) UpdateDevice(ctx context.Context, params UpdateDeviceParams) (device.Device, error) {
	if params.SetRoles {
		current, err := s.GetDevice(ctx, params.ID)
		if err != nil {
			return device.Device{}, fmt.Errorf("get device for role update: %w", err)
		}
		if err := device.ValidateDeviceRoles(current, params.Roles); err != nil {
			return device.Device{}, fmt.Errorf("set device roles: %w", err)
		}
		if params.Roles.Contact == nil || *params.Roles.Contact != device.ContactRoleDoor {
			if _, err := s.q.GetFloorplanDoorBindingByDevice(ctx, string(params.ID)); err == nil {
				return device.Device{}, fmt.Errorf("Detach this sensor from its map door before changing its contact role.")
			} else if !errors.Is(err, sql.ErrNoRows) {
				return device.Device{}, fmt.Errorf("get floorplan door binding for role update: %w", err)
			}
		}
	}
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
		if params.SetRoles {
			if err := q.SetDeviceRoles(ctx, sqlite.SetDeviceRolesParams{
				ControlledLoadRole: controlledLoadRoleString(params.Roles.ControlledLoad),
				ContactRole:        contactRoleString(params.Roles.Contact),
				ID:                 params.ID,
			}); err != nil {
				return fmt.Errorf("set device roles: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return device.Device{}, err
	}
	return s.GetDevice(ctx, params.ID)
}

func deviceRolesFromStrings(controlledLoad, contact *string) device.DeviceRoles {
	var roles device.DeviceRoles
	if controlledLoad != nil {
		role := device.ControlledLoadRole(*controlledLoad)
		roles.ControlledLoad = &role
	}
	if contact != nil {
		role := device.ContactRole(*contact)
		roles.Contact = &role
	}
	return roles
}

func controlledLoadRoleString(role *device.ControlledLoadRole) *string {
	if role == nil {
		return nil
	}
	value := string(*role)
	return &value
}

func contactRoleString(role *device.ContactRole) *string {
	if role == nil {
		return nil
	}
	value := string(*role)
	return &value
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

// UpdateDeviceDisplayColor sets the colour the floor plan gives a device that
// reports none of its own, and returns the updated device. A nil params.Color
// clears the column. SetColor must be true, matching UpdateDeviceIcon.
func (s *DB) UpdateDeviceDisplayColor(ctx context.Context, params UpdateDeviceDisplayColorParams) (device.Device, error) {
	if params.SetColor {
		if params.Color == nil {
			if err := s.q.ClearDeviceDisplayColor(ctx, params.ID); err != nil {
				return device.Device{}, fmt.Errorf("clear device display color: %w", err)
			}
		} else {
			if err := s.q.UpdateDeviceDisplayColor(ctx, sqlite.UpdateDeviceDisplayColorParams{
				DisplayColor: params.Color,
				ID:           params.ID,
			}); err != nil {
				return device.Device{}, fmt.Errorf("update device display color: %w", err)
			}
		}
	}
	return s.GetDevice(ctx, params.ID)
}

// UpdateDeviceDisplayBrightness sets how bright a device shows on the floor
// plan when it reports no brightness of its own, and returns the updated
// device. A nil params.Brightness clears the column.
func (s *DB) UpdateDeviceDisplayBrightness(ctx context.Context, params UpdateDeviceDisplayBrightnessParams) (device.Device, error) {
	if params.SetBrightness {
		if params.Brightness == nil {
			if err := s.q.ClearDeviceDisplayBrightness(ctx, params.ID); err != nil {
				return device.Device{}, fmt.Errorf("clear device display brightness: %w", err)
			}
		} else {
			if err := s.q.UpdateDeviceDisplayBrightness(ctx, sqlite.UpdateDeviceDisplayBrightnessParams{
				DisplayBrightness: params.Brightness,
				ID:                params.ID,
			}); err != nil {
				return device.Device{}, fmt.Errorf("update device display brightness: %w", err)
			}
		}
	}
	return s.GetDevice(ctx, params.ID)
}

// DeleteDevice deletes a device by its ID together with its floorplan
// placement in one transaction. The placement is deleted explicitly because
// the runtime connection does not enforce foreign keys, so the schema's
// ON DELETE CASCADE does not fire on its own.
func (s *DB) DeleteDevice(ctx context.Context, id device.DeviceID) error {
	return s.execTx(ctx, func(q *sqlite.Queries) error {
		if err := q.DeleteFloorplanPlacementsByMember(ctx, sqlite.DeleteFloorplanPlacementsByMemberParams{
			MemberType: device.TargetDevice,
			MemberID:   string(id),
		}); err != nil {
			return fmt.Errorf("delete floorplan placement for device: %w", err)
		}
		if err := q.DeleteFloorplanDoorBindingsByDevice(ctx, string(id)); err != nil {
			return fmt.Errorf("delete floorplan door binding for device: %w", err)
		}
		if err := q.DeleteDevice(ctx, id); err != nil {
			return fmt.Errorf("delete device: %w", err)
		}
		return nil
	})
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
