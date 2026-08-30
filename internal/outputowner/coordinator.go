// Package outputowner coordinates dynamic control of physical devices.
package outputowner

import (
	"slices"
	"sync"

	"github.com/saffronjam/saffron-hive/internal/device"
)

// Kind identifies a runtime that emits continuing physical output.
type Kind string

const (
	KindScene  Kind = "scene"
	KindEffect Kind = "effect"
)

// Owner is one active dynamic runtime identity.
type Owner struct {
	Kind  Kind
	RunID string
}

// LossReason explains why an owner lost its complete lease set.
type LossReason string

const (
	LossPreempted LossReason = "preempted"
	LossForeign   LossReason = "foreign_command"
)

// Loss is delivered exactly once when a registered owner is displaced.
type Loss struct {
	Owner       Owner
	Devices     []device.DeviceID
	Reason      LossReason
	SucceededBy *Owner
}

// LossHandler receives lease loss outside the coordinator lock.
type LossHandler func(Loss)

type ownerRecord struct {
	devices map[device.DeviceID]struct{}
	onLoss  LossHandler
}

// Coordinator grants at most one dynamic owner per physical device.
type Coordinator struct {
	mu       sync.Mutex
	byDevice map[device.DeviceID]Owner
	owners   map[Owner]*ownerRecord
}

// New constructs an empty coordinator.
func New() *Coordinator {
	return &Coordinator{byDevice: map[device.DeviceID]Owner{}, owners: map[Owner]*ownerRecord{}}
}

// Acquire atomically grants all devices to owner. Any owner displaced on one
// device loses its complete lease set.
func (c *Coordinator) Acquire(owner Owner, devices []device.DeviceID, onLoss LossHandler) {
	if owner.RunID == "" {
		return
	}
	devices = uniqueDevices(devices)
	var losses []Loss
	var handlers []LossHandler
	c.mu.Lock()
	displaced := map[Owner]bool{}
	for _, id := range devices {
		if previous, ok := c.byDevice[id]; ok && previous != owner {
			displaced[previous] = true
		}
	}
	for previous := range displaced {
		loss, handler := c.removeOwnerLocked(previous, LossPreempted, &owner)
		if handler != nil {
			losses = append(losses, loss)
			handlers = append(handlers, handler)
		}
	}
	if current := c.owners[owner]; current != nil {
		for id := range current.devices {
			delete(c.byDevice, id)
		}
	}
	record := &ownerRecord{devices: make(map[device.DeviceID]struct{}, len(devices)), onLoss: onLoss}
	for _, id := range devices {
		record.devices[id] = struct{}{}
		c.byDevice[id] = owner
	}
	c.owners[owner] = record
	c.mu.Unlock()
	for i, handler := range handlers {
		handler(losses[i])
	}
}

// Release relinquishes an owner's leases without reporting a loss.
func (c *Coordinator) Release(owner Owner) []device.DeviceID {
	c.mu.Lock()
	record := c.owners[owner]
	if record == nil {
		c.mu.Unlock()
		return nil
	}
	devices := sortedDevices(record.devices)
	for id := range record.devices {
		if c.byDevice[id] == owner {
			delete(c.byDevice, id)
		}
	}
	delete(c.owners, owner)
	c.mu.Unlock()
	return devices
}

// ForeignCommand revokes every owner touched by a command that does not carry
// that owner's own origin.
func (c *Coordinator) ForeignCommand(devices []device.DeviceID, origin device.CommandOrigin) {
	var losses []Loss
	var handlers []LossHandler
	c.mu.Lock()
	foreign := map[Owner]bool{}
	for _, id := range uniqueDevices(devices) {
		owner, ok := c.byDevice[id]
		if !ok || originMatches(owner, origin) {
			continue
		}
		foreign[owner] = true
	}
	for owner := range foreign {
		loss, handler := c.removeOwnerLocked(owner, LossForeign, nil)
		if handler != nil {
			losses = append(losses, loss)
			handlers = append(handlers, handler)
		}
	}
	c.mu.Unlock()
	for i, handler := range handlers {
		handler(losses[i])
	}
}

// Owns reports whether owner holds a device lease.
func (c *Coordinator) Owns(owner Owner, id device.DeviceID) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.byDevice[id] == owner
}

func (c *Coordinator) removeOwnerLocked(owner Owner, reason LossReason, successor *Owner) (Loss, LossHandler) {
	record := c.owners[owner]
	if record == nil {
		return Loss{}, nil
	}
	devices := sortedDevices(record.devices)
	for id := range record.devices {
		if c.byDevice[id] == owner {
			delete(c.byDevice, id)
		}
	}
	delete(c.owners, owner)
	return Loss{Owner: owner, Devices: devices, Reason: reason, SucceededBy: successor}, record.onLoss
}

func originMatches(owner Owner, origin device.CommandOrigin) bool {
	return string(owner.Kind) == origin.Kind && owner.RunID == origin.ID
}

func uniqueDevices(ids []device.DeviceID) []device.DeviceID {
	result := append([]device.DeviceID(nil), ids...)
	slices.Sort(result)
	return slices.Compact(result)
}

func sortedDevices(set map[device.DeviceID]struct{}) []device.DeviceID {
	result := make([]device.DeviceID, 0, len(set))
	for id := range set {
		result = append(result, id)
	}
	slices.Sort(result)
	return result
}
