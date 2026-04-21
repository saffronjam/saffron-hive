package device

import "testing"

func TestMemoryStoreImplementsStateStore(t *testing.T) {
	var _ StateStore = (*MemoryStore)(nil)
}

func TestMemoryStoreImplementsStateReader(t *testing.T) {
	var _ StateReader = (*MemoryStore)(nil)
}

func TestMemoryStoreImplementsStateWriter(t *testing.T) {
	var _ StateWriter = (*MemoryStore)(nil)
}

func TestRegisterAndGetDevice(t *testing.T) {
	s := NewMemoryStore()
	d := Device{ID: "light-1", Name: "Desk Lamp", Source: "zigbee", Type: Light, Available: true}
	s.Register(d)

	got, ok := s.GetDevice("light-1")
	if !ok {
		t.Fatal("expected device to be found")
	}
	if got.ID != d.ID || got.Name != d.Name || got.Source != d.Source || got.Type != d.Type || got.Available != d.Available {
		t.Fatalf("device fields mismatch: got %+v", got)
	}
}

func TestRegisterOverwritesExisting(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "light-1", Name: "Old Name", Type: Light})
	s.Register(Device{ID: "light-1", Name: "New Name", Type: Light})

	got, _ := s.GetDevice("light-1")
	if got.Name != "New Name" {
		t.Fatalf("expected overwritten name, got %s", got.Name)
	}
}

func TestGetDeviceNotFound(t *testing.T) {
	s := NewMemoryStore()
	_, ok := s.GetDevice("nonexistent")
	if ok {
		t.Fatal("expected not found")
	}
}

func TestListDevices(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "a", Type: Light})
	s.Register(Device{ID: "b", Type: Sensor})
	s.Register(Device{ID: "c", Type: Button})
	s.Register(Device{ID: "d", Type: Plug})

	list := s.ListDevices()
	if len(list) != 4 {
		t.Fatalf("expected 4 devices, got %d", len(list))
	}
}

func TestListDevicesEmpty(t *testing.T) {
	s := NewMemoryStore()
	list := s.ListDevices()
	if list == nil {
		t.Fatal("expected non-nil empty slice")
	}
	if len(list) != 0 {
		t.Fatalf("expected 0 devices, got %d", len(list))
	}
}

func TestUpdateDeviceState_LightFields(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.UpdateDeviceState("l1", DeviceState{Brightness: Ptr(200), On: Ptr(true)})

	ls, ok := s.GetDeviceState("l1")
	if !ok {
		t.Fatal("expected state found")
	}
	if ls.Brightness == nil || *ls.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", ls.Brightness)
	}
	if ls.On == nil || *ls.On != true {
		t.Fatalf("expected on true, got %v", ls.On)
	}
}

func TestUpdateDeviceState_PartialMergePreservesOtherFields(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.UpdateDeviceState("l1", DeviceState{Brightness: Ptr(200)})
	s.UpdateDeviceState("l1", DeviceState{ColorTemp: Ptr(350)})

	ls, ok := s.GetDeviceState("l1")
	if !ok {
		t.Fatal("expected state found")
	}
	if ls.Brightness == nil || *ls.Brightness != 200 {
		t.Fatalf("expected brightness 200 preserved, got %v", ls.Brightness)
	}
	if ls.ColorTemp == nil || *ls.ColorTemp != 350 {
		t.Fatalf("expected color_temp 350, got %v", ls.ColorTemp)
	}
}

func TestUpdateDeviceState_SensorFields(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "s1", Type: Sensor})
	s.UpdateDeviceState("s1", DeviceState{Temperature: Ptr(22.5), Humidity: Ptr(45.0)})

	ss, ok := s.GetDeviceState("s1")
	if !ok {
		t.Fatal("expected state found")
	}
	if ss.Temperature == nil || *ss.Temperature != 22.5 {
		t.Fatalf("expected temperature 22.5, got %v", ss.Temperature)
	}
	if ss.Humidity == nil || *ss.Humidity != 45.0 {
		t.Fatalf("expected humidity 45.0, got %v", ss.Humidity)
	}
}

func TestUpdateDeviceState_PlugMetering(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "p1", Type: Plug})
	s.UpdateDeviceState("p1", DeviceState{
		On:      Ptr(true),
		Power:   Ptr(42.5),
		Voltage: Ptr(230.1),
		Current: Ptr(0.18),
		Energy:  Ptr(12.3),
	})

	ps, ok := s.GetDeviceState("p1")
	if !ok {
		t.Fatal("expected state found")
	}
	if ps.On == nil || *ps.On != true {
		t.Fatal("expected On=true")
	}
	if ps.Power == nil || *ps.Power != 42.5 {
		t.Fatal("expected Power=42.5")
	}
	if ps.Voltage == nil || *ps.Voltage != 230.1 {
		t.Fatal("expected Voltage=230.1")
	}
}

func TestGetDeviceState_UnknownDevice(t *testing.T) {
	s := NewMemoryStore()
	ls, ok := s.GetDeviceState("nope")
	if ok || ls != nil {
		t.Fatal("expected nil, false for unknown device")
	}
}

func TestGetDeviceState_RegisteredNoState(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	ls, ok := s.GetDeviceState("l1")
	if !ok {
		t.Fatal("expected ok for registered device with no state")
	}
	if ls == nil {
		t.Fatal("expected non-nil zero state")
	}
	if ls.On != nil || ls.Brightness != nil {
		t.Fatal("expected zero-value state fields")
	}
}

func TestUpdateStateForUnknownDevice(t *testing.T) {
	s := NewMemoryStore()
	s.UpdateDeviceState("unknown", DeviceState{Brightness: Ptr(100)})
	s.UpdateDeviceState("unknown", DeviceState{Temperature: Ptr(20.0)})
}

func TestRemoveDevice(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.Remove("l1")

	d, ok := s.GetDevice("l1")
	if !ok {
		t.Fatal("expected soft-deleted device still returned by GetDevice")
	}
	if !d.Removed {
		t.Fatal("expected Removed flag to be true")
	}
}

func TestRemoveNonExistent(t *testing.T) {
	s := NewMemoryStore()
	s.Remove("nonexistent")
}

func TestListDevicesExcludesRemoved(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "a", Type: Light})
	s.Register(Device{ID: "b", Type: Sensor})
	s.Remove("a")

	list := s.ListDevices()
	if len(list) != 1 {
		t.Fatalf("expected 1 device after removal, got %d", len(list))
	}
	if list[0].ID != "b" {
		t.Fatalf("expected device b, got %s", list[0].ID)
	}
}

func TestSetAvailability(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.SetAvailability("l1", true)

	d, _ := s.GetDevice("l1")
	if !d.Available {
		t.Fatal("expected available true")
	}

	s.SetAvailability("l1", false)
	d, _ = s.GetDevice("l1")
	if d.Available {
		t.Fatal("expected available false")
	}
}

func TestSetAvailabilityUnknownDevice(t *testing.T) {
	s := NewMemoryStore()
	s.SetAvailability("unknown", true)
}
