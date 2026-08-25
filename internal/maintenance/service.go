package maintenance

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/saffronjam/saffron-hive/internal/zigbeemetadata"
)

// Store is the persistence surface used by the maintenance service.
type Store interface {
	ListMaintenanceAcknowledgements(context.Context) ([]store.MaintenanceAcknowledgement, error)
	InsertMaintenanceAcknowledgements(context.Context, []store.InsertMaintenanceAcknowledgementParams) error
	ResetMaintenanceAcknowledgements(context.Context, string) error
	DeleteMaintenanceAcknowledgementFingerprints(context.Context, string, []string) error
	ListZigbeeFirmwareCandidates(context.Context) ([]zigbeemetadata.Metadata, error)
	GetZigbee2MQTTConfig(context.Context) (*store.Zigbee2MQTTConfig, error)
}

// DiskProbe reports free disk fraction for a path.
type DiskProbe func(string) (float64, error)

// Service owns the derived snapshot and durable completions.
type Service struct {
	store    Store
	reader   device.StateReader
	buffer   *Buffer
	diskPath string
	disk     DiskProbe
	now      func() time.Time

	mu    sync.RWMutex
	tasks []Task
}

// NewService wires the maintenance service.
func NewService(s Store, reader device.StateReader, buffer *Buffer, diskPath string, disk DiskProbe) *Service {
	return &Service{store: s, reader: reader, buffer: buffer, diskPath: diskPath, disk: disk, now: time.Now}
}

// Snapshot returns an immutable, deterministic copy of visible tasks.
func (s *Service) Snapshot() []Task {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return cloneTasks(s.tasks)
}

// Evaluate refreshes every derivation source while retaining a source's last valid tasks on failure.
func (s *Service) Evaluate(ctx context.Context) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.evaluateLocked(ctx)
}

// Complete atomically acknowledges active IDs and returns the IDs accepted.
func (s *Service) Complete(ctx context.Context, ids []string, userID string) ([]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	active := make(map[string]Task, len(s.tasks))
	for _, task := range s.tasks {
		active[task.ID] = task
	}
	seen := map[string]struct{}{}
	accepted := make([]string, 0, len(ids))
	rows := make([]store.InsertMaintenanceAcknowledgementParams, 0, len(ids))
	completedAt := s.now()
	for _, id := range ids {
		task, ok := active[id]
		if !ok {
			continue
		}
		if _, duplicate := seen[id]; duplicate {
			continue
		}
		seen[id] = struct{}{}
		accepted = append(accepted, id)
		rows = append(rows, store.InsertMaintenanceAcknowledgementParams{
			TaskKey: task.TaskKey, ConditionFingerprint: task.ConditionFingerprint,
			CompletedAt: completedAt, CompletedBy: &userID,
		})
	}
	if len(rows) == 0 {
		return []string{}, nil
	}
	if err := s.store.InsertMaintenanceAcknowledgements(ctx, rows); err != nil {
		return nil, err
	}
	if err := s.evaluateLocked(ctx); err != nil {
		remaining := s.tasks[:0]
		for _, task := range s.tasks {
			if _, remove := seen[task.ID]; !remove {
				remaining = append(remaining, task)
			}
		}
		s.setTasksLocked(remaining)
	}
	return accepted, nil
}

func (s *Service) evaluateLocked(ctx context.Context) error {
	ackRows, err := s.store.ListMaintenanceAcknowledgements(ctx)
	if err != nil {
		return fmt.Errorf("list acknowledgements: %w", err)
	}
	acks := acknowledgementsByKey(ackRows)
	tasks := make([]Task, 0)
	deviceTasks, err := s.deriveDeviceTasks(ctx, acks)
	if err != nil {
		return err
	}
	tasks = append(tasks, deviceTasks...)

	firmware, firmwareErr := s.deriveFirmwareTasks(ctx, acks)
	if firmwareErr != nil {
		tasks = append(tasks, tasksOfKind(s.tasks, KindFirmware)...)
	} else {
		tasks = append(tasks, firmware...)
	}
	storage, storageErr := s.deriveStorageTask(ctx, acks)
	if storageErr != nil {
		tasks = append(tasks, tasksOfKind(s.tasks, KindStorage)...)
	} else if storage != nil {
		tasks = append(tasks, *storage)
	}
	sortTasks(tasks)
	s.setTasksLocked(tasks)
	if firmwareErr != nil {
		return firmwareErr
	}
	return storageErr
}

