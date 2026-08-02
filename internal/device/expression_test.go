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

// TestEvaluateExpression_DisabledExcludedFromUniverse checks a disabled device
// is matched by neither an including clause nor the complement an is_not clause
// builds. Filtering only one of the two would let is_not resurrect it.
func TestEvaluateExpression_DisabledExcludedFromUniverse(t *testing.T) {
	s, res := evalFixture()
	setDisabled(t, s, "fan", true)

	role := Expression{{Subject: SubjectDeviceRole, Op: OpIsOneOf, Values: []string{"plug"}}}
	if got := EvaluateExpression(context.Background(), s, res, role); !reflect.DeepEqual(got, []DeviceID{"lamp-plug"}) {
		t.Errorf("is_one_of plug: got %v, want [lamp-plug]", got)
	}

	notLight := Expression{{Subject: SubjectDeviceType, Op: OpIsNot, Values: []string{"light"}}}
	if got := EvaluateExpression(context.Background(), s, res, notLight); !reflect.DeepEqual(got, []DeviceID{"lamp-plug", "temp"}) {
		t.Errorf("is_not light: got %v, want [lamp-plug temp]", got)
	}

	setDisabled(t, s, "fan", false)
	if got := EvaluateExpression(context.Background(), s, res, role); !reflect.DeepEqual(got, []DeviceID{"fan", "lamp-plug"}) {
		t.Errorf("after re-enable: got %v, want [fan lamp-plug]", got)
	}
}

// setDisabled flips a device's disabled flag through the same path the
// device.updated event takes, so the test exercises the production mechanism.
func setDisabled(t *testing.T, s *MemoryStore, id DeviceID, disabled bool) {
	t.Helper()
	d, ok := s.GetDevice(id)
	if !ok {
		t.Fatalf("device %s not registered", id)
	}
	d.Disabled = disabled
	s.UpdateUserFields(d)
}
