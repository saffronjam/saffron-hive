// Package cleaning models room-based cleaning independently of the device provider.
package cleaning

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
)

// RoomLink assigns a Hive room to one cleaning area on a saved robot map.
type RoomLink struct {
	RoomID string `json:"roomId"`
	AreaID string `json:"areaId"`
}

// Options contains explicit overrides; nil preserves the robot's setting.
type Options struct {
	Suction *int `json:"suction,omitempty"`
	Water   *int `json:"water,omitempty"`
	Repeats int  `json:"repeats"`
}

// Scope identifies the physical extent of a cleaning task.
type Scope int

const (
	ScopeRooms Scope = iota
	ScopeApartment
)

// Plan is the complete, deterministic result of resolving selected Hive rooms.
type Plan struct {
	Scope    Scope    `json:"scope"`
	DeviceID string   `json:"deviceId"`
	MapID    string   `json:"mapId"`
	RoomIDs  []string `json:"roomIds"`
	AreaIDs  []string `json:"areaIds"`
	Options  Options  `json:"options"`
	Revision string   `json:"revision"`
}

// Prepare expands shared cleaning areas until every affected Hive room is selected.
func Prepare(deviceID, mapID string, linkRevision int64, links []RoomLink, availableAreas, selectedRooms []string, options Options, scope Scope) (Plan, error) {
	p := Plan{Scope: scope, DeviceID: deviceID, MapID: mapID, Options: options}
	if scope != ScopeRooms && scope != ScopeApartment {
		return p, errors.New("unsupported cleaning scope")
	}
	if deviceID == "" || mapID == "" || linkRevision < 0 {
		return p, errors.New("select an available cleaning map")
	}
	if options.Repeats == 0 {
		p.Options.Repeats = 1
	}
	if err := p.Options.Validate(); err != nil {
		return p, err
	}
	areas := make(map[string]bool, len(availableAreas))
	for _, id := range availableAreas {
		areas[id] = true
	}
	byRoom := map[string][]string{}
	byArea := map[string][]string{}
	for _, link := range links {
		if link.RoomID == "" || link.AreaID == "" {
			return p, errors.New("room links must identify a room and cleaning area")
		}
		if !areas[link.AreaID] {
			return p, fmt.Errorf("room %q needs its cleaning link reviewed", link.RoomID)
		}
		byRoom[link.RoomID] = append(byRoom[link.RoomID], link.AreaID)
		byArea[link.AreaID] = append(byArea[link.AreaID], link.RoomID)
	}
	if scope == ScopeApartment {
		selectedRooms = make([]string, 0, len(byRoom))
		for id := range byRoom {
			selectedRooms = append(selectedRooms, id)
		}
	}
	if len(selectedRooms) == 0 {
		return p, errors.New("select at least one Hive room")
	}
	rooms := map[string]bool{}
	destinations := map[string]bool{}
	if scope == ScopeApartment {
		for id := range areas {
			destinations[id] = true
		}
	}
	queue := append([]string(nil), selectedRooms...)
	for len(queue) > 0 {
		room := queue[0]
		queue = queue[1:]
		if rooms[room] {
			continue
		}
		if len(byRoom[room]) == 0 {
			return p, fmt.Errorf("room %q has no cleaning link", room)
		}
		rooms[room] = true
		for _, area := range byRoom[room] {
			destinations[area] = true
			queue = append(queue, byArea[area]...)
		}
	}
	for room := range rooms {
		p.RoomIDs = append(p.RoomIDs, room)
	}
	for area := range destinations {
		p.AreaIDs = append(p.AreaIDs, area)
	}
	sort.Strings(p.RoomIDs)
	sort.Strings(p.AreaIDs)
	canonical := struct {
		Plan         Plan
		LinkRevision int64
	}{p, linkRevision}
	raw, _ := json.Marshal(canonical)
	sum := sha256.Sum256(raw)
	p.Revision = hex.EncodeToString(sum[:])
	return p, nil
}

// RoomLinks is one saved map's user-confirmed assignment set.
type RoomLinks struct {
	Revision    int64
	MapID       string
	MapRevision string
	Links       []RoomLink
}

// RoomIdentity is the naming context needed to validate and present cleaning targets.
type RoomIdentity struct {
	ID   string
	Name string
}

// Validate checks supported task options. Zero repeats uses one pass.
func (o Options) Validate() error {
	if o.Repeats < 0 || o.Repeats > 3 {
		return errors.New("repeat count must be between 1 and 3")
	}
	if o.Suction != nil && (*o.Suction < 0 || *o.Suction > 3) {
		return errors.New("unsupported suction level")
	}
	if o.Water != nil && (*o.Water < 1 || *o.Water > 3) {
		return errors.New("unsupported water level")
	}
	return nil
}
