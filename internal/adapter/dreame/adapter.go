package dreame

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("dreame")

type adapterStore interface {
	RegisterDreameDevice(context.Context, device.Device, store.DreameDevice) error
	ListDreameDevices(context.Context) ([]store.DreameDevice, error)
	SaveCleaningSnapshot(context.Context, cleaning.Snapshot) error
	ListCleaningSnapshots(context.Context) ([]cleaning.Snapshot, error)
}

// Adapter maps Dreamehome reports to Hive devices and cleaning snapshots.
type Adapter struct {
	session     *Session
	bus         eventbus.EventBus
	state       device.StateStore
	store       adapterStore
	mu          sync.Mutex
	pollMu      sync.Mutex
	lastSuccess time.Time
	devices     map[device.DeviceID]DeviceInfo
	snapshots   map[device.DeviceID]cleaning.Snapshot
	known       map[device.DeviceID]string
	observer    interface {
		ObserveConfiguration(device.DeviceID, []device.AttributeValue) device.CommandOrigin
	}
	cancel  context.CancelFunc
	ctx     context.Context
	stopped bool
	wg      sync.WaitGroup
}

func NewAdapter(session *Session, bus eventbus.EventBus, state device.StateStore, store adapterStore) *Adapter {
	ctx, cancel := context.WithCancel(context.Background())
	return &Adapter{session: session, bus: bus, state: state, store: store, ctx: ctx, cancel: cancel, devices: map[device.DeviceID]DeviceInfo{}, snapshots: map[device.DeviceID]cleaning.Snapshot{}, known: map[device.DeviceID]string{}}
}
func (a *Adapter) Start(ctx context.Context) error {
	a.mu.Lock()
	if a.stopped {
		a.mu.Unlock()
		return errors.New("Dreame adapter is stopped")
	}
	a.cancel()
	a.ctx, a.cancel = context.WithCancel(ctx)
	ctx = a.ctx
	a.wg.Add(1)
	a.mu.Unlock()
	if cached, err := a.store.ListCleaningSnapshots(ctx); err == nil {
		for _, snapshot := range cached {
			a.snapshots[device.DeviceID(snapshot.DeviceID)] = snapshot
		}
	}
	_, startErr := a.Sync(ctx)
	go func() { defer a.wg.Done(); a.run(ctx) }()
	return startErr
}
func (a *Adapter) Stop() {
	a.mu.Lock()
	a.stopped = true
	a.cancel()
	a.mu.Unlock()
	a.wg.Wait()
	a.mu.Lock()
	defer a.mu.Unlock()
	for id := range a.devices {
		a.availability(id, false)
	}
}

