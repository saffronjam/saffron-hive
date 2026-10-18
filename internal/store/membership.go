package store

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/store/sqlite"
)

// Membership identifies one direct child of a room or group.
type Membership struct {
	Type device.TargetType
	ID   string
}

type membershipReader interface {
	GetDevice(context.Context, device.DeviceID) (device.Device, error)
	GetGroup(context.Context, string) (Group, error)
	GetRoom(context.Context, string) (Room, error)
	ListGroupMembers(context.Context, string) ([]GroupMember, error)
	ListRoomMembers(context.Context, string) ([]RoomMember, error)
}

// ValidateMembership checks references and prevents cycles across rooms and groups.
func ValidateMembership(ctx context.Context, s membershipReader, parent, child Membership) error {
	if child.ID == "" {
		return fmt.Errorf("member ID is required")
	}
	switch child.Type {
	case device.TargetDevice:
		_, err := s.GetDevice(ctx, device.DeviceID(child.ID))
		return err
	case device.TargetGroup:
		if _, err := s.GetGroup(ctx, child.ID); err != nil {
			return err
		}
	case device.TargetRoom:
		if parent.Type != device.TargetGroup {
			return device.ErrInvalidRoomMemberType
		}
		if _, err := s.GetRoom(ctx, child.ID); err != nil {
			return err
		}
	default:
		return fmt.Errorf("invalid member type %q", child.Type)
	}
	visited := map[Membership]bool{}
	var walk func(Membership) error
	walk = func(current Membership) error {
		if current == parent {
			return device.ErrCircularDependency
		}
		if visited[current] {
			return nil
		}
		visited[current] = true
		if current.Type == device.TargetGroup {
			members, err := s.ListGroupMembers(ctx, current.ID)
			if err != nil {
				return err
			}
			for _, m := range members {
				if m.MemberType != device.GroupMemberDevice {
					if err := walk(Membership{device.TargetType(m.MemberType), m.MemberID}); err != nil {
						return err
					}
				}
			}
		} else if current.Type == device.TargetRoom {
			members, err := s.ListRoomMembers(ctx, current.ID)
			if err != nil {
				return err
			}
			for _, m := range members {
				if m.MemberType == device.RoomMemberGroup {
					if err := walk(Membership{device.TargetGroup, m.MemberID}); err != nil {
						return err
					}
				}
			}
		}
		return nil
	}
	return walk(child)
}

func (s *DB) replaceMembership(ctx context.Context, parent Membership, children []Membership) error {
	desired := map[Membership]bool{}
	for _, child := range children {
		if desired[child] {
			return fmt.Errorf("duplicate member %s %q", child.Type, child.ID)
		}
		if err := ValidateMembership(ctx, s, parent, child); err != nil {
			return err
		}
		desired[child] = true
	}
	existing := map[Membership]string{}
	if parent.Type == device.TargetGroup {
		g, err := s.GetGroup(ctx, parent.ID)
		if err != nil {
			return err
		}
		if g.Provider != GroupProviderHive {
			return fmt.Errorf("provider group membership is read-only")
		}
		members, err := s.ListGroupMembers(ctx, parent.ID)
		if err != nil {
			return err
		}
		for _, m := range members {
			existing[Membership{device.TargetType(m.MemberType), m.MemberID}] = m.ID
		}
	} else {
		members, err := s.ListRoomMembers(ctx, parent.ID)
		if err != nil {
			return err
		}
		for _, m := range members {
			existing[Membership{device.TargetType(m.MemberType), m.MemberID}] = m.ID
		}
	}
	for child, id := range existing {
		if desired[child] {
			continue
		}
		var err error
		if parent.Type == device.TargetGroup {
			err = s.q.RemoveGroupMember(ctx, id)
		} else {
			err = s.q.RemoveRoomMember(ctx, id)
		}
		if err != nil {
			return err
		}
	}
	for _, child := range children {
		if _, ok := existing[child]; ok {
			continue
		}
		var err error
		if parent.Type == device.TargetGroup {
			err = s.q.AddGroupMember(ctx, sqlite.AddGroupMemberParams{ID: uuid.NewString(), GroupID: parent.ID, MemberType: device.GroupMemberType(child.Type), MemberID: child.ID})
		} else {
			err = s.q.AddRoomMember(ctx, sqlite.AddRoomMemberParams{ID: uuid.NewString(), RoomID: parent.ID, MemberType: device.RoomMemberType(child.Type), MemberID: child.ID})
		}
		if err != nil {
			return err
		}
	}
	return nil
}
