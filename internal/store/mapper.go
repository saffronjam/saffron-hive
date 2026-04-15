package store

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// DeviceRow represents the raw database columns for a device.
type DeviceRow struct {
	ID        string
	Name      string
	Source    string
	Type      string
	Available bool
	Removed   bool
	LastSeen  *time.Time
}

// MapDeviceRowToDomain converts a DeviceRow to a domain Device.
func MapDeviceRowToDomain(row DeviceRow) device.Device {
	d := device.Device{
		ID:        device.DeviceID(row.ID),
		Name:      row.Name,
		Source:    device.Source(row.Source),
		Type:      device.DeviceType(row.Type),
		Available: row.Available,
		Removed:   row.Removed,
	}
	if row.LastSeen != nil {
		d.LastSeen = *row.LastSeen
	}
	return d
}

// MapDomainToDeviceRow converts a domain Device to a DeviceRow.
func MapDomainToDeviceRow(d device.Device) DeviceRow {
	row := DeviceRow{
		ID:        string(d.ID),
		Name:      d.Name,
		Source:    string(d.Source),
		Type:      string(d.Type),
		Available: d.Available,
		Removed:   d.Removed,
	}
	if !d.LastSeen.IsZero() {
		row.LastSeen = &d.LastSeen
	}
	return row
}

// MarshalLightCommand serializes a LightCommand to JSON for storage.
func MarshalLightCommand(cmd device.LightCommand) (string, error) {
	b, err := json.Marshal(cmd)
	if err != nil {
		return "", fmt.Errorf("marshal light command: %w", err)
	}
	return string(b), nil
}

// UnmarshalLightCommand deserializes a LightCommand from JSON.
func UnmarshalLightCommand(data string) (device.LightCommand, error) {
	var cmd device.LightCommand
	if err := json.Unmarshal([]byte(data), &cmd); err != nil {
		return device.LightCommand{}, fmt.Errorf("unmarshal light command: %w", err)
	}
	return cmd, nil
}
