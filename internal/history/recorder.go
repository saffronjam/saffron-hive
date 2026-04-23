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
	ds, ok := evt.Payload.(device.DeviceState)
	if !ok {
		return
	}
	if evt.DeviceID == "" {
		return
	}

	recordedAt := time.Now()
	deviceID := device.DeviceID(evt.DeviceID)

	type sample struct {
		field string
		value float64
		ok    bool
	}
	samples := []sample{
		{FieldOn, boolToFloat(ds.On), ds.On != nil},
		{FieldBrightness, ptrIntToFloat(ds.Brightness), ds.Brightness != nil},
		{FieldColorTemp, ptrIntToFloat(ds.ColorTemp), ds.ColorTemp != nil},
		{FieldTemperature, ptrFloat(ds.Temperature), ds.Temperature != nil},
		{FieldHumidity, ptrFloat(ds.Humidity), ds.Humidity != nil},
		{FieldPressure, ptrFloat(ds.Pressure), ds.Pressure != nil},
		{FieldIlluminance, ptrFloat(ds.Illuminance), ds.Illuminance != nil},
		{FieldBattery, ptrIntToFloat(ds.Battery), ds.Battery != nil},
		{FieldPower, ptrFloat(ds.Power), ds.Power != nil},
		{FieldVoltage, ptrFloat(ds.Voltage), ds.Voltage != nil},
		{FieldCurrent, ptrFloat(ds.Current), ds.Current != nil},
		{FieldEnergy, ptrFloat(ds.Energy), ds.Energy != nil},
	}

	inserted := 0
	for _, sm := range samples {
		if !sm.ok {
			continue
		}
		if _, err := s.InsertStateSample(ctx, store.InsertStateSampleParams{
			DeviceID:   deviceID,
			Field:      sm.field,
			Value:      sm.value,
			RecordedAt: recordedAt,
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

func boolToFloat(b *bool) float64 {
	if b != nil && *b {
		return 1
	}
	return 0
}

func ptrFloat(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func ptrIntToFloat(i *int) float64 {
	if i == nil {
		return 0
	}
	return float64(*i)
}
