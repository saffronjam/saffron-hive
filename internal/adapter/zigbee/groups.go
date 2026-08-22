package zigbee

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

func (a *ZigbeeAdapter) handleBridgeGroups(payload []byte) {
	snapshot, err := parseBridgeGroups(payload)
	if err != nil {
		logger.Warn("failed to parse bridge/groups", "error", err)
		return
	}
	a.bus.Publish(eventbus.Event{
		Type:      eventbus.EventProviderGroupsSynced,
		Timestamp: time.Now(),
		Payload:   snapshot,
	})
}

func parseBridgeGroups(payload []byte) (device.ProviderGroupsSnapshot, error) {
	var raw []z2mBridgeGroup
	if err := json.Unmarshal(payload, &raw); err != nil {
		return device.ProviderGroupsSnapshot{}, err
	}

	groups := make([]device.ProviderGroup, 0, len(raw))
	groupIDs := make(map[int]struct{}, len(raw))
	for _, group := range raw {
		if group.ID <= 0 {
			return device.ProviderGroupsSnapshot{}, fmt.Errorf("invalid group id %d", group.ID)
		}
		if _, exists := groupIDs[group.ID]; exists {
			return device.ProviderGroupsSnapshot{}, fmt.Errorf("duplicate group id %d", group.ID)
		}
		groupIDs[group.ID] = struct{}{}
		name := strings.TrimSpace(group.FriendlyName)
		if name == "" {
			return device.ProviderGroupsSnapshot{}, fmt.Errorf("group %d has no friendly name", group.ID)
		}

		members := make([]device.ProviderGroupMember, 0, len(group.Members))
		seenMembers := make(map[string]struct{}, len(group.Members))
		for _, member := range group.Members {
			ieee := strings.TrimSpace(member.IEEEAddress)
			if ieee == "" || member.Endpoint <= 0 {
				return device.ProviderGroupsSnapshot{}, fmt.Errorf("group %d has an invalid member", group.ID)
			}
			key := ieee + ":" + strconv.Itoa(member.Endpoint)
			if _, exists := seenMembers[key]; exists {
				continue
			}
			seenMembers[key] = struct{}{}
			members = append(members, device.ProviderGroupMember{
				DeviceID: device.DeviceID(ieee),
				Endpoint: member.Endpoint,
			})
		}
		groups = append(groups, device.ProviderGroup{
			ProviderGroupID: strconv.Itoa(group.ID),
			Name:            name,
			Members:         members,
		})
	}

	return device.ProviderGroupsSnapshot{
		Provider: "zigbee2mqtt",
		Groups:   groups,
	}, nil
}
