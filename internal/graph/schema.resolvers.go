package graph

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

// Devices is the resolver for the devices field.
func (r *queryResolver) Devices(ctx context.Context) ([]*model.Device, error) {
	devices := r.StateReader.ListDevices()
	result := make([]*model.Device, len(devices))
	for i, d := range devices {
		result[i] = mapDeviceFromReader(r.StateReader, d)
	}
	return result, nil
}

// Device is the resolver for the device field.
func (r *queryResolver) Device(ctx context.Context, id string) (*model.Device, error) {
	d, ok := r.StateReader.GetDevice(device.DeviceID(id))
	if !ok {
		return nil, nil
	}
	return mapDeviceFromReader(r.StateReader, d), nil
}

// Scenes is the resolver for the scenes field.
func (r *queryResolver) Scenes(ctx context.Context) ([]*model.Scene, error) {
	scenes, err := r.Store.ListScenes(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*model.Scene, len(scenes))
	for i, s := range scenes {
		actions, err := r.Store.ListSceneActions(ctx, s.ID)
		if err != nil {
			return nil, err
		}
		result[i] = mapScene(s, actions)
	}
	return result, nil
}

// Scene is the resolver for the scene field.
func (r *queryResolver) Scene(ctx context.Context, id string) (*model.Scene, error) {
	s, err := r.Store.GetScene(ctx, id)
	if err != nil {
		return nil, err
	}
	actions, err := r.Store.ListSceneActions(ctx, s.ID)
	if err != nil {
		return nil, err
	}
	return mapScene(s, actions), nil
}

// Automations is the resolver for the automations field.
func (r *queryResolver) Automations(ctx context.Context) ([]*model.Automation, error) {
	autos, err := r.Store.ListAutomations(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]*model.Automation, len(autos))
	for i, a := range autos {
		actions, err := r.Store.ListAutomationActions(ctx, a.ID)
		if err != nil {
			return nil, err
		}
		result[i] = mapAutomation(a, actions)
	}
	return result, nil
}

// Automation is the resolver for the automation field.
func (r *queryResolver) Automation(ctx context.Context, id string) (*model.Automation, error) {
	a, err := r.Store.GetAutomation(ctx, id)
	if err != nil {
		return nil, err
	}
	actions, err := r.Store.ListAutomationActions(ctx, a.ID)
	if err != nil {
		return nil, err
	}
	return mapAutomation(a, actions), nil
}

// SensorHistory is the resolver for the sensorHistory field.
func (r *queryResolver) SensorHistory(ctx context.Context, deviceID string, from *time.Time, to *time.Time, limit *int) ([]*model.SensorReading, error) {
	q := store.SensorHistoryQuery{
		DeviceID: device.DeviceID(deviceID),
	}
	if from != nil {
		q.From = *from
	}
	if to != nil {
		q.To = *to
	}
	if limit != nil {
		q.Limit = *limit
	}
	readings, err := r.Store.QuerySensorHistory(ctx, q)
	if err != nil {
		return nil, err
	}
	result := make([]*model.SensorReading, len(readings))
	for i, rd := range readings {
		result[i] = &model.SensorReading{
			ID:          strconv.FormatInt(rd.ID, 10),
			DeviceID:    string(rd.DeviceID),
			Temperature: rd.Temperature,
			Humidity:    rd.Humidity,
			Battery:     rd.Battery,
			Pressure:    rd.Pressure,
			Illuminance: rd.Illuminance,
			RecordedAt:  rd.RecordedAt,
		}
	}
	return result, nil
}

// SetDeviceState is the resolver for the setDeviceState field.
func (r *mutationResolver) SetDeviceState(ctx context.Context, deviceID string, state model.LightStateInput) (*model.Device, error) {
	id := device.DeviceID(deviceID)
	d, ok := r.StateReader.GetDevice(id)
	if !ok {
		return nil, fmt.Errorf("device %q not found", deviceID)
	}

	cmd := device.LightCommand{
		On:         state.On,
		Brightness: state.Brightness,
		ColorTemp:  state.ColorTemp,
		Transition: state.Transition,
	}
	if state.Color != nil {
		cmd.Color = &device.Color{
			R: state.Color.R,
			G: state.Color.G,
			B: state.Color.B,
			X: state.Color.X,
			Y: state.Color.Y,
		}
	}

	r.EventBus.Publish(eventbus.Event{
		Type:      eventbus.EventCommandRequested,
		DeviceID:  deviceID,
		Timestamp: time.Now(),
		Payload:   device.DeviceCommand{DeviceID: id, Payload: cmd},
	})

	return mapDeviceFromReader(r.StateReader, d), nil
}