func (a *Adapter) operationContext(ctx context.Context) (context.Context, func(), error) {
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.stopped || a.ctx.Err() != nil {
		return nil, nil, errors.New("Dreame adapter is stopped")
	}
	a.wg.Add(1)
	operation, cancel := context.WithCancel(ctx)
	stop := context.AfterFunc(a.ctx, cancel)
	return operation, func() { stop(); cancel(); a.wg.Done() }, nil
}
func (a *Adapter) Sync(ctx context.Context) ([]device.Device, error) {
	infos, err := a.session.Discover(ctx)
	if err != nil {
		return nil, err
	}
	account := a.session.AccountID()
	if account == "" {
		return nil, errors.New("Dreame did not identify the authenticated account")
	}
	seen := map[device.DeviceID]bool{}
	result := []device.Device{}
	for _, info := range infos {
		id := device.DeviceID(uuid.NewSHA1(uuid.NameSpaceURL, []byte("dreame:"+account+":"+info.ID)).String())
		seen[id] = true
		name := info.Name
		if name == "" {
			name = info.ProductName
		}
		if name == "" {
			name = info.Model
		}
		capabilities := []device.Capability{{Name: device.CapBattery, Type: "numeric", Category: device.CapabilityCategoryState, Access: device.CapabilityAccessState, Unit: "%"}}
		if info.Model == "dreame.vacuum.r2423" {
			capabilities = append(capabilities, device.Capability{Name: device.CapCleaning, Type: "enum", Category: device.CapabilityCategoryState, Access: device.CapabilityAccessState, Values: []string{"unknown", "idle", "cleaning", "paused", "returning", "docked", "attention"}})
		}
		capabilities = append(capabilities, configurationCapabilities(info.Model)...)
		d := device.Device{ID: id, Source: device.SourceDreame, Type: device.Vacuum, FriendlyName: name, Capabilities: capabilities, Available: info.Online}
		if err := a.store.RegisterDreameDevice(ctx, d, store.DreameDevice{DeviceID: id, AccountID: account, ExternalID: info.ID, Model: info.Model, Shard: info.Shard}); err != nil {
			return nil, err
		}
		a.mu.Lock()
		previous, known := a.known[id]
		a.devices[id] = info
		a.known[id] = device.AdapterFingerprint(d)
		a.mu.Unlock()
		a.state.Register(d)
		if !known {
			a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceAdded, DeviceID: string(id), Timestamp: time.Now(), Payload: d})
		} else if previous != device.AdapterFingerprint(d) {
			a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceSynced, DeviceID: string(id), Timestamp: time.Now(), Payload: d})
		}
		a.availability(id, info.Online)
		if err := a.syncImageSources(ctx, id, info.ImageSources); err != nil {
			return nil, err
		}
		result = append(result, d)
	}
	if stored, err := a.store.ListDreameDevices(ctx); err == nil {
		for _, old := range stored {
			if !seen[old.DeviceID] {
				a.state.Remove(old.DeviceID)
				a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceRemoved, DeviceID: string(old.DeviceID), Timestamp: time.Now()})
			}
		}
	} else {
		return nil, err
	}
	a.mu.Lock()
	for id := range a.devices {
		if !seen[id] {
			delete(a.devices, id)
			delete(a.known, id)
			a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceRemoved, DeviceID: string(id), Timestamp: time.Now()})
		}
	}
	a.mu.Unlock()
	return result, nil
}
func (a *Adapter) availability(id device.DeviceID, available bool) {
	if d, ok := a.state.GetDevice(id); ok && d.Available == available {
		return
	}
	a.state.SetAvailability(id, available)
	a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceAvailabilityChanged, DeviceID: string(id), Timestamp: time.Now(), Payload: available})
}
func (a *Adapter) run(ctx context.Context) {
	timer := time.NewTimer(0)
	defer timer.Stop()
	next := map[device.DeviceID]time.Time{}
	metadata := map[device.DeviceID]time.Time{}
	discovery := time.Now().Add(15 * time.Minute)
	a.mu.Lock()
	if len(a.devices) == 0 {
		discovery = time.Now()
	}
	a.mu.Unlock()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-timer.C:
			if now.After(discovery) {
				if _, err := a.Sync(ctx); err != nil {
					logger.Warn("device discovery failed", "error", err)
					discovery = now.Add(time.Minute)
				} else {
					discovery = now.Add(15 * time.Minute)
				}
			}
			a.mu.Lock()
			infos := make(map[device.DeviceID]DeviceInfo, len(a.devices))
			for id, info := range a.devices {
				infos[id] = info
			}
			a.mu.Unlock()
			for id, info := range infos {
				if now.Before(next[id]) {
					continue
				}
				if d, ok := a.state.GetDevice(id); ok && d.RuntimeDisabled() {
					continue
				}
				refresh := now.After(metadata[id])
				snapshot, err := a.poll(ctx, id, info, refresh)
				delay := 10 * time.Second
				if snapshot.Active() {
					delay = 5 * time.Second
				}
				if err != nil {
					logger.Debug("device read failed", "device_id", id, "error", err)
					a.availability(id, false)
					delay = 30 * time.Second
				} else if refresh {
					metadata[id] = now.Add(5 * time.Minute)
				}
				next[id] = time.Now().Add(delay)
			}
			timer.Reset(time.Second)
		}
	}
}

