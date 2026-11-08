package cleaning

import (
	"reflect"
	"testing"
)

func TestPrepareExpandsSharedRoomsTransitively(t *testing.T) {
	links := []RoomLink{{"kitchen", "1"}, {"living", "1"}, {"living", "2"}, {"hall", "2"}, {"bedroom", "3"}}
	p, err := Prepare("robot", "map", 1, links, []string{"1", "2", "3"}, []string{"kitchen"}, Options{}, ScopeRooms)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(p.RoomIDs, []string{"hall", "kitchen", "living"}) || !reflect.DeepEqual(p.AreaIDs, []string{"1", "2"}) {
		t.Fatalf("wrong shared-area closure: %+v", p)
	}
	duplicate, err := Prepare("robot", "map", 1, links, []string{"3", "2", "1"}, []string{"hall", "living", "kitchen", "kitchen"}, Options{Repeats: 1}, ScopeRooms)
	if err != nil || duplicate.Revision != p.Revision {
		t.Fatalf("equivalent choices must have one revision: %+v %v", duplicate, err)
	}
	changed, _ := Prepare("robot", "map", 2, links, []string{"1", "2", "3"}, []string{"kitchen"}, Options{}, ScopeRooms)
	if changed.Revision == p.Revision {
		t.Fatal("room-link edit did not invalidate preparation")
	}
}
func TestPrepareRejectsMissingAndStaleDestinations(t *testing.T) {
	for _, rooms := range [][]string{nil, {"missing"}} {
		if _, err := Prepare("robot", "map", 1, []RoomLink{{"kitchen", "1"}}, []string{"1"}, rooms, Options{}, ScopeRooms); err == nil {
			t.Fatal("accepted missing destination")
		}
	}
	if _, err := Prepare("robot", "map", 1, []RoomLink{{"kitchen", "1"}}, []string{"2"}, []string{"kitchen"}, Options{}, ScopeRooms); err == nil {
		t.Fatal("accepted stale map binding")
	}
}
func TestPrepareDoesNotMutateCallerOptions(t *testing.T) {
	options := Options{}
	p, err := Prepare("robot", "map", 1, []RoomLink{{"kitchen", "1"}}, []string{"1"}, []string{"kitchen"}, options, ScopeRooms)
	if err != nil || p.Options.Repeats != 1 || options.Repeats != 0 {
		t.Fatalf("invalid defaults: %+v %v", p, err)
	}
}

func TestApartmentIncludesUnlinkedNativeAreas(t *testing.T) {
	links := []RoomLink{{RoomID: "kitchen", AreaID: "1"}}
	apartment, err := Prepare("robot", "map", 1, links, []string{"1", "2"}, nil, Options{}, ScopeApartment)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(apartment.AreaIDs, []string{"1", "2"}) || !reflect.DeepEqual(apartment.RoomIDs, []string{"kitchen"}) {
		t.Fatalf("partial apartment plan: %+v", apartment)
	}
	rooms, err := Prepare("robot", "map", 1, links, []string{"1", "2"}, []string{"kitchen"}, Options{}, ScopeRooms)
	if err != nil {
		t.Fatal(err)
	}
	if apartment.Revision == rooms.Revision || len(rooms.AreaIDs) != 1 {
		t.Fatal("apartment and room scopes were conflated")
	}
	if _, err := Prepare("robot", "map", 1, nil, []string{"1"}, nil, Options{}, ScopeApartment); err == nil {
		t.Fatal("apartment accepted an unconfigured vacuum")
	}
}
