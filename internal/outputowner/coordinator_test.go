package outputowner

import (
	"sync"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
)

func TestAcquirePreemptsTheCompletePriorOwnerOnce(t *testing.T) {
	coordinator := New()
	first := Owner{Kind: KindScene, RunID: "scene-1"}
	second := Owner{Kind: KindEffect, RunID: "effect-1"}
	var mu sync.Mutex
	var losses []Loss
	coordinator.Acquire(first, []device.DeviceID{"a", "b", "a"}, func(loss Loss) {
		mu.Lock()
		losses = append(losses, loss)
		mu.Unlock()
	})
	coordinator.Acquire(second, []device.DeviceID{"b"}, nil)
	coordinator.Acquire(second, []device.DeviceID{"b", "c"}, nil)

	mu.Lock()
	defer mu.Unlock()
	if len(losses) != 1 {
		t.Fatalf("losses = %#v", losses)
	}
	if losses[0].Reason != LossPreempted || losses[0].SucceededBy == nil || *losses[0].SucceededBy != second {
		t.Fatalf("loss = %#v", losses[0])
	}
	if coordinator.Owns(first, "a") || coordinator.Owns(first, "b") {
		t.Fatal("preempted owner retained a lease")
	}
	if !coordinator.Owns(second, "b") || !coordinator.Owns(second, "c") {
		t.Fatal("successor did not receive its complete lease set")
	}
}

func TestForeignCommandRevokesOwnerButOwnOriginDoesNot(t *testing.T) {
	coordinator := New()
	owner := Owner{Kind: KindScene, RunID: "run-1"}
	losses := make(chan Loss, 2)
	coordinator.Acquire(owner, []device.DeviceID{"light"}, func(loss Loss) { losses <- loss })
	coordinator.ForeignCommand([]device.DeviceID{"light"}, device.OriginScene("run-1"))
	select {
	case loss := <-losses:
		t.Fatalf("own output caused loss: %#v", loss)
	default:
	}
	coordinator.ForeignCommand([]device.DeviceID{"light"}, device.OriginUser())
	select {
	case loss := <-losses:
		if loss.Reason != LossForeign || len(loss.Devices) != 1 || loss.Devices[0] != "light" {
			t.Fatalf("loss = %#v", loss)
		}
	case <-time.After(time.Second):
		t.Fatal("foreign command did not revoke the owner")
	}
	coordinator.ForeignCommand([]device.DeviceID{"light"}, device.OriginUser())
	select {
	case loss := <-losses:
		t.Fatalf("owner lost twice: %#v", loss)
	default:
	}
}