var essentialProperties = []PropertyKey{{2, 1}, {2, 2}, {3, 1}, {3, 2}, {4, 2}, {4, 3}, {4, 4}, {4, 5}, {4, 7}, {4, 63}}

func (a *Adapter) poll(ctx context.Context, id device.DeviceID, info DeviceInfo, refresh bool) (cleaning.Snapshot, error) {
	a.pollMu.Lock()
	defer a.pollMu.Unlock()
	a.mu.Lock()
	snapshot := a.snapshots[id]
	a.mu.Unlock()
	wasActive := snapshot.Active()
	previousStatus := snapshot.Status
	snapshot.DeviceID = string(id)
	snapshot.Supported = info.Model == "dreame.vacuum.r2423"
	snapshot.Model = info.ProductName
	snapshot.ModelID = info.Model
	snapshot.ImageSources = append([]string(nil), info.ImageSources...)
	if snapshot.Model == "" {
		snapshot.Model = info.Model
	}
	snapshot.Manufacturer = info.Manufacturer
	snapshot.Actions = nil
	if snapshot.Supported {
		snapshot.Actions = []cleaning.Action{cleaning.ActionPause, cleaning.ActionResume, cleaning.ActionStop, cleaning.ActionDock, cleaning.ActionLocate, cleaning.ActionEmptyBin}
	}
	keys := append([]PropertyKey(nil), essentialProperties...)
	if refresh {
		keys = append(keys, PropertyKey{9, 2}, PropertyKey{10, 2}, PropertyKey{11, 1}, PropertyKey{16, 1})
	}
	values, err := a.session.ReadProperties(ctx, info, keys)
	if err != nil {
		return snapshot, err
	}
	numbers := map[string]float64{}
	for _, p := range values {
		var v float64
		if p.Code == 0 && json.Unmarshal(p.Value, &v) == nil {
			numbers[fmt.Sprintf("%d.%d", p.SIID, p.PIID)] = v
		}
	}
	if state, ok := numbers["2.1"]; ok {
		snapshot.Status = reportedStatus(int(state))
	}
	if code, ok := numbers["2.2"]; ok {
		snapshot.Error = ""
		if code != 0 {
			snapshot.Error = fmt.Sprintf("Device error %d", int(code))
			snapshot.Status = cleaning.StatusAttention
		}
	}
	numeric := func(key string) *float64 {
		if v, ok := numbers[key]; ok {
			return &v
		}
		return nil
	}
	integer := func(key string) *int {
		if v, ok := numbers[key]; ok {
			n := int(v)
			return &n
		}
		return nil
	}
	snapshot.Battery = numeric("3.1")
	snapshot.TaskStatus = integer("4.7")
	snapshot.Suction = integer("4.4")
	snapshot.Water = integer("4.5")
	snapshot.ElapsedMinutes = numeric("4.2")
	snapshot.CleanedArea = numeric("4.3")
	snapshot.Progress = numeric("4.63")
	if snapshot.Progress != nil && (*snapshot.Progress < 0 || *snapshot.Progress > 100) {
		snapshot.Progress = nil
	}
	snapshot.UpdatedAt = time.Now().UTC()
	if refresh {
		snapshot.Consumables = []cleaning.Consumable{}
		for _, item := range []struct{ name, key string }{{"main_brush", "9.2"}, {"side_brush", "10.2"}, {"filter", "11.1"}, {"sensors", "16.1"}} {
			if v, ok := numbers[item.key]; ok {
				snapshot.Consumables = append(snapshot.Consumables, cleaning.Consumable{Name: item.name, Percent: v, Resettable: snapshot.Supported})
			}
		}
		maps, mapErr := a.session.SavedMaps(ctx, info)
		if mapErr == nil {
			snapshot.Maps = maps
			snapshot.MapError = ""
		} else {
			snapshot.MapError = mapErr.Error()
		}
	}
	if snapshot.Supported && (snapshot.Active() || wasActive || previousStatus != snapshot.Status || snapshot.LiveMap == nil || refresh) {
		live, mapErr := a.session.CurrentMap(ctx, info)
		if mapErr == nil {
			snapshot.LiveMap = &live
			snapshot.LiveAt = live.FrameAt
			snapshot.ActiveMapID = live.SavedMapID
			snapshot.MapError = ""
			if snapshot.ActiveMapID == 0 {
				for _, saved := range snapshot.Maps {
					if saved.ID == live.ID {
						snapshot.ActiveMapID = saved.ID
						break
					}
				}
			}
		} else {
			snapshot.MapError = mapErr.Error()
		}
	}
	if refresh || wasActive && !snapshot.Active() || (!snapshot.Active() && time.Since(snapshot.HistoryAt) > time.Minute) {
		if history, historyErr := a.session.History(ctx, info); historyErr == nil {
			snapshot.History = history
			snapshot.HistoryAt = time.Now().UTC()
		} else {
			logger.Debug("cleaning history read failed", "device_id", id, "error", historyErr)
		}
	}

	a.mu.Lock()
	a.snapshots[id] = snapshot
	a.lastSuccess = snapshot.UpdatedAt
	a.mu.Unlock()
	if err := a.store.SaveCleaningSnapshot(ctx, snapshot); err != nil {
		return snapshot, err
	}
	a.availability(id, true)
	current, _ := a.state.GetDeviceState(id)
	changed := device.DeviceState{}
	if current == nil || current.CleaningStatus == nil || *current.CleaningStatus != string(snapshot.Status) {
		changed.CleaningStatus = device.Ptr(string(snapshot.Status))
	}
	if snapshot.Battery != nil && (current == nil || current.Battery == nil || *current.Battery != *snapshot.Battery) {
		changed.Battery = snapshot.Battery
	}
	if changed.CleaningStatus != nil || changed.Battery != nil {
		a.bus.Publish(eventbus.Event{Type: eventbus.EventDeviceStateChanged, DeviceID: string(id), Timestamp: snapshot.UpdatedAt, Payload: device.DeviceStateChange{State: changed}})
	}
	a.publishConfiguration(id, snapshot)
	a.bus.Publish(eventbus.Event{Type: eventbus.EventCleaningUpdated, DeviceID: string(id), Timestamp: snapshot.UpdatedAt, Payload: snapshot})
	return snapshot, nil
}
func reportedStatus(code int) cleaning.Status {
	switch code {
	case 1, 7, 12:
		return cleaning.StatusCleaning
	case 2:
		return cleaning.StatusIdle
	case 3:
		return cleaning.StatusPaused
	case 5:
		return cleaning.StatusReturning
	case 6, 13:
		return cleaning.StatusDocked
	case 4:
		return cleaning.StatusAttention
	default:
		return cleaning.StatusUnknown
	}
}

