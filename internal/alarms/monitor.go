package alarms

import (
	"context"
	"fmt"
	"log/slog"
	"runtime"
	"syscall"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// MVP thresholds. Hardcoded until product needs prove otherwise; exported
// only for tests to override (rare).
const (
	DiskFreeThreshold    = 0.10              // raise when free fraction falls below this
	HeapBytesThreshold   = 500 * 1024 * 1024 // 500 MiB
	DeviceStaleAfter     = 30 * time.Minute  // device considered unavailable after this
	BatteryLowThreshold  = 15.0              // percentage
	monitorTickInterval  = 30 * time.Second
	monitorStartupSettle = 60 * time.Second // give boot time before first tick
)

// MonitorSource is the Source value stamped on every alarm raised by the
// health monitor. It is also the filter key the monitor uses to decide which
// alarms it owns; any alarm with a different Source (e.g. automation-raised
// one-shots or API-raised alarms) is invisible to the monitor's clear loop.
const MonitorSource = "system.monitor"

// ConnectivityProbe reports the liveness of external dependencies the monitor
// watches. adapterManager in cmd/serve satisfies this.
type ConnectivityProbe interface {
	MQTTConnected() bool
}

// MonitorConfig lets callers override the default thresholds or paths for
// test. Zero values fall back to the package defaults.
type MonitorConfig struct {
	TickInterval  time.Duration
	StartupSettle time.Duration
	DiskStatPath  string // defaults to "." which resolves to the DB working dir
	DiskStatFn    func(path string) (freeFraction float64, err error)
	HeapFn        func() uint64
}

// RunMonitor blocks until ctx is cancelled, evaluating health checks on a
// ticker. The monitor is idempotent per tick: it raises an alarm only when
// the condition is active AND no monitor-owned alarm with that ID is already
// in the DB, and it clears monitor-owned alarms whose condition has
// resolved. The counter on an existing alarm is never bumped by the monitor
// — the Count field is reserved for non-loop callers (API / automation
// actions) that legitimately raise the same alarm repeatedly.
func RunMonitor(ctx context.Context, svc *Service, reader device.StateReader, probe ConnectivityProbe) {
	runMonitor(ctx, svc, reader, probe, MonitorConfig{})
}

func runMonitor(ctx context.Context, svc *Service, reader device.StateReader, probe ConnectivityProbe, cfg MonitorConfig) {
	tick := cfg.TickInterval
	if tick <= 0 {
		tick = monitorTickInterval
	}
	settle := cfg.StartupSettle
	if settle <= 0 {
		settle = monitorStartupSettle
	}
	diskPath := cfg.DiskStatPath
	if diskPath == "" {
		diskPath = "."
	}
	diskFn := cfg.DiskStatFn
	if diskFn == nil {
		diskFn = diskFreeFraction
	}
	heapFn := cfg.HeapFn
	if heapFn == nil {
		heapFn = heapAllocBytes
	}

	timer := time.NewTimer(settle)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return
	case <-timer.C:
	}

	evaluateAndApply(ctx, svc, reader, probe, diskPath, diskFn, heapFn)

	ticker := time.NewTicker(tick)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			evaluateAndApply(ctx, svc, reader, probe, diskPath, diskFn, heapFn)
		}
	}
}

// check describes a single health signal. If active is true the alarm
// should be present in the DB; otherwise it should not. raise holds the
// parameters to pass to Service.Raise when active=true and no monitor-owned
// alarm with this ID exists yet.
type check struct {
	alarmID string
	active  bool
	raise   RaiseParams // populated when active=true
}

func evaluateAndApply(
	ctx context.Context,
	svc *Service,
	reader device.StateReader,
	probe ConnectivityProbe,
	diskPath string,
	diskFn func(string) (float64, error),
	heapFn func() uint64,
) {
	checks := collectChecks(reader, probe, diskPath, diskFn, heapFn)

	// The DB is the single source of truth. Scoping by MonitorSource ensures
	// the monitor can never observe, bump, or clear an alarm it did not
	// raise itself — one-shot alarms from automations and API-raised alarms
	// live under different Source values.
	owned, err := svc.ActiveAlarmIDsBySource(ctx, MonitorSource)
	if err != nil {
		logger.Error("monitor: failed to list owned alarms", slog.String("error", err.Error()))
		return
	}

	thisActive := make(map[string]struct{}, len(checks))
	for _, c := range checks {
		if !c.active {
			continue
		}
		thisActive[c.alarmID] = struct{}{}
		if _, alreadyRaised := owned[c.alarmID]; alreadyRaised {
			continue // already raised — never bump Count from a monitor tick
		}
		if _, err := svc.Raise(ctx, c.raise); err != nil {
			logger.Error("monitor: raise failed", slog.String("alarm_id", c.alarmID), slog.String("error", err.Error()))
		}
	}

	for id := range owned {
		if _, stillActive := thisActive[id]; stillActive {
			continue
		}
		if _, err := svc.DeleteByAlarmID(ctx, id); err != nil {
			logger.Error("monitor: clear failed", slog.String("alarm_id", id), slog.String("error", err.Error()))
		}
	}
}

