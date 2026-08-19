package history

import (
	"context"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("history")

// historyStore is the narrow set of store methods this package needs.
// *store.DB satisfies it structurally.
type historyStore interface {
	InsertStateSample(ctx context.Context, params store.InsertStateSampleParams) (int64, error)
	PruneDeviceStateSamplesOlderThan(ctx context.Context, cutoff time.Time) (int64, error)
	GetSetting(ctx context.Context, key string) (store.Setting, error)
}

// RunRecorder subscribes to device state change events and persists every
// non-nil scalar field as its own sample row. Blocks until ctx is cancelled.
func RunRecorder(ctx context.Context, bus eventbus.Subscriber, s historyStore) {
	ch := bus.Subscribe(eventbus.EventDeviceStateChanged)
	defer bus.Unsubscribe(ch)
	logger.Info("state-history recorder started")

	for {
		select {
		case <-ctx.Done():
			return
		case evt, ok := <-ch:
			if !ok {
				return
			}
			handleState(ctx, s, evt)
		}
	}
}

func handleState(ctx context.Context, s historyStore, evt eventbus.Event) {
	change, ok := evt.Payload.(device.DeviceStateChange)
	if !ok {
		return
	}
	if evt.DeviceID == "" {
		return
	}
	ds := change.State

	recordedAt := time.Now()
	deviceID := device.DeviceID(evt.DeviceID)

	type sample struct {
		field   string
		numeric *float64
		text    *string
	}
	samples := []sample{
		{FieldOn, boolToNumber(ds.On), nil},
		{FieldBrightness, intToNumber(ds.Brightness), nil},
		{FieldColorTemp, intToNumber(ds.ColorTemp), nil},
		{FieldTargetTemp, ds.TargetTemperature, nil},
		{FieldTemperature, ds.Temperature, nil},
		{FieldHumidity, ds.Humidity, nil},
		{FieldPressure, ds.Pressure, nil},
		{FieldIlluminance, ds.Illuminance, nil},
		{FieldBattery, ds.Battery, nil},
		{FieldPower, ds.Power, nil},
		{FieldVoltage, ds.Voltage, nil},
		{FieldCurrent, ds.Current, nil},
		{FieldEnergy, ds.Energy, nil},
		{FieldOccupancy, boolToNumber(ds.Occupancy), nil},
		{FieldContact, boolToNumber(ds.Contact), nil},
		{FieldOrientation, nil, ds.Orientation},
		{FieldDevicePosture, nil, ds.DevicePosture},
		{FieldLinkQuality, ds.LinkQuality, nil},
		{FieldHvacMode, nil, ds.HvacMode},
		{FieldFanMode, nil, ds.FanMode},
		{FieldSwing, nil, ds.Swing},
	}

	inserted := 0
	for _, sm := range samples {
		if sm.numeric == nil && sm.text == nil {
			continue
		}
		if _, err := s.InsertStateSample(ctx, store.InsertStateSampleParams{
			DeviceID:     deviceID,
			Field:        sm.field,
			NumericValue: sm.numeric,
			TextValue:    sm.text,
			Deduplicate:  IsStatefulField(sm.field),
			RecordedAt:   recordedAt,
		}); err != nil {
			logger.Error("failed to insert state sample",
				"device_id", evt.DeviceID,
				"field", sm.field,
				"error", err,
			)
			continue
		}
		inserted++
	}
	if inserted > 0 {
		logger.Debug("recorded state samples", "device_id", evt.DeviceID, "count", inserted)
	}
}

func boolToNumber(value *bool) *float64 {
	if value == nil {
		return nil
	}
	number := 0.0
	if *value {
		number = 1
	}
	return &number
}

func intToNumber(value *int) *float64 {
	if value == nil {
		return nil
	}
	number := float64(*value)
	return &number
}