func (s *Service) deriveDeviceTasks(ctx context.Context, acks map[string]map[string]struct{}) ([]Task, error) {
	if s.reader == nil {
		return nil, nil
	}
	var tasks []Task
	for _, found := range s.reader.ListDevices() {
		if found.Removed || found.RuntimeDisabled() {
			continue
		}
		state, _ := s.reader.GetDeviceState(found.ID)
		if state == nil {
			continue
		}
		batteryKey := "battery:" + string(found.ID)
		if state.Battery != nil {
			if *state.Battery >= 50 && len(acks[batteryKey]) > 0 {
				if err := s.store.ResetMaintenanceAcknowledgements(ctx, batteryKey); err != nil {
					return nil, err
				}
				delete(acks, batteryKey)
			}
			if band := batteryBand(*state.Battery); band != 0 && !bandAcknowledged(acks[batteryKey], band) {
				value := fmt.Sprintf("%.0f%%", *state.Battery)
				tasks = append(tasks, newTask(batteryKey, "band:"+strconv.Itoa(band), KindBattery,
					"Replace battery", fmt.Sprintf("%s battery is %s", found.DisplayName(), value),
					"Replace or recharge the battery", &found, &value, nil, deviceURL(found.ID)))
			}
		}

		postureKey := "posture:" + string(found.ID)
		abnormal := state.DevicePosture != nil && *state.DevicePosture == "abnormal"
		if !abnormal && len(acks[postureKey]) > 0 {
			if err := s.store.ResetMaintenanceAcknowledgements(ctx, postureKey); err != nil {
				return nil, err
			}
			delete(acks, postureKey)
		}
		if abnormal {
			fingerprint := "abnormal"
			if _, done := acks[postureKey][fingerprint]; !done {
				value := "Abnormal"
				tasks = append(tasks, newTask(postureKey, fingerprint, KindPosture,
					"Correct sensor placement", fmt.Sprintf("%s reports abnormal posture", found.DisplayName()),
					"Correct the sensor placement", &found, &value, nil, deviceURL(found.ID)))
			}
		}
	}
	return tasks, nil
}

func (s *Service) deriveFirmwareTasks(ctx context.Context, acks map[string]map[string]struct{}) ([]Task, error) {
	metadata, err := s.store.ListZigbeeFirmwareCandidates(ctx)
	if err != nil {
		return nil, fmt.Errorf("list firmware candidates: %w", err)
	}
	config, err := s.store.GetZigbee2MQTTConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("get zigbee2mqtt config: %w", err)
	}
	var tasks []Task
	for _, item := range metadata {
		if item.OTA.LatestVersion == nil || *item.OTA.LatestVersion == -1 || item.OTA.State == nil || !strings.EqualFold(*item.OTA.State, "available") {
			continue
		}
		found, ok := s.reader.GetDevice(item.DeviceID)
		if !ok || found.Removed || found.RuntimeDisabled() {
			continue
		}
		latest := strconv.FormatInt(*item.OTA.LatestVersion, 10)
		fingerprint := "version:" + latest
		key := "firmware:" + string(item.DeviceID)
		if _, done := acks[key][fingerprint]; done {
			continue
		}
		var current *string
		if item.OTA.InstalledVersion != nil && *item.OTA.InstalledVersion != -1 {
			value := strconv.FormatInt(*item.OTA.InstalledVersion, 10)
			current = &value
		}
		var actionURL *string
		if config != nil && config.FrontendURL != nil {
			value := strings.TrimRight(*config.FrontendURL, "/") + "/#/device/0/" + url.PathEscape(string(item.DeviceID)) + "/info"
			actionURL = &value
		}
		detail := fmt.Sprintf("Firmware %s is available for %s", latest, found.DisplayName())
		tasks = append(tasks, newTask(key, fingerprint, KindFirmware, "Upgrade firmware", detail,
			"Upgrade in Zigbee2MQTT", &found, current, &latest, actionURL))
	}
	return tasks, nil
}

