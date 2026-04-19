package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/saffronjam/saffron-hive/internal/automation"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"github.com/saffronjam/saffron-hive/internal/logging"
	"github.com/saffronjam/saffron-hive/internal/store"
)

func mapDeviceFromReader(sr device.StateReader, d device.Device) *model.Device {
	md := &model.Device{
		ID:           string(d.ID),
		Name:         d.Name,
		Source:       string(d.Source),
		Type:         string(d.Type),
		Capabilities: mapCapabilities(d.Capabilities),
		Available:    d.Available,
		LastSeen:     &d.LastSeen,
	}
	md.State = resolveDeviceStateFromReader(sr, d.ID)
	return md
}

func mapCapabilities(caps []device.Capability) []*model.Capability {
	if caps == nil {
		return []*model.Capability{}
	}
	result := make([]*model.Capability, len(caps))
	for i, c := range caps {
		var unit *string
		if c.Unit != "" {
			unit = &c.Unit
		}
		result[i] = &model.Capability{
			Name:     c.Name,
			Type:     c.Type,
			Values:   c.Values,
			ValueMin: c.ValueMin,
			ValueMax: c.ValueMax,
			Unit:     unit,
			Access:   c.Access,
		}
	}
	return result
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

func mapScene(ctx context.Context, sr device.StateReader, s store.Store, sc store.Scene, actions []store.SceneAction) *model.Scene {
	ms := &model.Scene{
		ID:   sc.ID,
		Name: sc.Name,
		Icon: sc.Icon,
	}
	ms.Actions = make([]*model.SceneAction, len(actions))
	for i, a := range actions {
		ms.Actions[i] = &model.SceneAction{
			ID:         a.ID,
			TargetType: a.TargetType,
			TargetID:   a.TargetID,
			Target:     resolveSceneTarget(ctx, sr, s, a.TargetType, a.TargetID),
			Payload:    a.Payload,
		}
	}
	return ms
}

func resolveSceneTarget(ctx context.Context, sr device.StateReader, s store.Store, targetType string, targetID string) model.SceneTarget {
	switch targetType {
	case string(device.TargetGroup):
		g, err := s.GetGroup(ctx, targetID)
		if err != nil {
			return nil
		}
		members, err := s.ListGroupMembers(ctx, targetID)
		if err != nil {
			return nil
		}
		return mapGroupToSceneTarget(ctx, sr, s, g, members)
	case string(device.TargetRoom):
		r, err := s.GetRoom(ctx, targetID)
		if err != nil {
			return nil
		}
		return mapRoom(ctx, sr, s, r)
	default:
		d, ok := sr.GetDevice(device.DeviceID(targetID))
		if !ok {
			return nil
		}
		return mapDeviceFromReader(sr, d)
	}
}

func mapGroupToSceneTarget(ctx context.Context, sr device.StateReader, s store.Store, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:   g.ID,
		Name: g.Name,
		Icon: g.Icon,
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
	mg.ResolvedDevices = collectDevicesFromMembers(ctx, sr, s, members, seen)
	return mg
}

func mapAutomationGraph(g store.AutomationGraph) *model.AutomationGraph {
	mg := &model.AutomationGraph{
		ID:              g.Automation.ID,
		Name:            g.Automation.Name,
		Icon:            g.Automation.Icon,
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

func mapGroup(ctx context.Context, sr device.StateReader, s store.Store, g store.Group, members []store.GroupMember) *model.Group {
	mg := &model.Group{
		ID:   g.ID,
		Name: g.Name,
		Icon: g.Icon,
	}

	mg.Members = make([]*model.GroupMember, len(members))
	for i, m := range members {
		mg.Members[i] = mapGroupMember(ctx, sr, s, m)
	}

	seen := make(map[string]bool)
	mg.ResolvedDevices = collectDevicesFromMembers(ctx, sr, s, members, seen)

	return mg
}

func collectDevicesFromMembers(ctx context.Context, sr device.StateReader, s store.Store, members []store.GroupMember, seen map[string]bool) []*model.Device {
	var result []*model.Device
	for _, m := range members {
		if seen[m.MemberID] {
			continue
		}
		seen[m.MemberID] = true
		switch m.MemberType {
		case device.GroupMemberDevice:
			d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
			if ok {
				result = append(result, mapDeviceFromReader(sr, d))
			}
		case device.GroupMemberGroup:
			subMembers, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				result = append(result, collectDevicesFromMembers(ctx, sr, s, subMembers, seen)...)
			}
		case device.GroupMemberRoom:
			roomDevices, err := s.ListRoomDevices(ctx, m.MemberID)
			if err == nil {
				for _, rd := range roomDevices {
					if seen[rd.DeviceID] {
						continue
					}
					seen[rd.DeviceID] = true
					d, ok := sr.GetDevice(device.DeviceID(rd.DeviceID))
					if ok {
						result = append(result, mapDeviceFromReader(sr, d))
					}
				}
			}
		}
	}
	return result
}

func mapGroupMember(ctx context.Context, sr device.StateReader, s store.Store, m store.GroupMember) *model.GroupMember {
	gm := &model.GroupMember{
		ID:         m.ID,
		MemberType: string(m.MemberType),
		MemberID:   m.MemberID,
	}
	switch m.MemberType {
	case device.GroupMemberDevice:
		d, ok := sr.GetDevice(device.DeviceID(m.MemberID))
		if ok {
			gm.Device = mapDeviceFromReader(sr, d)
		}
	case device.GroupMemberGroup:
		g, err := s.GetGroup(ctx, m.MemberID)
		if err == nil {
			members, err := s.ListGroupMembers(ctx, m.MemberID)
			if err == nil {
				gm.Group = mapGroup(ctx, sr, s, g, members)
			}
		}
	case device.GroupMemberRoom:
		r, err := s.GetRoom(ctx, m.MemberID)
		if err == nil {
			gm.Room = mapRoom(ctx, sr, s, r)
		}
	}
	return gm
}

func resolveSceneActionTargetDevices(ctx context.Context, tr device.TargetResolver, targetType string, targetID string) []device.DeviceID {
	return tr.ResolveTargetDeviceIDs(ctx, device.TargetType(targetType), targetID)
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

func mapRoom(ctx context.Context, sr device.StateReader, s store.Store, r store.Room) *model.Room {
	mr := &model.Room{
		ID:   r.ID,
		Name: r.Name,
		Icon: r.Icon,
	}
	devices, err := s.ListRoomDevices(ctx, r.ID)
	if err != nil {
		mr.Devices = []*model.Device{}
		return mr
	}
	mr.Devices = make([]*model.Device, 0, len(devices))
	for _, rd := range devices {
		d, ok := sr.GetDevice(device.DeviceID(rd.DeviceID))
		if ok {
			mr.Devices = append(mr.Devices, mapDeviceFromReader(sr, d))
		}
	}
	return mr
}

func mapLogEntry(e logging.Entry) *model.LogEntry {
	attrsJSON, _ := json.Marshal(e.Attrs)
	return &model.LogEntry{
		Timestamp: e.Timestamp,
		Level:     e.Level.String(),
		Message:   e.Message,
		Attrs:     string(attrsJSON),
	}
}

func containsFold(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

func attrsContainFold(attrs map[string]string, substr string) bool {
	lower := strings.ToLower(substr)
	for k, v := range attrs {
		if strings.Contains(strings.ToLower(k), lower) || strings.Contains(strings.ToLower(v), lower) {
			return true
		}
	}
	return false
}

// validateAutomationInput validates automation node/edge inputs before persisting.
// Returns a user-friendly error if the graph has structural issues (no triggers,
// invalid cron expressions, cycles, etc.).
func validateAutomationInput(inputNodes []*model.AutomationNodeInput, inputEdges []*model.AutomationEdgeInput) error {
	domainNodes := make([]automation.Node, 0, len(inputNodes))
	for _, n := range inputNodes {
		domainNodes = append(domainNodes, automation.Node{
			ID:     automation.NodeID(n.ID),
			Type:   automation.NodeType(n.Type),
			Config: parseAutomationNodeConfigForValidation(automation.NodeType(n.Type), n.Config),
		})
	}
	domainEdges := make([]automation.Edge, 0, len(inputEdges))
	for i, e := range inputEdges {
		domainEdges = append(domainEdges, automation.Edge{
			ID:         fmt.Sprintf("edge-%d", i),
			FromNodeID: automation.NodeID(e.FromNodeID),
			ToNodeID:   automation.NodeID(e.ToNodeID),
		})
	}

	result := automation.ValidateGraph(automation.AutomationGraph{
		Nodes: domainNodes,
		Edges: domainEdges,
	})
	if result.Valid() {
		return nil
	}

	msgs := make([]string, 0, len(result.Errors))
	for _, err := range result.Errors {
		msgs = append(msgs, err.Error())
	}
	return fmt.Errorf("automation validation failed: %s", strings.Join(msgs, "; "))
}

func parseAutomationNodeConfigForValidation(nodeType automation.NodeType, configJSON string) automation.NodeConfig {
	switch nodeType {
	case automation.NodeTrigger:
		var raw struct {
			Kind          string `json:"kind"`
			EventType     string `json:"event_type"`
			FilterExpr    string `json:"filter_expr"`
			ConditionExpr string `json:"condition_expr"`
			CronExpr      string `json:"cron_expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.TriggerConfig{}
		}
		kind := automation.TriggerKind(raw.Kind)
		if kind == "" {
			if raw.CronExpr != "" {
				kind = automation.TriggerSchedule
			} else {
				kind = automation.TriggerEvent
			}
		}
		filter := raw.FilterExpr
		if filter == "" {
			filter = raw.ConditionExpr
		}
		return automation.TriggerConfig{
			Kind:       kind,
			EventType:  raw.EventType,
			FilterExpr: filter,
			CronExpr:   raw.CronExpr,
		}
	case automation.NodeCondition:
		var raw struct {
			Expr string `json:"expr"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.ConditionConfig{}
		}
		return automation.ConditionConfig{Expr: raw.Expr}
	case automation.NodeOperator:
		var raw struct {
			Kind string `json:"kind"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.OperatorConfig{}
		}
		return automation.OperatorConfig{Kind: automation.OperatorKind(raw.Kind)}
	case automation.NodeAction:
		var raw struct {
			ActionType string `json:"action_type"`
			TargetType string `json:"target_type"`
			TargetID   string `json:"target_id"`
			Payload    string `json:"payload"`
		}
		if err := json.Unmarshal([]byte(configJSON), &raw); err != nil {
			return automation.ActionConfig{}
		}
		return automation.ActionConfig{
			ActionType: raw.ActionType,
			TargetType: automation.TargetType(raw.TargetType),
			TargetID:   raw.TargetID,
			Payload:    raw.Payload,
		}
	default:
		return nil
	}
}