// ApplyScene is the resolver for the applyScene field.
func (r *mutationResolver) ApplyScene(ctx context.Context, sceneID string) (*model.Scene, error) {
	s, err := r.Store.GetScene(ctx, sceneID)
	if err != nil {
		return nil, fmt.Errorf("scene %q not found: %w", sceneID, err)
	}
	actions, err := r.Store.ListSceneActions(ctx, s.ID)
	if err != nil {
		return nil, err
	}

	r.EventBus.Publish(eventbus.Event{
		Type:      eventbus.EventSceneApplied,
		Timestamp: time.Now(),
		Payload:   sceneID,
	})

	return mapScene(s, actions), nil
}

// CreateScene is the resolver for the createScene field.
func (r *mutationResolver) CreateScene(ctx context.Context, input model.CreateSceneInput) (*model.Scene, error) {
	sceneID := uuid.New().String()
	s, err := r.Store.CreateScene(ctx, store.CreateSceneParams{
		ID:   sceneID,
		Name: input.Name,
	})
	if err != nil {
		return nil, err
	}

	var storeActions []store.SceneAction
	for _, a := range input.Actions {
		actionID := uuid.New().String()
		sa, err := r.Store.CreateSceneAction(ctx, store.CreateSceneActionParams{
			ID:       actionID,
			SceneID:  sceneID,
			DeviceID: device.DeviceID(a.DeviceID),
			Payload:  a.Payload,
		})
		if err != nil {
			return nil, err
		}
		storeActions = append(storeActions, sa)
	}

	return mapScene(s, storeActions), nil
}

// UpdateScene is the resolver for the updateScene field.
func (r *mutationResolver) UpdateScene(ctx context.Context, id string, input model.UpdateSceneInput) (*model.Scene, error) {
	s, err := r.Store.GetScene(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("scene %q not found: %w", id, err)
	}

	if input.Actions != nil {
		existingActions, err := r.Store.ListSceneActions(ctx, id)
		if err != nil {
			return nil, err
		}
		for _, ea := range existingActions {
			if err := r.Store.DeleteSceneAction(ctx, ea.ID); err != nil {
				return nil, err
			}
		}
		for _, a := range input.Actions {
			actionID := uuid.New().String()
			_, err := r.Store.CreateSceneAction(ctx, store.CreateSceneActionParams{
				ID:       actionID,
				SceneID:  id,
				DeviceID: device.DeviceID(a.DeviceID),
				Payload:  a.Payload,
			})
			if err != nil {
				return nil, err
			}
		}
	}

	actions, err := r.Store.ListSceneActions(ctx, id)
	if err != nil {
		return nil, err
	}
	_ = s
	s, err = r.Store.GetScene(ctx, id)
	if err != nil {
		return nil, err
	}
	return mapScene(s, actions), nil
}

// DeleteScene is the resolver for the deleteScene field.
func (r *mutationResolver) DeleteScene(ctx context.Context, id string) (bool, error) {
	err := r.Store.DeleteScene(ctx, id)
	if err != nil {
		return false, err
	}
	return true, nil
}

// CreateAutomation is the resolver for the createAutomation field.
func (r *mutationResolver) CreateAutomation(ctx context.Context, input model.CreateAutomationInput) (*model.Automation, error) {
	autoID := uuid.New().String()
	a, err := r.Store.CreateAutomation(ctx, store.CreateAutomationParams{
		ID:              autoID,
		Name:            input.Name,
		Enabled:         input.Enabled,
		TriggerEvent:    input.TriggerEvent,
		ConditionExpr:   input.ConditionExpr,
		CooldownSeconds: input.CooldownSeconds,
	})
	if err != nil {
		return nil, err
	}

	var storeActions []store.AutomationAction
	for _, act := range input.Actions {
		actionID := uuid.New().String()
		var devID *device.DeviceID
		if act.DeviceID != nil {
			id := device.DeviceID(*act.DeviceID)
			devID = &id
		}
		sa, err := r.Store.CreateAutomationAction(ctx, store.CreateAutomationActionParams{
			ID:           actionID,
			AutomationID: autoID,
			ActionType:   act.ActionType,
			DeviceID:     devID,
			Payload:      act.Payload,
		})
		if err != nil {
			return nil, err
		}
		storeActions = append(storeActions, sa)
	}

	if r.AutomationReloader != nil {
		if err := r.AutomationReloader.Reload(); err != nil {
			return nil, fmt.Errorf("failed to reload automations: %w", err)
		}
	}

	return mapAutomation(a, storeActions), nil
}

