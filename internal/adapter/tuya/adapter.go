package tuya

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/adapter/tuya/local"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

var logger = logging.Named("tuya")

const (
	connectTimeout   = 8 * time.Second
	readTimeout      = 70 * time.Second
	heartbeatEvery   = 20 * time.Second
	discoveryWindow  = 6 * time.Second
	maxReconnectWait = 30 * time.Second
)

// deviceStore persists the per-device local-control metadata (local key, LAN
// ip, protocol version, product id) so it survives restarts and is refreshed at
// each Sync.
type deviceStore interface {
	UpsertTuyaDevice(context.Context, store.TuyaDevice) error
	ListTuyaDevices(context.Context) ([]store.TuyaDevice, error)
}

// conn is the adapter's handle to one device's persistent local connection. The
// manager goroutine is the sole writer; commands are funnelled through cmds so
// all writes happen on that goroutine.
type conn struct {
	productID string
	cmds      chan localCommand
}

type localCommand struct {
	dps    map[string]any
	result chan error
}

// OutputObserver receives device reports before they are published.
type OutputObserver interface {
	ObserveState(device.DeviceID, device.DeviceState) device.OutputObservation
}

// Adapter bridges Tuya devices to the event bus over the local (LAN) protocol.
// The cloud is used only to enumerate devices and fetch their local keys.
type Adapter struct {
	client *CloudClient
	bus    eventbus.EventBus
	reader device.StateReader
	writer device.StateWriter
	store  deviceStore

	cancel context.CancelFunc
	wg     sync.WaitGroup

	mu    sync.Mutex
	conns map[device.DeviceID]*conn
	// knownDevices holds the adapter-field fingerprint of each device the poll
	// loop has already reported, keyed by device id.
	knownDevices map[device.DeviceID]string
	creds        map[device.DeviceID]store.TuyaDevice
	observer     OutputObserver
}

// NewAdapter creates the Tuya adapter. ds persists per-device local-control
// metadata.
func NewAdapter(client *CloudClient, bus eventbus.EventBus, state device.StateStore, ds deviceStore) *Adapter {
	return &Adapter{
		client:       client,
		bus:          bus,
		reader:       state,
		writer:       state,
		store:        ds,
		conns:        make(map[device.DeviceID]*conn),
		knownDevices: make(map[device.DeviceID]string),
		creds:        make(map[device.DeviceID]store.TuyaDevice),
	}
}

// Start syncs devices from the cloud, then opens a persistent local connection
// per device and begins routing commands.
func (a *Adapter) Start(ctx context.Context) error {
	ctx, a.cancel = context.WithCancel(ctx)
	if _, err := a.Sync(ctx); err != nil {
		return err
	}
	a.mu.Lock()
	creds := make(map[device.DeviceID]store.TuyaDevice, len(a.creds))
	for id, cr := range a.creds {
		creds[id] = cr
	}
	a.mu.Unlock()
	for id, cr := range creds {
		a.startConn(ctx, id, cr)
	}
	return nil
}

// Stop tears down all connections and loops.
func (a *Adapter) Stop() {
	if a.cancel != nil {
		a.cancel()
	}
	a.wg.Wait()
}

// SetOutputObserver routes state acknowledgements through Hive's delivery ledger.
func (a *Adapter) SetOutputObserver(observer OutputObserver) {
	a.mu.Lock()
	a.observer = observer
	a.mu.Unlock()
}