func (s *Service) deriveStorageTask(ctx context.Context, acks map[string]map[string]struct{}) (*Task, error) {
	if s.disk == nil {
		return nil, nil
	}
	free, err := s.disk(s.diskPath)
	if err != nil {
		return nil, fmt.Errorf("measure data storage: %w", err)
	}
	key := "storage:data"
	if free >= 0.12 && len(acks[key]) > 0 {
		if err := s.store.ResetMaintenanceAcknowledgements(ctx, key); err != nil {
			return nil, err
		}
		delete(acks, key)
	}
	band := storageBand(free)
	if band == 0 || bandAcknowledged(acks[key], band) {
		return nil, nil
	}
	value := fmt.Sprintf("%.1f%% free", free*100)
	detail := fmt.Sprintf("%s has %s", s.diskPath, value)
	task := newTask(key, "band:"+strconv.Itoa(band), KindStorage, "Free storage space", detail,
		"Free storage space", nil, &value, nil, nil)
	return &task, nil
}

func (s *Service) setTasksLocked(tasks []Task) {
	if reflect.DeepEqual(s.tasks, tasks) {
		return
	}
	s.tasks = cloneTasks(tasks)
	s.buffer.Publish(s.now())
}

func newTask(key, fingerprint string, kind Kind, title, detail, action string, found *device.Device, current, target, actionURL *string) Task {
	return Task{ID: opaqueID(key, fingerprint), TaskKey: key, ConditionFingerprint: fingerprint,
		Kind: kind, Title: title, Detail: detail, Action: action, Device: found,
		CurrentValue: current, TargetValue: target, ActionURL: actionURL}
}

func opaqueID(key, fingerprint string) string {
	sum := sha256.Sum256([]byte(key + "\x00" + fingerprint))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func acknowledgementsByKey(rows []store.MaintenanceAcknowledgement) map[string]map[string]struct{} {
	out := make(map[string]map[string]struct{})
	for _, row := range rows {
		if out[row.TaskKey] == nil {
			out[row.TaskKey] = map[string]struct{}{}
		}
		out[row.TaskKey][row.ConditionFingerprint] = struct{}{}
	}
	return out
}

func batteryBand(value float64) int {
	switch {
	case value <= 10:
		return 10
	case value <= 20:
		return 20
	case value <= 25:
		return 25
	default:
		return 0
	}
}

func storageBand(free float64) int {
	switch {
	case free < 0.02:
		return 2
	case free < 0.05:
		return 5
	case free < 0.10:
		return 10
	default:
		return 0
	}
}

func bandAcknowledged(acks map[string]struct{}, current int) bool {
	for fingerprint := range acks {
		value, err := strconv.Atoi(strings.TrimPrefix(fingerprint, "band:"))
		if err == nil && value <= current {
			return true
		}
	}
	return false
}

func deviceURL(id device.DeviceID) *string {
	value := "/devices/" + string(id)
	return &value
}

func tasksOfKind(tasks []Task, kind Kind) []Task {
	var out []Task
	for _, task := range tasks {
		if task.Kind == kind {
			out = append(out, task)
		}
	}
	return out
}

func sortTasks(tasks []Task) {
	rank := map[Kind]int{KindBattery: 0, KindFirmware: 1, KindPosture: 2, KindStorage: 3}
	sort.Slice(tasks, func(i, j int) bool {
		if rank[tasks[i].Kind] != rank[tasks[j].Kind] {
			return rank[tasks[i].Kind] < rank[tasks[j].Kind]
		}
		left, right := tasks[i].Detail, tasks[j].Detail
		if left == right {
			return tasks[i].ID < tasks[j].ID
		}
		return left < right
	})
}

func cloneTasks(tasks []Task) []Task {
	out := append([]Task(nil), tasks...)
	for i := range out {
		if out[i].Device != nil {
			copy := *out[i].Device
			out[i].Device = &copy
		}
	}
	return out
}