// UpdateAutomation is the resolver for the updateAutomation field.
func (r *mutationResolver) UpdateAutomation(ctx context.Context, id string, input model.UpdateAutomationInput) (*model.Automation, error) {
	a, err := r.Store.GetAutomation(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("automation %q not found: %w", id, err)
	}

	if input.Actions != nil {
		existingActions, err := r.Store.ListAutomationActions(ctx, id)
		if err != nil {
			return nil, err
		}
		for _, ea := range existingActions {
			if err := r.Store.DeleteAutomationAction(ctx, ea.ID); err != nil {
				return nil, err
			}
		}
		for _, act := range input.Actions {
			actionID := uuid.New().String()
			var devID *device.DeviceID
			if act.DeviceID != nil {
				did := device.DeviceID(*act.DeviceID)
				devID = &did
			}
			_, err := r.Store.CreateAutomationAction(ctx, store.CreateAutomationActionParams{
				ID:           actionID,
				AutomationID: id,
				ActionType:   act.ActionType,
				DeviceID:     devID,
				Payload:      act.Payload,
			})
			if err != nil {
				return nil, err
			}
		}
	}

	_ = a
	a, err = r.Store.GetAutomation(ctx, id)
	if err != nil {
		return nil, err
	}
	actions, err := r.Store.ListAutomationActions(ctx, id)
	if err != nil {
		return nil, err
	}

	if r.AutomationReloader != nil {
		if err := r.AutomationReloader.Reload(); err != nil {
			return nil, fmt.Errorf("failed to reload automations: %w", err)
		}
	}

	return mapAutomation(a, actions), nil
}

// DeleteAutomation is the resolver for the deleteAutomation field.
func (r *mutationResolver) DeleteAutomation(ctx context.Context, id string) (bool, error) {
	err := r.Store.DeleteAutomation(ctx, id)
	if err != nil {
		return false, err
	}
	if r.AutomationReloader != nil {
		if err := r.AutomationReloader.Reload(); err != nil {
			return false, fmt.Errorf("failed to reload automations: %w", err)
		}
	}
	return true, nil
}

// ToggleAutomation is the resolver for the toggleAutomation field.
func (r *mutationResolver) ToggleAutomation(ctx context.Context, id string, enabled bool) (*model.Automation, error) {
	err := r.Store.UpdateAutomationEnabled(ctx, id, enabled)
	if err != nil {
		return nil, err
	}
	a, err := r.Store.GetAutomation(ctx, id)
	if err != nil {
		return nil, err
	}
	actions, err := r.Store.ListAutomationActions(ctx, a.ID)
	if err != nil {
		return nil, err
	}

	if r.AutomationReloader != nil {
		if err := r.AutomationReloader.Reload(); err != nil {
			return nil, fmt.Errorf("failed to reload automations: %w", err)
		}
	}

	return mapAutomation(a, actions), nil
}

