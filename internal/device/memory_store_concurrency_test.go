package device

import (
	"sync"
	"testing"
)

func TestConcurrentReadWrite(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "l1", Type: Light})

	var wg sync.WaitGroup
	for i := range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s.UpdateLightState("l1", LightState{Brightness: Ptr(i)})
		}()
	}
	for range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s.GetLightState("l1")
		}()
	}
	wg.Wait()
}

func TestConcurrentRegisterAndList(t *testing.T) {
	s := NewMemoryStore()

	var wg sync.WaitGroup
	for i := range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			s.Register(Device{ID: DeviceID("d" + string(rune('0'+i%10))), Type: Light})
		}()
	}
	for range 50 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			list := s.ListDevices()
			_ = list
		}()
	}
	wg.Wait()
}
