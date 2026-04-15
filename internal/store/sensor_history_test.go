package store

import (
	"context"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestInsertSensorReading(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Temp Sensor", Source: "zigbee", Type: device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	temp := 22.5
	hum := 45.0
	bat := 95
	now := time.Now().UTC().Truncate(time.Second)

	r, err := s.InsertSensorReading(ctx, InsertSensorReadingParams{
		DeviceID:    "dev-1",
		Temperature: &temp,
		Humidity:    &hum,
		Battery:     &bat,
		RecordedAt:  now,
	})
	if err != nil {
		t.Fatalf("insert: %v", err)
	}
	if r.ID == 0 {
		t.Error("expected non-zero ID")
	}
	if r.DeviceID != "dev-1" {
		t.Errorf("got DeviceID %q, want %q", r.DeviceID, "dev-1")
	}
	if r.Temperature == nil || *r.Temperature != 22.5 {
		t.Errorf("got Temperature %v, want 22.5", r.Temperature)
	}
	if r.Humidity == nil || *r.Humidity != 45.0 {
		t.Errorf("got Humidity %v, want 45.0", r.Humidity)
	}
	if r.Battery == nil || *r.Battery != 95 {
		t.Errorf("got Battery %v, want 95", r.Battery)
	}
	if r.Pressure != nil {
		t.Errorf("expected Pressure to be nil, got %v", *r.Pressure)
	}
}

func TestQueryByDeviceAndTimeRange(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Sensor", Source: "zigbee", Type: device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	base := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i < 10; i++ {
		temp := float64(20 + i)
		_, err := s.InsertSensorReading(ctx, InsertSensorReadingParams{
			DeviceID:    "dev-1",
			Temperature: &temp,
			RecordedAt:  base.Add(time.Duration(i) * time.Hour),
		})
		if err != nil {
			t.Fatalf("insert %d: %v", i, err)
		}
	}

	readings, err := s.QuerySensorHistory(ctx, SensorHistoryQuery{
		DeviceID: "dev-1",
		From:     base.Add(2 * time.Hour),
		To:       base.Add(5 * time.Hour),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(readings) != 4 {
		t.Fatalf("got %d readings, want 4", len(readings))
	}

	if *readings[0].Temperature != 25.0 {
		t.Errorf("first reading temperature: got %v, want 25.0", *readings[0].Temperature)
	}
}

func TestQueryWithLimit(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Sensor", Source: "zigbee", Type: device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	base := time.Date(2025, 1, 1, 0, 0, 0, 0, time.UTC)
	for i := 0; i < 20; i++ {
		temp := float64(20 + i)
		_, err := s.InsertSensorReading(ctx, InsertSensorReadingParams{
			DeviceID:    "dev-1",
			Temperature: &temp,
			RecordedAt:  base.Add(time.Duration(i) * time.Hour),
		})
		if err != nil {
			t.Fatalf("insert %d: %v", i, err)
		}
	}

	readings, err := s.QuerySensorHistory(ctx, SensorHistoryQuery{
		DeviceID: "dev-1",
		From:     base,
		To:       base.Add(100 * time.Hour),
		Limit:    5,
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(readings) != 5 {
		t.Fatalf("got %d readings, want 5", len(readings))
	}
}

func TestQueryNoResults(t *testing.T) {
	s := newTestStore(t)
	ctx := context.Background()

	_, err := s.CreateDevice(ctx, CreateDeviceParams{
		ID: "dev-1", Name: "Sensor", Source: "zigbee", Type: device.Sensor,
	})
	if err != nil {
		t.Fatalf("create device: %v", err)
	}

	readings, err := s.QuerySensorHistory(ctx, SensorHistoryQuery{
		DeviceID: "dev-1",
		From:     time.Now().Add(-time.Hour),
		To:       time.Now(),
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if readings != nil {
		t.Errorf("expected nil slice, got %d readings", len(readings))
	}
}