func (a *Adapter) DispatchCleaning(ctx context.Context, op cleaning.Operation) error {
	ctx, done, err := a.operationContext(ctx)
	if err != nil {
		return cleaning.Reject(err)
	}
	defer done()
	id := device.DeviceID(op.DeviceID)
	dev, ok := a.state.GetDevice(id)
	if !ok || dev.RuntimeDisabled() || dev.Removed || !dev.Available {
		return cleaning.Reject(errors.New("vacuum is unavailable"))
	}
	a.mu.Lock()
	info, ok := a.devices[id]
	a.mu.Unlock()
	if !ok {
		return cleaning.Reject(errors.New("vacuum is not connected"))
	}
	if op.Action == "reset_consumable" {
		if err := a.session.ResetConsumable(ctx, info, op.Consumable); err != nil {
			return err
		}
		_, err := a.poll(ctx, id, info, true)
		return err
	}
	if op.Action != "start" {
		return a.session.Control(ctx, info, op.Action)
	}
	if op.Plan == nil || op.Plan.DeviceID != op.DeviceID {
		return cleaning.Reject(errors.New("invalid cleaning plan"))
	}
	snapshot, err := a.poll(ctx, id, info, false)
	if err != nil {
		return cleaning.Reject(err)
	}
	if snapshot.Status != cleaning.StatusIdle && snapshot.Status != cleaning.StatusDocked {
		return cleaning.Reject(errors.New("vacuum is busy"))
	}
	currentMap, err := a.session.CurrentMap(ctx, info)
	if err != nil {
		return cleaning.Reject(fmt.Errorf("cannot verify the active cleaning map: %w", err))
	}
	activeMapID := currentMap.SavedMapID
	if activeMapID == 0 {
		for _, saved := range snapshot.Maps {
			if saved.ID == currentMap.ID {
				activeMapID = saved.ID
				break
			}
		}
	}
	if strconv.Itoa(activeMapID) != op.Plan.MapID {
		return cleaning.Reject(errors.New("the robot's active map does not match the linked rooms"))
	}
	var selected *cleaning.MapSnapshot
	for i := range snapshot.Maps {
		if strconv.Itoa(snapshot.Maps[i].ID) == op.Plan.MapID {
			selected = &snapshot.Maps[i]
			break
		}
	}
	if selected == nil {
		return cleaning.Reject(errors.New("cleaning map is unavailable"))
	}
	areas := map[int]bool{}
	for _, r := range selected.Rooms {
		areas[r.ID] = true
	}
	segments := []SegmentOptions{}
	for _, area := range op.Plan.AreaIDs {
		n, err := strconv.Atoi(area)
		if err != nil || !areas[n] {
			return cleaning.Reject(errors.New("cleaning room link needs review"))
		}
		if snapshot.Suction == nil || snapshot.Water == nil {
			return cleaning.Reject(errors.New("cleaning settings are unavailable"))
		}
		fan, water := *snapshot.Suction, *snapshot.Water
		if op.Plan.Options.Suction != nil {
			fan = *op.Plan.Options.Suction
		}
		if op.Plan.Options.Water != nil {
			water = *op.Plan.Options.Water
		}
		segments = append(segments, SegmentOptions{ID: n, Repeats: op.Plan.Options.Repeats, Suction: fan, Water: water})
	}
	return a.session.StartSegments(ctx, info, segments)
}
func (*Adapter) DispatchState(context.Context, device.Command) error {
	return errors.New("vacuum requires a cleaning operation")
}
func (*Adapter) DispatchGroupState(context.Context, device.ProviderGroupCommand) error {
	return errors.New("vacuum requires a cleaning operation")
}
func (*Adapter) DispatchNativeEffect(context.Context, device.NativeEffectRequest) error {
	return errors.New("vacuum does not support effects")
}
func (*Adapter) DispatchDeviceCommand(context.Context, device.DeviceCommandRequest) error {
	return errors.New("vacuum requires a cleaning operation")
}

// Connected reports whether at least one device has returned a recent state snapshot.
func (a *Adapter) Connected() bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	return !a.lastSuccess.IsZero() && time.Since(a.lastSuccess) < 2*time.Minute
}

func (a *Adapter) syncImageSources(ctx context.Context, id device.DeviceID, sources []string) error {
	a.pollMu.Lock()
	defer a.pollMu.Unlock()
	a.mu.Lock()
	snapshot := a.snapshots[id]
	a.mu.Unlock()
	if slices.Equal(snapshot.ImageSources, sources) {
		return nil
	}
	snapshot.DeviceID = string(id)
	snapshot.ImageSources = slices.Clone(sources)
	if err := a.store.SaveCleaningSnapshot(ctx, snapshot); err != nil {
		return err
	}
	a.mu.Lock()
	a.snapshots[id] = snapshot
	a.mu.Unlock()
	return nil
}
