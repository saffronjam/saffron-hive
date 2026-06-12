package tuya

import (
	"context"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/logging"
)

var logger = logging.Named("tuya")

type Adapter struct {
	client *CloudClient
	bus    eventbus.EventBus
	reader device.StateReader

	pollInterval time.Duration
	stopCh       chan struct{}
	cmdCh        <-chan eventbus.Event
	wg           sync.WaitGroup
}

func NewAdapter(client *CloudClient, bus eventbus.EventBus, reader device.StateReader) *Adapter {
	return &Adapter{
		client:       client,
		bus:          bus,
		reader:       reader,
		pollInterval: 30 * time.Second,
		stopCh:       make(chan struct{}),
	}
}

func (a *Adapter) Start(ctx context.Context) error {
	if _, err := a.Sync(ctx); err != nil {
		return err
	}
	a.cmdCh = a.bus.Subscribe(eventbus.EventCommandRequested)
	a.wg.Add(2)
	go a.commandLoop(ctx)
	go a.pollLoop(ctx)
	return nil
}

func (a *Adapter) Stop() {
	close(a.stopCh)
	if a.cmdCh != nil {
		a.bus.Unsubscribe(a.cmdCh)
	}
	a.wg.Wait()
}

func (a *Adapter) Sync(ctx context.Context) ([]device.Device, error) {
	infos, err := a.client.ListDevices(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]device.Device, 0, len(infos))
	for _, info := range infos {
		functions, err := a.client.DeviceFunctions(ctx, info.ID)
		if err != nil {
			logger.Warn("failed to fetch tuya functions", "device_id", info.ID, "error", err)
			continue
		}
		dev := mapDevice(info, functions)
		out = append(out, dev)
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceAdded,
			DeviceID:  string(dev.ID),
			Timestamp: time.Now(),
			Payload:   dev,
		})
		status, err := a.client.DeviceStatus(ctx, info.ID)
		if err != nil {
			logger.Warn("failed to fetch tuya status", "device_id", info.ID, "error", err)
			continue
		}
		a.publishState(info.ID, mapState(status))
	}
	return out, nil
}

func (a *Adapter) commandLoop(ctx context.Context) {
	defer a.wg.Done()
	for {
		select {
		case <-a.stopCh:
			return
		case <-ctx.Done():
			return
		case evt, ok := <-a.cmdCh:
			if !ok {
				return
			}
			cmd, ok := evt.Payload.(device.Command)
			if !ok {
				continue
			}
			dev, found := a.reader.GetDevice(cmd.DeviceID)
			if !found || dev.Source != Source {
				continue
			}
			commands := commandsFor(cmd)
			if len(commands) == 0 {
				continue
			}
			if err := a.client.SendCommands(ctx, string(cmd.DeviceID), commands); err != nil {
				logger.Error("failed to send tuya command", "device_id", cmd.DeviceID, "error", err)
				continue
			}
			status, err := a.client.DeviceStatus(ctx, string(cmd.DeviceID))
			if err != nil {
				logger.Warn("failed to refresh tuya state after command", "device_id", cmd.DeviceID, "error", err)
				continue
			}
			a.publishState(string(cmd.DeviceID), mapState(status))
		}
	}
}

func (a *Adapter) pollLoop(ctx context.Context) {
	defer a.wg.Done()
	timer := time.NewTimer(a.pollInterval)
	defer timer.Stop()
	for {
		select {
		case <-a.stopCh:
			return
		case <-ctx.Done():
			return
		case <-timer.C:
			a.poll(ctx)
			timer.Reset(a.pollInterval)
		}
	}
}

func (a *Adapter) poll(ctx context.Context) {
	for _, dev := range a.reader.ListDevices() {
		if dev.Source != Source {
			continue
		}
		status, err := a.client.DeviceStatus(ctx, string(dev.ID))
		if err != nil {
			logger.Warn("failed to poll tuya device", "device_id", dev.ID, "error", err)
			a.bus.Publish(eventbus.Event{
				Type:      eventbus.EventDeviceAvailabilityChanged,
				DeviceID:  string(dev.ID),
				Timestamp: time.Now(),
				Payload:   false,
			})
			continue
		}
		a.bus.Publish(eventbus.Event{
			Type:      eventbus.EventDeviceAvailabilityChanged,
			DeviceID:  string(dev.ID),
			Timestamp: time.Now(),
			Payload:   true,
		})
		a.publishState(string(dev.ID), mapState(status))
	}
}

func (a *Adapter) publishState(deviceID string, state device.DeviceState) {
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventDeviceStateChanged,
		DeviceID:  deviceID,
		Timestamp: time.Now(),
		Payload: device.DeviceStateChange{
			State: state,
		},
	})
}
