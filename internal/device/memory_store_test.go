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
	s.Register(Device{ID: "c", Type: Switch})

	list := s.ListDevices()
	if len(list) != 3 {
		t.Fatalf("expected 3 devices, got %d", len(list))
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

func TestUpdateLightState(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.UpdateLightState("l1", LightState{Brightness: Ptr(200), On: Ptr(true)})

	ls, ok := s.GetLightState("l1")
	if !ok {
		t.Fatal("expected light state found")
	}
	if ls.Brightness == nil || *ls.Brightness != 200 {
		t.Fatalf("expected brightness 200, got %v", ls.Brightness)
	}
	if ls.On == nil || *ls.On != true {
		t.Fatalf("expected on true, got %v", ls.On)
	}
}

func TestUpdateLightStatePartialMerge(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})
	s.UpdateLightState("l1", LightState{Brightness: Ptr(200)})
	s.UpdateLightState("l1", LightState{ColorTemp: Ptr(350)})

	ls, ok := s.GetLightState("l1")
	if !ok {
		t.Fatal("expected light state found")
	}
	if ls.Brightness == nil || *ls.Brightness != 200 {
		t.Fatalf("expected brightness 200 preserved, got %v", ls.Brightness)
	}
	if ls.ColorTemp == nil || *ls.ColorTemp != 350 {
		t.Fatalf("expected color_temp 350, got %v", ls.ColorTemp)
	}
}

func TestUpdateSensorState(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "s1", Type: Sensor})
	s.UpdateSensorState("s1", SensorState{Temperature: Ptr(22.5), Humidity: Ptr(45.0)})

	ss, ok := s.GetSensorState("s1")
	if !ok {
		t.Fatal("expected sensor state found")
	}
	if ss.Temperature == nil || *ss.Temperature != 22.5 {
		t.Fatalf("expected temperature 22.5, got %v", ss.Temperature)
	}
	if ss.Humidity == nil || *ss.Humidity != 45.0 {
		t.Fatalf("expected humidity 45.0, got %v", ss.Humidity)
	}
}

func TestUpdateSwitchState(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "sw1", Type: Switch})
	s.UpdateSwitchState("sw1", SwitchState{Action: Ptr("toggle")})

	sw, ok := s.GetSwitchState("sw1")
	if !ok {
		t.Fatal("expected switch state found")
	}
	if sw.Action == nil || *sw.Action != "toggle" {
		t.Fatalf("expected action toggle, got %v", sw.Action)
	}
}

func TestGetLightStateWrongType(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "s1", Type: Sensor})

	ls, ok := s.GetLightState("s1")
	if ok || ls != nil {
		t.Fatal("expected nil, false for wrong device type")
	}
}

func TestGetSensorStateWrongType(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})

	ss, ok := s.GetSensorState("l1")
	if ok || ss != nil {
		t.Fatal("expected nil, false for wrong device type")
	}
}

func TestUpdateStateForUnknownDevice(t *testing.T) {
	s := NewMemoryStore()
	s.UpdateLightState("unknown", LightState{Brightness: Ptr(100)})
	s.UpdateSensorState("unknown", SensorState{Temperature: Ptr(20.0)})
	s.UpdateSwitchState("unknown", SwitchState{Action: Ptr("press")})
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
