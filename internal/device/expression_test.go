package device

import (
	"context"
	"reflect"
	"testing"
)

type stubResolver struct {
	rooms  map[string][]DeviceID
	groups map[string][]DeviceID
}

func (s stubResolver) ResolveTargetDeviceIDs(_ context.Context, t TargetType, id string) []DeviceID {
	switch t {
	case TargetRoom:
		return s.rooms[id]
	case TargetGroup:
		return s.groups[id]
	case TargetDevice:
		return []DeviceID{DeviceID(id)}
	}
	return nil
}

func evalFixture() (*MemoryStore, stubResolver) {
	s := NewMemoryStore()
	s.Register(Device{ID: "lamp", Type: Light})
	s.Register(Device{ID: "fan", Type: Plug})
	s.Register(Device{ID: "lamp-plug", Type: Plug, Tags: []DeviceTag{DeviceTagLight}})
	s.Register(Device{ID: "temp", Type: Sensor})
	res := stubResolver{
		rooms:  map[string][]DeviceID{"living": {"lamp", "fan", "lamp-plug", "temp"}},
		groups: map[string][]DeviceID{"flowers": {"lamp", "lamp-plug"}},
	}
	return s, res
}

func TestEvaluateExpression_RoomAndDeviceType(t *testing.T) {
	s, res := evalFixture()
	expr := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceType, Op: OpIs, Values: []string{"light"}},
	}
	got := EvaluateExpression(context.Background(), s, res, expr)
	if want := []DeviceID{"lamp"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestEvaluateExpression_RoomAndDeviceRoleCatchesTaggedPlug(t *testing.T) {
	s, res := evalFixture()
	expr := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceRole, Op: OpIs, Values: []string{"light"}},
	}
	got := EvaluateExpression(context.Background(), s, res, expr)
	if want := []DeviceID{"lamp", "lamp-plug"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v (role should catch the LIGHT-tagged plug)", got, want)
	}
}

func TestEvaluateExpression_IsNotExcludes(t *testing.T) {
	s, res := evalFixture()
	expr := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceType, Op: OpIsNot, Values: []string{"sensor"}},
	}
	got := EvaluateExpression(context.Background(), s, res, expr)
	if want := []DeviceID{"fan", "lamp", "lamp-plug"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestEvaluateExpression_LeftToRightFold(t *testing.T) {
	s, res := evalFixture()
	// (group flowers OR device temp) AND device_type plug
	// flowers = {lamp, lamp-plug}; ∪ temp = {lamp, lamp-plug, temp};
	// ∩ plug = {lamp-plug}
	expr := Expression{
		{Subject: SubjectGroup, Op: OpIs, Values: []string{"flowers"}},
		{Connector: ConnectorOr, Subject: SubjectDevice, Op: OpIs, Values: []string{"temp"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceType, Op: OpIs, Values: []string{"plug"}},
	}
	got := EvaluateExpression(context.Background(), s, res, expr)
	if want := []DeviceID{"lamp-plug"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestEvaluateExpression_Empty(t *testing.T) {
	s, res := evalFixture()
	if got := EvaluateExpression(context.Background(), s, res, nil); got != nil {
		t.Fatalf("empty expression should match nothing, got %v", got)
	}
}

func TestValidateExpression(t *testing.T) {
	good := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceType, Op: OpIs, Values: []string{"light"}},
	}
	if err := ValidateExpression(good); err != nil {
		t.Fatalf("valid expression rejected: %v", err)
	}

	bad := []Expression{
		{{Subject: "bogus", Op: OpIs, Values: []string{"x"}}},
		{{Subject: SubjectRoom, Op: "maybe", Values: []string{"x"}}},
		{{Subject: SubjectRoom, Op: OpIs, Values: nil}},
		{{Connector: ConnectorAnd, Subject: SubjectRoom, Op: OpIs, Values: []string{"x"}}},
		{{Subject: SubjectDeviceType, Op: OpIs, Values: []string{"unknown"}}},
		{
			{Subject: SubjectRoom, Op: OpIs, Values: []string{"x"}},
			{Subject: SubjectRoom, Op: OpIs, Values: []string{"y"}}, // missing connector
		},
	}
	for i, e := range bad {
		if err := ValidateExpression(e); err == nil {
			t.Fatalf("bad expression %d accepted", i)
		}
	}
}