// DeviceStateChanged is the resolver for the deviceStateChanged field.
func (r *subscriptionResolver) DeviceStateChanged(ctx context.Context, deviceID *string) (<-chan *model.DeviceStateEvent, error) {
	ch := r.EventBus.Subscribe(eventbus.EventDeviceStateChanged)
	out := make(chan *model.DeviceStateEvent, 1)

	go func() {
		defer close(out)
		defer r.EventBus.Unsubscribe(ch)

		for {
			select {
			case <-ctx.Done():
				return
			case evt, ok := <-ch:
				if !ok {
					return
				}
				if deviceID != nil && evt.DeviceID != *deviceID {
					continue
				}
				state := resolveDeviceStateFromReader(r.StateReader, device.DeviceID(evt.DeviceID))
				if state == nil {
					continue
				}
				select {
				case out <- &model.DeviceStateEvent{
					DeviceID: evt.DeviceID,
					State:    state,
				}:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out, nil
}

// DeviceAvailabilityChanged is the resolver for the deviceAvailabilityChanged field.
func (r *subscriptionResolver) DeviceAvailabilityChanged(ctx context.Context) (<-chan *model.DeviceAvailabilityEvent, error) {
	ch := r.EventBus.Subscribe(eventbus.EventDeviceAvailabilityChanged)
	out := make(chan *model.DeviceAvailabilityEvent, 1)

	go func() {
		defer close(out)
		defer r.EventBus.Unsubscribe(ch)

		for {
			select {
			case <-ctx.Done():
				return
			case evt, ok := <-ch:
				if !ok {
					return
				}
				d, ok := r.StateReader.GetDevice(device.DeviceID(evt.DeviceID))
				if !ok {
					continue
				}
				select {
				case out <- &model.DeviceAvailabilityEvent{
					DeviceID:  evt.DeviceID,
					Available: d.Available,
				}:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out, nil
}

// DeviceAdded is the resolver for the deviceAdded field.
func (r *subscriptionResolver) DeviceAdded(ctx context.Context) (<-chan *model.Device, error) {
	ch := r.EventBus.Subscribe(eventbus.EventDeviceAdded)
	out := make(chan *model.Device, 1)

	go func() {
		defer close(out)
		defer r.EventBus.Unsubscribe(ch)

		for {
			select {
			case <-ctx.Done():
				return
			case evt, ok := <-ch:
				if !ok {
					return
				}
				d, ok := r.StateReader.GetDevice(device.DeviceID(evt.DeviceID))
				if !ok {
					continue
				}
				md := mapDeviceFromReader(r.StateReader, d)
				select {
				case out <- md:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out, nil
}

// DeviceRemoved is the resolver for the deviceRemoved field.
func (r *subscriptionResolver) DeviceRemoved(ctx context.Context) (<-chan string, error) {
	ch := r.EventBus.Subscribe(eventbus.EventDeviceRemoved)
	out := make(chan string, 1)

	go func() {
		defer close(out)
		defer r.EventBus.Unsubscribe(ch)

		for {
			select {
			case <-ctx.Done():
				return
			case evt, ok := <-ch:
				if !ok {
					return
				}
				select {
				case out <- evt.DeviceID:
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return out, nil
}

// Mutation returns MutationResolver implementation.
func (r *Resolver) Mutation() MutationResolver { return &mutationResolver{r} }

// Query returns QueryResolver implementation.
func (r *Resolver) Query() QueryResolver { return &queryResolver{r} }

// Subscription returns SubscriptionResolver implementation.
func (r *Resolver) Subscription() SubscriptionResolver { return &subscriptionResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
type subscriptionResolver struct{ *Resolver }

func mapDeviceFromReader(sr device.StateReader, d device.Device) *model.Device {
	md := &model.Device{
		ID:        string(d.ID),
		Name:      d.Name,
		Source:    string(d.Source),
		Type:      string(d.Type),
		Available: d.Available,
		LastSeen:  d.LastSeen,
	}
	md.State = resolveDeviceStateFromReader(sr, d.ID)
	return md
}

func resolveDeviceStateFromReader(sr device.StateReader, id device.DeviceID) model.DeviceState {
	if ls, ok := sr.GetLightState(id); ok && ls != nil {
		ms := model.LightState{
			On:         ls.On,
			Brightness: ls.Brightness,
			ColorTemp:  ls.ColorTemp,
			Transition: ls.Transition,
		}
		if ls.Color != nil {
			ms.Color = &model.Color{
				R: ls.Color.R,
				G: ls.Color.G,
				B: ls.Color.B,
				X: ls.Color.X,
				Y: ls.Color.Y,
			}
		}
		return ms
	}
	if ss, ok := sr.GetSensorState(id); ok && ss != nil {
		return model.SensorState{
			Temperature: ss.Temperature,
			Humidity:    ss.Humidity,
			Battery:     ss.Battery,
			Pressure:    ss.Pressure,
			Illuminance: ss.Illuminance,
		}
	}
	if sw, ok := sr.GetSwitchState(id); ok && sw != nil {
		return model.SwitchState{
			Action: sw.Action,
		}
	}
	return nil
}

func mapScene(s store.Scene, actions []store.SceneAction) *model.Scene {
	ms := &model.Scene{
		ID:   s.ID,
		Name: s.Name,
	}
	ms.Actions = make([]*model.SceneAction, len(actions))
	for i, a := range actions {
		ms.Actions[i] = &model.SceneAction{
			ID:       a.ID,
			DeviceID: string(a.DeviceID),
			Payload:  a.Payload,
		}
	}
	return ms
}

func mapAutomation(a store.Automation, actions []store.AutomationAction) *model.Automation {
	ma := &model.Automation{
		ID:              a.ID,
		Name:            a.Name,
		Enabled:         a.Enabled,
		TriggerEvent:    a.TriggerEvent,
		ConditionExpr:   a.ConditionExpr,
		CooldownSeconds: a.CooldownSeconds,
	}
	ma.Actions = make([]*model.AutomationAction, len(actions))
	for i, act := range actions {
		var devID *string
		if act.DeviceID != nil {
			s := string(*act.DeviceID)
			devID = &s
		}
		ma.Actions[i] = &model.AutomationAction{
			ID:         act.ID,
			ActionType: act.ActionType,
			DeviceID:   devID,
			Payload:    act.Payload,
		}
	}
	return ma
}
