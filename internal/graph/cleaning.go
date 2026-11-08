package graph

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/adapter/dreame"
	"github.com/saffronjam/saffron-hive/internal/cleaning"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/vektah/gqlparser/v2/gqlerror"
)

func mapDreameConfig(cfg *store.DreameConfig) *model.DreameConfig {
	if cfg == nil {
		return nil
	}
	secret := ""
	if cfg.Password != "" {
		secret = redactedPasswordSentinel
	}
	return &model.DreameConfig{Revision: int(cfg.Revision), Email: cfg.Email, Password: secret, Region: cfg.Region, Enabled: cfg.Enabled}
}
func (r *Resolver) dreameConfigInput(ctx context.Context, input model.DreameConfigInput) (store.DreameConfig, error) {
	cfg := store.DreameConfig{Email: strings.TrimSpace(input.Email), Password: input.Password, Region: strings.ToLower(strings.TrimSpace(input.Region)), Enabled: input.Enabled}
	if cfg.Password == redactedPasswordSentinel {
		existing, err := r.Store.GetDreameConfig(ctx)
		if err != nil {
			return cfg, err
		}
		cfg.Password = ""
		if existing != nil {
			cfg.Password = existing.Password
		}
	}
	if _, err := dreame.NewSession(dreame.Credentials{Email: cfg.Email, Password: cfg.Password, Region: cfg.Region}); err != nil {
		return cfg, err
	}
	return cfg, nil
}
func cleaningOptions(input *model.CleaningOptionsInput) cleaning.Options {
	if input == nil {
		return cleaning.Options{Repeats: 1}
	}
	repeat := 1
	if input.Repeats.Value() != nil {
		repeat = *input.Repeats.Value()
	}
	return cleaning.Options{Suction: input.Suction.Value(), Water: input.Water.Value(), Repeats: repeat}
}
func mapCleaningPlan(plan cleaning.Plan) *model.CleaningPlan {
	return &model.CleaningPlan{Scope: mapCleaningScope(plan.Scope), DeviceID: plan.DeviceID, MapID: plan.MapID, RoomIds: plan.RoomIDs, AreaIds: plan.AreaIDs, Revision: plan.Revision, Options: &model.CleaningOptions{Suction: plan.Options.Suction, Water: plan.Options.Water, Repeats: plan.Options.Repeats}}
}
func mapCleaningTask(task *cleaning.Task) *model.CleaningTask {
	if task == nil {
		return nil
	}
	rooms := append([]string{}, task.Plan.RoomIDs...)
	return &model.CleaningTask{Scope: mapCleaningScope(task.Plan.Scope), ID: task.ID, DeviceID: task.DeviceID, MapID: task.Plan.MapID, RoomIds: rooms, State: string(task.State), Origin: task.Origin, ElapsedMinutes: task.ElapsedMinutes, CleanedArea: task.CleanedArea, Error: optionalString(task.Error), CreatedAt: task.CreatedAt, UpdatedAt: task.UpdatedAt, CompletedAt: task.CompletedAt}
}
func mapCleaningLinks(links []cleaning.RoomLinks) []*model.CleaningRoomLinks {
	result := make([]*model.CleaningRoomLinks, 0, len(links))
	for _, set := range links {
		item := &model.CleaningRoomLinks{MapID: set.MapID, MapRevision: set.MapRevision, Revision: int(set.Revision), Links: []*model.CleaningRoomLink{}}
		for _, link := range set.Links {
			item.Links = append(item.Links, &model.CleaningRoomLink{RoomID: link.RoomID, AreaID: link.AreaID})
		}
		result = append(result, item)
	}
	return result
}
func (r *Resolver) mapCleaningDevice(ctx context.Context, snap cleaning.Snapshot) (*model.CleaningDevice, error) {
	result := &model.CleaningDevice{DeviceID: snap.DeviceID, Supported: snap.Supported, Status: string(snap.Status), Battery: snap.Battery, Suction: snap.Suction, Water: snap.Water, ElapsedMinutes: snap.ElapsedMinutes, CleanedArea: snap.CleanedArea, Progress: snap.Progress, UpdatedAt: snap.UpdatedAt, LiveAt: snap.LiveAt, Error: optionalString(snap.Error), MapError: optionalString(snap.MapError), Maps: []*model.CleaningMap{}, Consumables: []*model.CleaningConsumable{}}
	result.Model = optionalString(snap.Model)
	result.ModelID = optionalString(snap.ModelID)
	result.Manufacturer = optionalString(snap.Manufacturer)
	if snap.ActiveMapID != 0 {
		id := strconv.Itoa(snap.ActiveMapID)
		result.ActiveMapID = &id
	}
	for _, m := range snap.Maps {
		result.Maps = append(result.Maps, mapCleaningMap(m))
	}
	if snap.LiveMap != nil {
		result.LiveMap = mapCleaningMap(*snap.LiveMap)
	}
	for _, c := range snap.Consumables {
		result.Consumables = append(result.Consumables, &model.CleaningConsumable{Name: c.Name, Percent: c.Percent, Resettable: c.Resettable})
	}
	task, err := r.Cleaning.ActiveTask(ctx, snap.DeviceID)
	if err != nil {
		return nil, err
	}
	result.ActiveTask = mapCleaningTask(task)
	found, ok := r.StateReader.GetDevice(device.DeviceID(snap.DeviceID))
	result.Controls = []*model.CleaningControl{}
	for _, control := range cleaning.Controls(snap, task, ok && found.Available && !found.RuntimeDisabled() && !found.Removed) {
		result.Controls = append(result.Controls, &model.CleaningControl{Action: model.CleaningAction(strings.ToUpper(string(control.Action))), Enabled: control.Enabled})
	}
	result.EstimatedProgress, err = r.Cleaning.EstimatedProgress(ctx, snap, task)
	if err != nil {
		return nil, err
	}
	links, err := r.Cleaning.Links(ctx, snap.DeviceID)
	if err != nil {
		return nil, err
	}
	result.RoomLinks = mapCleaningLinks(links)
	return result, nil
}
func (r *Resolver) mapCleaningCalibration(ctx context.Context, c *cleaning.Calibration) (*model.CleaningCalibration, error) {
	if c == nil {
		return nil, nil
	}
	t, err := cleaning.Calibrate(c.Anchors)
	if err != nil && len(c.Anchors) >= 2 {
		return nil, err
	}
	if len(c.Anchors) < 2 {
		t = cleaning.Transform{A: 1}
	}
	result := &model.CleaningCalibration{MapRotation: c.MapRotation, Enabled: c.Enabled, DeviceID: c.DeviceID, MapID: c.MapID, FloorplanID: c.FloorplanID, Revision: int(c.Revision), MapRevision: c.MapRevision, FloorplanRevision: int(c.FloorplanRevision), Anchors: []*model.CleaningAnchor{}, Transform: &model.CleaningTransform{A: t.A, B: t.B, X: t.X, Y: t.Y}}
	for _, a := range c.Anchors {
		result.Anchors = append(result.Anchors, &model.CleaningAnchor{Robot: &model.CleaningMapPoint{X: a.Robot.X, Y: a.Robot.Y}, Hive: &model.CleaningMapPoint{X: a.Hive.X, Y: a.Hive.Y}})
	}
	snap, err := r.Cleaning.Snapshot(ctx, c.DeviceID)
	if err != nil {
		return nil, err
	}
	fp, err := r.Store.GetFloorplanGraph(ctx)
	if err != nil {
		return nil, err
	}
	if fp != nil && fp.ID == c.FloorplanID && store.FloorplanGeometry(fp) == c.FloorplanGeometry {
		for _, m := range snap.Maps {
			if strconv.Itoa(m.ID) == c.MapID {
				result.Valid = len(c.Anchors) >= 2
			}
		}
	}
	return result, nil
}
func cleaningAPIError(err error) error {
	var busy *cleaning.BusyError
	if errors.As(err, &busy) {
		return &gqlerror.Error{Message: busy.Error(), Extensions: map[string]any{"code": "CLEANING_BUSY", "taskId": busy.TaskID}}
	}
	return err
}

func cleaningScope(scope model.CleaningScope) cleaning.Scope {
	if scope == model.CleaningScopeApartment {
		return cleaning.ScopeApartment
	}
	return cleaning.ScopeRooms
}
func mapCleaningScope(scope cleaning.Scope) model.CleaningScope {
	if scope == cleaning.ScopeApartment {
		return model.CleaningScopeApartment
	}
	return model.CleaningScopeRooms
}
