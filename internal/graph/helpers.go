package graph

import (
	"context"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func mapDeviceFromReader(sr device.StateReader, d device.Device) *model.Device {
	md := &model.Device{
		ID:        string(d.ID),
		Name:      d.Name,
		Source:    string(d.Source),
		Type:      string(d.Type),
		Available: d.Available,
		LastSeen:  &d.LastSeen,
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

func mapScene(sr device.StateReader, s store.Scene, actions []store.SceneAction) *model.Scene {
	ms := &model.Scene{
		ID:   s.ID,
		Name: s.Name,
	}
	ms.Actions = make([]*model.SceneAction, len(actions))
	for i, a := range actions {
		ms.Actions[i] = &model.SceneAction{
			ID:         a.ID,
			TargetType: a.TargetType,
			TargetID:   a.TargetID,
			Target:     resolveSceneTarget(sr, a.TargetType, a.TargetID),
			Payload:    a.Payload,
		}
	}
	return ms
}

func resolveSceneTarget(sr device.StateReader, targetType string, targetID string) model.SceneTarget {
	switch targetType {
	case "group":
		g, ok := sr.GetGroup(device.GroupID(targetID))
		if !ok {
			return nil
		}
		members := sr.ListGroupMembers(device.GroupID(targetID))
		return mapGroupToSceneTarget(sr, g, members)
	default:
		d, ok := sr.GetDevice(device.DeviceID(targetID))
		if !ok {
			return nil
		}
		return mapDeviceFromReader(sr, d)
	}
}

func mapGroupToSceneTarget(sr device.StateReader, g device.Group, members []device.GroupMember) *model.Group {
	mg := &model.Group{
		ID:   string(g.ID),
		Name: g.Name,
	}
	mg.Members = make([]*model.GroupMember, len(members))
	for i, m := range members {
		gm := &model.GroupMember{
			MemberType: string(m.MemberType),
			MemberID:   m.MemberID,
		}
		if m.MemberType == device.GroupMemberDevice {
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				gm.Device = mapDeviceFromReader(sr, d)
			}
		}
		mg.Members[i] = gm
	}
	deviceIDs := sr.ResolveGroupDevices(g.ID)
	mg.ResolvedDevices = make([]*model.Device, 0, len(deviceIDs))
	for _, did := range deviceIDs {
		d, ok := sr.GetDevice(did)
		if ok {
			mg.ResolvedDevices = append(mg.ResolvedDevices, mapDeviceFromReader(sr, d))
		}
	}
	return mg
}

func mapAutomationGraph(g store.AutomationGraph) *model.AutomationGraph {
	mg := &model.AutomationGraph{
		ID:              g.Automation.ID,
		Name:            g.Automation.Name,
		Enabled:         g.Automation.Enabled,
		CooldownSeconds: g.Automation.CooldownSeconds,
	}
	mg.Nodes = make([]*model.AutomationNode, len(g.Nodes))
	for i, n := range g.Nodes {
		mg.Nodes[i] = &model.AutomationNode{
			ID:     n.ID,
			Type:   n.Type,
			Config: n.Config,
		}
	}
	mg.Edges = make([]*model.AutomationEdge, len(g.Edges))
	for i, e := range g.Edges {
		mg.Edges[i] = &model.AutomationEdge{
			ID:         e.ID,
			FromNodeID: e.FromNodeID,
			ToNodeID:   e.ToNodeID,
		}
	}
	return mg
}

func mapGroup(sr device.StateReader, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:   g.ID,
		Name: g.Name,
	}

	mg.Members = make([]*model.GroupMember, len(members))
	for i, m := range members {
		gm := &model.GroupMember{
			ID:         m.ID,
			MemberType: string(m.MemberType),
			MemberID:   m.MemberID,
		}
		if m.MemberType == device.GroupMemberDevice {
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				gm.Device = mapDeviceFromReader(sr, d)
			}
		}
		mg.Members[i] = gm
	}

	deviceIDs := sr.ResolveGroupDevices(device.GroupID(g.ID))
	mg.ResolvedDevices = make([]*model.Device, 0, len(deviceIDs))
	for _, did := range deviceIDs {
		d, ok := sr.GetDevice(did)
		if ok {
			mg.ResolvedDevices = append(mg.ResolvedDevices, mapDeviceFromReader(sr, d))
		}
	}

	return mg
}

func mapGroupMember(sr device.StateReader, m store.GroupMember) *model.GroupMember {
	gm := &model.GroupMember{
		ID:         m.ID,
		MemberType: string(m.MemberType),
		MemberID:   m.MemberID,
	}
	if m.MemberType == device.GroupMemberDevice {
		d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
		if ok {
			gm.Device = mapDeviceFromReader(sr, d)
		}
	}
	return gm
}

func (r *mutationResolver) checkCircularDependency(ctx context.Context, parentID, childID string) error {
	if parentID == childID {
		return device.ErrCircularDependency
	}
	return r.walkDescendants(ctx, childID, parentID, make(map[string]struct{}))
}

func (r *mutationResolver) walkDescendants(ctx context.Context, current, target string, visited map[string]struct{}) error {
	if _, ok := visited[current]; ok {
		return nil
	}
	visited[current] = struct{}{}

	members, err := r.Store.ListGroupMembers(ctx, current)
	if err != nil {
		return err
	}
	for _, m := range members {
		if m.MemberType != device.GroupMemberGroup {
			continue
		}
		if m.MemberID == target {
			return device.ErrCircularDependency
		}
		if err := r.walkDescendants(ctx, m.MemberID, target, visited); err != nil {
			return err
		}
	}
	return nil
}