// Sync enumerates devices from the cloud, registers them, refreshes their
// local-control metadata (local key from the cloud, LAN ip/version from UDP
// discovery), and returns the per-device credentials.
func (a *Adapter) Sync(ctx context.Context) ([]device.Device, error) {
	infos, err := a.client.ListDevices(ctx)
	if err != nil {
		return nil, err
	}
	discovered := local.Discover(ctx, discoveryWindow)
	logger.Info("tuya sync", "cloud_devices", len(infos), "discovered_on_lan", len(discovered))

	// Last-known LAN ip/version/key survive a sync where discovery (UDP
	// broadcast) sees nothing — e.g. when the server is not on the device's L2
	// segment but can still reach it by unicast.
	stored := make(map[string]store.TuyaDevice)
	if prev, err := a.store.ListTuyaDevices(ctx); err == nil {
		for _, d := range prev {
			stored[d.DeviceID] = d
		}
	}

	out := make([]device.Device, 0, len(infos))
	for _, info := range infos {
		functions, err := a.client.DeviceFunctions(ctx, info.ID)
		if err != nil {
			logger.Warn("failed to fetch tuya functions", "device_id", info.ID, "error", err)
		}
		key, productID, err := a.client.DeviceLocalKey(ctx, info.ID)
		if err != nil {
			logger.Warn("failed to fetch tuya local key", "device_id", info.ID, "error", err)
		}
		if productID == "" {
			productID = info.ProductID
		}

		ip := discovered[info.ID].IP
		ver := discovered[info.ID].Version
		prev := stored[info.ID]
		if ip == "" {
			ip, ver = prev.LANIP, prev.ProtocolVersion
		}
		if key == "" {
			key = prev.LocalKey
		}

		dev := mapDevice(info, functions)
		dev.Capabilities = augmentCapabilities(dev.Capabilities, productID)
		a.writer.Register(dev)
		// Sync runs on a poll loop, so only the first sighting is an addition;
		// afterwards nothing is published unless an adapter-owned field moved.
		print := device.AdapterFingerprint(dev)
		a.mu.Lock()
		prevPrint, wasKnown := a.knownDevices[dev.ID]
		a.knownDevices[dev.ID] = print
		a.mu.Unlock()
		switch {
		case !wasKnown:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceAdded,
				DeviceID:  string(dev.ID),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		case prevPrint != print:
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceSynced,
				DeviceID:  string(dev.ID),
				Timestamp: time.Now(),
				Payload:   dev,
			})
		}
		out = append(out, dev)

		logger.Debug("tuya device resolved", "device_id", info.ID, "name", dev.Name,
			"lan_ip", ip, "version", ver, "have_key", key != "",
			"ip_from", ipSource(discovered[info.ID].IP, prev.LANIP))

		cr := store.TuyaDevice{
			DeviceID:        info.ID,
			LocalKey:        key,
			ProtocolVersion: ver,
			LANIP:           ip,
			ProductID:       productID,
		}
		if err := a.store.UpsertTuyaDevice(ctx, cr); err != nil {
			logger.Warn("failed to persist tuya device", "device_id", info.ID, "error", err)
		}
		a.mu.Lock()
		a.creds[device.DeviceID(info.ID)] = cr
		a.mu.Unlock()
	}
	return out, nil
}

func ipSource(discoveredIP, storedIP string) string {
	switch {
	case discoveredIP != "":
		return "discovery"
	case storedIP != "":
		return "stored"
	default:
		return "none"
	}
}

func (a *Adapter) startConn(ctx context.Context, id device.DeviceID, cr store.TuyaDevice) {
	if cr.LANIP == "" || cr.LocalKey == "" {
		logger.Warn("tuya device not locally reachable; skipping", "device_id", id,
			"have_ip", cr.LANIP != "", "have_key", cr.LocalKey != "")
		a.setAvailability(id, false)
		return
	}
	c := &conn{productID: cr.ProductID, cmds: make(chan localCommand)}
	a.mu.Lock()
	a.conns[id] = c
	a.mu.Unlock()
	a.wg.Add(1)
	go a.runConn(ctx, id, cr, c)
}

