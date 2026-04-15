package device

import "sync"

// MemoryStore is an in-memory implementation of StateStore.
// It is safe for concurrent use.
type MemoryStore struct {
	mu       sync.RWMutex
	devices  map[DeviceID]Device
	lights   map[DeviceID]LightState
	sensors  map[DeviceID]SensorState
	switches map[DeviceID]SwitchState
}

// NewMemoryStore creates a new empty MemoryStore.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		devices:  make(map[DeviceID]Device),
		lights:   make(map[DeviceID]LightState),
		sensors:  make(map[DeviceID]SensorState),
		switches: make(map[DeviceID]SwitchState),
	}
}

// GetDevice returns a device by ID and whether it was found.
func (s *MemoryStore) GetDevice(id DeviceID) (Device, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[id]
	return d, ok
}

// GetLightState returns the light state for a device.
// Returns nil, false if the device is not registered or is not a light.
func (s *MemoryStore) GetLightState(id DeviceID) (*LightState, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[id]
	if !ok || d.Type != Light {
		return nil, false
	}
	ls, ok := s.lights[id]
	if !ok {
		return &LightState{}, true
	}
	return &ls, true
}

// GetSensorState returns the sensor state for a device.
// Returns nil, false if the device is not registered or is not a sensor.
func (s *MemoryStore) GetSensorState(id DeviceID) (*SensorState, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[id]
	if !ok || d.Type != Sensor {
		return nil, false
	}
	ss, ok := s.sensors[id]
	if !ok {
		return &SensorState{}, true
	}
	return &ss, true
}

// GetSwitchState returns the switch state for a device.
// Returns nil, false if the device is not registered or is not a switch.
func (s *MemoryStore) GetSwitchState(id DeviceID) (*SwitchState, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	d, ok := s.devices[id]
	if !ok || d.Type != Switch {
		return nil, false
	}
	sw, ok := s.switches[id]
	if !ok {
		return &SwitchState{}, true
	}
	return &sw, true
}

// ListDevices returns all registered devices that have not been removed.
func (s *MemoryStore) ListDevices() []Device {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]Device, 0, len(s.devices))
	for _, d := range s.devices {
		if !d.Removed {
			result = append(result, d)
		}
	}
	return result
}

// Register adds or replaces a device in the store.
func (s *MemoryStore) Register(d Device) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.devices[d.ID] = d
}

// Remove soft-deletes a device by setting its Removed flag.
func (s *MemoryStore) Remove(id DeviceID) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if d, ok := s.devices[id]; ok {
		d.Removed = true
		s.devices[id] = d
	}
}

// UpdateLightState merges a partial LightState update for a device.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) UpdateLightState(id DeviceID, state LightState) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[id]; !ok {
		return
	}
	current := s.lights[id]
	s.lights[id] = MergeLightState(current, state)
}

// UpdateSensorState merges a partial SensorState update for a device.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) UpdateSensorState(id DeviceID, state SensorState) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[id]; !ok {
		return
	}
	current := s.sensors[id]
	s.sensors[id] = MergeSensorState(current, state)
}

// UpdateSwitchState updates the switch state for a device.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) UpdateSwitchState(id DeviceID, state SwitchState) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.devices[id]; !ok {
		return
	}
	s.switches[id] = state
}

// SetAvailability updates the availability of a device.
// If the device is not registered, the update is silently ignored.
func (s *MemoryStore) SetAvailability(id DeviceID, available bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if d, ok := s.devices[id]; ok {
		d.Available = available
		s.devices[id] = d
	}
}
