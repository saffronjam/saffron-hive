package spatial

import (
	"context"
	"slices"

	"github.com/saffronjam/saffron-hive/internal/device"
)

const maximumMembershipPaths = 4096

type structuralNode struct {
	kind device.TargetType
	id   string
}

type membershipPath []structuralNode

func (r *Resolver) devicePaths(ctx context.Context, target device.DeviceID, roots []StructuralRoot) ([]membershipPath, int, error) {
	var paths []membershipPath
	cycleBranches := 0
	for _, root := range roots {
		node := structuralNode{kind: root.Type, id: root.ID}
		if root.Type == device.TargetDevice {
			if root.ID == string(target) {
				paths = append(paths, membershipPath{node})
			}
			continue
		}
		if !containsDevice(r.store.ResolveTargetDeviceIDs(ctx, root.Type, root.ID), target) {
			continue
		}
		stack := map[structuralNode]bool{}
		if err := r.walkPaths(ctx, node, target, nil, stack, &paths, &cycleBranches); err != nil {
			return nil, cycleBranches, err
		}
	}
	return paths, cycleBranches, nil
}

func (r *Resolver) walkPaths(
	ctx context.Context,
	current structuralNode,
	target device.DeviceID,
	path membershipPath,
	stack map[structuralNode]bool,
	paths *[]membershipPath,
	cycleBranches *int,
) error {
	if len(*paths) >= maximumMembershipPaths {
		return errPathLimit
	}
	if stack[current] {
		*cycleBranches++
		return nil
	}
	if current.kind == device.TargetDevice {
		if current.id == string(target) {
			completed := append(append(membershipPath(nil), path...), current)
			*paths = append(*paths, completed)
		}
		return nil
	}
	if !containsDevice(r.store.ResolveTargetDeviceIDs(ctx, current.kind, current.id), target) {
		return nil
	}
	stack[current] = true
	path = append(path, current)
	members, err := r.loadMembers(ctx, current)
	if err != nil {
		delete(stack, current)
		return err
	}
	for _, member := range members {
		if stack[member] {
			*cycleBranches++
			continue
		}
		if err := r.walkPaths(ctx, member, target, path, stack, paths, cycleBranches); err != nil {
			delete(stack, current)
			return err
		}
	}
	delete(stack, current)
	return nil
}

func (r *Resolver) loadMembers(ctx context.Context, node structuralNode) ([]structuralNode, error) {
	r.mu.RLock()
	members, ok := r.members[node]
	r.mu.RUnlock()
	if ok {
		return append([]structuralNode(nil), members...), nil
	}
	var result []structuralNode
	switch node.kind {
	case device.TargetGroup:
		rows, err := r.store.ListGroupMembers(ctx, node.id)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			switch row.MemberType {
			case device.GroupMemberDevice:
				result = append(result, structuralNode{kind: device.TargetDevice, id: row.MemberID})
			case device.GroupMemberGroup:
				result = append(result, structuralNode{kind: device.TargetGroup, id: row.MemberID})
			case device.GroupMemberRoom:
				result = append(result, structuralNode{kind: device.TargetRoom, id: row.MemberID})
			}
		}
	case device.TargetRoom:
		rows, err := r.store.ListRoomMembers(ctx, node.id)
		if err != nil {
			return nil, err
		}
		for _, row := range rows {
			switch row.MemberType {
			case device.RoomMemberDevice:
				result = append(result, structuralNode{kind: device.TargetDevice, id: row.MemberID})
			case device.RoomMemberGroup:
				result = append(result, structuralNode{kind: device.TargetGroup, id: row.MemberID})
			}
		}
	}
	slices.SortFunc(result, func(a, b structuralNode) int {
		if a.kind != b.kind {
			return compare(string(a.kind), string(b.kind))
		}
		return compare(a.id, b.id)
	})
	r.mu.Lock()
	if cached, exists := r.members[node]; exists {
		result = cached
	} else {
		r.members[node] = append([]structuralNode(nil), result...)
	}
	r.mu.Unlock()
	return append([]structuralNode(nil), result...), nil
}

func containsDevice(ids []device.DeviceID, target device.DeviceID) bool {
	return slices.Contains(ids, target)
}