func (a *Adapter) runConn(ctx context.Context, id device.DeviceID, cr store.TuyaDevice, c *conn) {
	defer a.wg.Done()
	backoff := time.Second
	for ctx.Err() == nil {
		dev := local.NewDevice(string(id), cr.LANIP, cr.LocalKey, cr.ProtocolVersion)
		if err := dev.Connect(connectTimeout); err != nil {
			logger.Warn("tuya local connect failed", "device_id", id, "error", err)
			a.setAvailability(id, false)
			if !sleepCtx(ctx, backoff) {
				return
			}
			backoff = nextBackoff(backoff)
			continue
		}
		logger.Info("tuya local connection established", "device_id", id, "ip", cr.LANIP, "version", cr.ProtocolVersion)
		a.setAvailability(id, true)
		backoff = time.Second
		_ = dev.SendStatusQuery()

		dpsCh := make(chan map[string]any, 8)
		readErr := make(chan struct{})
		go func() {
			defer close(readErr)
			for {
				dps, err := dev.ReadMessage(readTimeout)
				if err != nil {
					return
				}
				if dps != nil {
					select {
					case dpsCh <- dps:
					default:
					}
				}
			}
		}()

		ticker := time.NewTicker(heartbeatEvery)
		for live := true; live; {
			select {
			case <-ctx.Done():
				live = false
			case <-readErr:
				live = false
			case dps := <-dpsCh:
				a.publishLocalState(id, dps, c.productID)
			case command := <-c.cmds:
				err := dev.SendControl(command.dps)
				if err != nil {
					logger.Warn("tuya local control failed", "device_id", id, "error", err)
				}
				command.result <- err
			case <-ticker.C:
				if err := dev.SendHeartbeat(); err != nil {
					live = false
				}
			}
		}
		ticker.Stop()
		_ = dev.Close()
		a.setAvailability(id, false)
		if !sleepCtx(ctx, backoff) {
			return
		}
		backoff = nextBackoff(backoff)
	}
}

// DispatchState serializes one command through the device's persistent LAN connection.
func (a *Adapter) DispatchState(ctx context.Context, command device.Command) error {
	dev, found := a.reader.GetDevice(command.DeviceID)
	if !found || dev.RuntimeDisabled() || dev.Source != device.SourceTuya {
		return fmt.Errorf("device %q is not writable through Tuya", command.DeviceID)
	}
	a.mu.Lock()
	connection := a.conns[command.DeviceID]
	a.mu.Unlock()
	if connection == nil {
		return fmt.Errorf("device %q has no Tuya LAN connection", command.DeviceID)
	}
	dps := commandToDPS(command, connection.productID)
	if len(dps) == 0 {
		return fmt.Errorf("command for device %q produced no Tuya data points", command.DeviceID)
	}
	result := make(chan error, 1)
	request := localCommand{dps: dps, result: result}
	select {
	case connection.cmds <- request:
	case <-ctx.Done():
		return ctx.Err()
	}
	select {
	case err := <-result:
		return err
	case <-ctx.Done():
		return ctx.Err()
	}
}

// DispatchGroupState reports that Tuya has no provider-group multicast path.
func (a *Adapter) DispatchGroupState(context.Context, device.ProviderGroupCommand) error {
	return errors.New("Tuya provider groups are unavailable")
}

// DispatchConfiguration reports that Tuya configuration writes are unavailable.
func (a *Adapter) DispatchConfiguration(context.Context, device.ConfigurationRequest) error {
	return errors.New("Tuya device configuration is unavailable")
}

// DispatchNativeEffect reports that Tuya native effects are unavailable.
func (a *Adapter) DispatchNativeEffect(context.Context, device.NativeEffectRequest) error {
	return errors.New("Tuya native effects are unavailable")
}

func (a *Adapter) publishLocalState(id device.DeviceID, dps map[string]any, productID string) {
	state := localDPSToState(dps, productID)
	a.mu.Lock()
	observer := a.observer
	a.mu.Unlock()
	observation := device.OutputObservation{Transition: state.Transition}
	if observer != nil {
		observation = observer.ObserveState(id, state)
	}
	a.writer.UpdateDeviceState(id, state)
	reported := state
	reported.Transition = observation.Transition
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   device.DeviceStateChange{State: reported, Origin: observation.Origin},
	})
}

// setAvailability records availability and publishes a change only on a
// transition, so steady state does not flood the activity log.
func (a *Adapter) setAvailability(id device.DeviceID, online bool) {
	dev, found := a.reader.GetDevice(id)
	a.writer.SetAvailability(id, online)
	if found && dev.Available == online {
		return
	}
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceAvailabilityChanged,
		DeviceID:  string(id),
		Timestamp: time.Now(),
		Payload:   online,
	})
}

func sleepCtx(ctx context.Context, d time.Duration) bool {
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}

func nextBackoff(d time.Duration) time.Duration {
	d *= 2
	if d > maxReconnectWait {
		return maxReconnectWait
	}
	return d
}