// collectChecks evaluates every MVP check once. Never returns an error — a
// check that can't be evaluated (e.g. Statfs fails) is logged and skipped so
// one bad probe doesn't silence the others.
func collectChecks(
	reader device.StateReader,
	probe ConnectivityProbe,
	diskPath string,
	diskFn func(string) (float64, error),
	heapFn func() uint64,
) []check {
	var checks []check

	if free, err := diskFn(diskPath); err != nil {
		logger.Warn("monitor: disk stat failed", slog.String("error", err.Error()))
	} else {
		checks = append(checks, check{
			alarmID: "system.disk_low",
			active:  free < DiskFreeThreshold,
			raise: RaiseParams{
				AlarmID:  "system.disk_low",
				Severity: store.AlarmSeverityHigh,
				Kind:     store.AlarmKindAuto,
				Message:  fmt.Sprintf("Disk free space is %.1f%%, below %.0f%% threshold", free*100, DiskFreeThreshold*100),
				Source:   MonitorSource,
			},
		})
	}

	heapBytes := heapFn()
	checks = append(checks, check{
		alarmID: "system.memory_high",
		active:  heapBytes > HeapBytesThreshold,
		raise: RaiseParams{
			AlarmID:  "system.memory_high",
			Severity: store.AlarmSeverityMedium,
			Kind:     store.AlarmKindAuto,
			Message:  fmt.Sprintf("Go heap allocation is %d MiB, above %d MiB threshold", heapBytes/1024/1024, HeapBytesThreshold/1024/1024),
			Source:   MonitorSource,
		},
	})

	if probe != nil {
		checks = append(checks, check{
			alarmID: "system.mqtt_disconnected",
			active:  !probe.MQTTConnected(),
			raise: RaiseParams{
				AlarmID:  "system.mqtt_disconnected",
				Severity: store.AlarmSeverityHigh,
				Kind:     store.AlarmKindAuto,
				Message:  "MQTT broker is disconnected",
				Source:   MonitorSource,
			},
		})
	}

	if reader != nil {
		now := time.Now()
		for _, d := range reader.ListDevices() {
			if d.Removed {
				continue
			}
			// Raise only when both signals agree: zigbee2mqtt's availability
			// ping has failed AND we have not received any state from the
			// device recently. Either on its own is too noisy — an idle
			// light can have a stale LastSeen while z2m happily confirms
			// it, and a single missed availability ping shouldn't alarm
			// for a device that is still emitting state.
			staleLastSeen := d.LastSeen.IsZero() || now.Sub(d.LastSeen) > DeviceStaleAfter
			stale := !d.Available && staleLastSeen
			alarmID := fmt.Sprintf("system.device_unavailable.%s", string(d.ID))
			checks = append(checks, check{
				alarmID: alarmID,
				active:  stale,
				raise: RaiseParams{
					AlarmID:  alarmID,
					Severity: store.AlarmSeverityMedium,
					Kind:     store.AlarmKindAuto,
					Message:  fmt.Sprintf("Device %q has not reported recently", d.Name),
					Source:   MonitorSource,
				},
			})

			if ss, ok := reader.GetDeviceState(d.ID); ok && ss != nil && ss.Battery != nil && *ss.Battery < BatteryLowThreshold {
				batteryID := fmt.Sprintf("system.battery_low.%s", string(d.ID))
				checks = append(checks, check{
					alarmID: batteryID,
					active:  true,
					raise: RaiseParams{
						AlarmID:  batteryID,
						Severity: store.AlarmSeverityLow,
						Kind:     store.AlarmKindAuto,
						Message:  fmt.Sprintf("Device %q battery is %.0f%%", d.Name, *ss.Battery),
						Source:   MonitorSource,
					},
				})
			} else {
				batteryID := fmt.Sprintf("system.battery_low.%s", string(d.ID))
				checks = append(checks, check{alarmID: batteryID, active: false})
			}
		}
	}

	return checks
}

func diskFreeFraction(path string) (float64, error) {
	var stat syscall.Statfs_t
	if err := syscall.Statfs(path, &stat); err != nil {
		return 0, err
	}
	total := stat.Blocks
	if total == 0 {
		return 0, fmt.Errorf("disk total blocks is zero")
	}
	return float64(stat.Bavail) / float64(total), nil
}

func heapAllocBytes() uint64 {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	return m.HeapAlloc
}
