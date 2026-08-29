package scene

import (
	"testing"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func TestMemberConflictsWithPartialChange(t *testing.T) {
	member := store.ActiveSceneMember{
		Owned:    store.SceneOwnedFields{On: true, Brightness: true, ColorTemp: true},
		Expected: store.DesiredState{On: device.Ptr(true), Brightness: device.Ptr(100), ColorTemp: device.Ptr(370)},
	}
	if memberConflictsWithChange(member, device.DeviceState{Humidity: device.Ptr(50.0)}) {
		t.Fatal("unowned partial field caused drift")
	}
	if memberConflictsWithChange(member, device.DeviceState{Brightness: device.Ptr(102)}) {
		t.Fatal("brightness inside tolerance caused drift")
	}
	if !memberConflictsWithChange(member, device.DeviceState{Brightness: device.Ptr(50)}) {
		t.Fatal("owned partial field outside tolerance did not cause drift")
	}
}
