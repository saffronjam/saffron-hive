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

func mapScene(sr device.StateReader, s store.Store, sc store.Scene, actions []store.SceneAction) *model.Scene {
	ms := &model.Scene{
		ID:   sc.ID,
		Name: sc.Name,
	}
	ms.Actions = make([]*model.SceneAction, len(actions))
	for i, a := range actions {
		ms.Actions[i] = &model.SceneAction{
			ID:         a.ID,
			TargetType: a.TargetType,
			TargetID:   a.TargetID,
			Target:     resolveSceneTarget(sr, s, a.TargetType, a.TargetID),
			Payload:    a.Payload,
		}
	}
	return ms
}

func resolveSceneTarget(sr device.StateReader, s store.Store, targetType string, targetID string) model.SceneTarget {
	switch targetType {
	case "group":
		g, err := s.GetGroup(context.Background(), targetID)
		if err != nil {
			return nil
		}
		members, err := s.ListGroupMembers(context.Background(), targetID)
		if err != nil {
			return nil
		}
		return mapGroupToSceneTarget(sr, s, g, members)
	default:
		d, ok := sr.GetDevice(device.DeviceID(targetID))
		if !ok {
			return nil
		}
		return mapDeviceFromReader(sr, d)
	}
}

func mapGroupToSceneTarget(sr device.StateReader, s store.Store, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:   g.ID,
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
	seen := make(map[string]bool)
	mg.ResolvedDevices = collectDevicesFromMembers(sr, s, members, seen)
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

func mapGroup(sr device.StateReader, s store.Store, g store.Group, members []store.GroupMember) *model.Group {
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

	seen := make(map[string]bool)
	mg.ResolvedDevices = collectDevicesFromMembers(sr, s, members, seen)

	return mg
}

func collectDevicesFromMembers(sr device.StateReader, s store.Store, members []store.GroupMember, seen map[string]bool) []*model.Device {
	var result []*model.Device
	for _, m := range members {
		if seen[m.MemberID] {
			continue
		}
		seen[m.MemberID] = true
		if m.MemberType == device.GroupMemberDevice {
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				result = append(result, mapDeviceFromReader(sr, d))
			}
		} else if m.MemberType == device.GroupMemberGroup {
			subMembers, err := s.ListGroupMembers(context.Background(), m.MemberID)
			if err == nil {
				result = append(result, collectDevicesFromMembers(sr, s, subMembers, seen)...)
			}
		}
	}
	return result
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

func resolveSceneActionTargetDevices(s store.Store, targetType string, targetID string) []device.DeviceID {
	if targetType == "group" {
		return resolveGroupDeviceIDsFromStore(s, targetID)
	}
	return []device.DeviceID{device.DeviceID(targetID)}
}

func resolveGroupDeviceIDsFromStore(s store.Store, groupID string) []device.DeviceID {
	seen := make(map[string]bool)
	return collectGroupDeviceIDsFromStore(s, groupID, seen)
}

func collectGroupDeviceIDsFromStore(s store.Store, groupID string, seen map[string]bool) []device.DeviceID {
	if seen[groupID] {
		return nil
	}
	seen[groupID] = true

	members, err := s.ListGroupMembers(context.Background(), groupID)
	if err != nil {
		return nil
	}

	var result []device.DeviceID
	for _, m := range members {
		if m.MemberType == device.GroupMemberDevice {
			result = append(result, device.DeviceID(m.MemberID))
		} else if m.MemberType == device.GroupMemberGroup {
			result = append(result, collectGroupDeviceIDsFromStore(s, m.MemberID, seen)...)
		}
	}
	return result
}

func buildLightCommandFromMap(desired map[string]interface{}) device.LightCommand {
	var cmd device.LightCommand
	if v, ok := desired["on"]; ok {
		if b, ok := v.(bool); ok {
			cmd.On = device.Ptr(b)
		}
	}
	if v, ok := desired["brightness"]; ok {
		cmd.Brightness = device.Ptr(toIntFromAny(v))
	}
	if v, ok := desired["color_temp"]; ok {
		cmd.ColorTemp = device.Ptr(toIntFromAny(v))
	}
	return cmd
}

func toIntFromAny(v interface{}) int {
	switch n := v.(type) {
	case float64:
		return int(n)
	case int:
		return n
	default:
		return 0
	}
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
