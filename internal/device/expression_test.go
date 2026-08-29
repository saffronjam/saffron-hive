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
	s.Register(Device{ID: "lamp", Type: Light, Capabilities: []Capability{
		{Name: CapOnOff, Access: CapabilityAccessState | CapabilityAccessSet},
		{Name: CapBrightness, Access: CapabilityAccessState | CapabilityAccessSet},
		{Name: CapColor, Access: CapabilityAccessState | CapabilityAccessSet},
		{Name: CapColorTemp, Access: CapabilityAccessState},
	}})
	s.Register(Device{ID: "fan", Type: Plug, Capabilities: []Capability{{Name: CapOnOff, Access: 3}}})
	s.Register(Device{ID: "lamp-plug", Type: Plug, Capabilities: []Capability{{Name: CapOnOff, Access: 3}}, Roles: DeviceRoles{ControlledLoad: Ptr(ControlledLoadRoleLight)}})
	s.Register(Device{ID: "temp", Type: Sensor})
	s.Register(Device{ID: "future", Type: Sensor, Capabilities: []Capability{{Name: "future_capability_2", Access: CapabilityAccessSet}}})
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

func TestEvaluateExpression_RoomAndDeviceRoleCatchesLightPlug(t *testing.T) {
	s, res := evalFixture()
	expr := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectDeviceRole, Op: OpIs, Values: []string{"light"}},
	}
	got := EvaluateExpression(context.Background(), s, res, expr)
	if want := []DeviceID{"lamp", "lamp-plug"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func TestEvaluateExpression_SemanticRoles(t *testing.T) {
	s := NewMemoryStore()
	s.Register(Device{ID: "climate", Type: Climate})
	s.Register(Device{
		ID:           "appliance-plug",
		Type:         Plug,
		Capabilities: []Capability{{Name: CapOnOff, Access: 3}},
	})
	s.Register(Device{
		ID:           "door",
		Type:         Sensor,
		Capabilities: []Capability{{Name: CapContact, Access: 1}},
		Roles:        DeviceRoles{Contact: Ptr(ContactRoleDoor)},
	})
	s.Register(Device{
		ID:           "general-contact",
		Type:         Sensor,
		Capabilities: []Capability{{Name: CapContact, Access: 1}},
	})
	res := stubResolver{}

	appliances := Expression{{Subject: SubjectDeviceRole, Op: OpIs, Values: []string{"appliance"}}}
	if got := EvaluateExpression(context.Background(), s, res, appliances); !reflect.DeepEqual(got, []DeviceID{"appliance-plug", "climate"}) {
		t.Fatalf("appliance role = %v", got)
	}
	doors := Expression{{Subject: SubjectDeviceRole, Op: OpIs, Values: []string{"door"}}}
	if got := EvaluateExpression(context.Background(), s, res, doors); !reflect.DeepEqual(got, []DeviceID{"door"}) {
		t.Fatalf("door role = %v", got)
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

func TestEvaluateExpression_CapabilityAccess(t *testing.T) {
	s, res := evalFixture()

	writableColor := Expression{{Subject: SubjectWritableCapability, Op: OpIs, Values: []string{CapColor}}}
	if got := EvaluateExpression(context.Background(), s, res, writableColor); !reflect.DeepEqual(got, []DeviceID{"lamp"}) {
		t.Fatalf("writable color = %v", got)
	}

	reportedTemp := Expression{{Subject: SubjectReportedCapability, Op: OpIs, Values: []string{CapColorTemp}}}
	if got := EvaluateExpression(context.Background(), s, res, reportedTemp); !reflect.DeepEqual(got, []DeviceID{"lamp"}) {
		t.Fatalf("reported color temp = %v", got)
	}

	writableTemp := Expression{{Subject: SubjectWritableCapability, Op: OpIs, Values: []string{CapColorTemp}}}
	if got := EvaluateExpression(context.Background(), s, res, writableTemp); len(got) != 0 {
		t.Fatalf("writable color temp = %v", got)
	}

	roomAndWritable := Expression{
		{Subject: SubjectRoom, Op: OpIs, Values: []string{"living"}},
		{Connector: ConnectorAnd, Subject: SubjectWritableCapability, Op: OpIsOneOf, Values: []string{CapColor, CapBrightness}},
	}
	if got := EvaluateExpression(context.Background(), s, res, roomAndWritable); !reflect.DeepEqual(got, []DeviceID{"lamp"}) {
		t.Fatalf("room and writable = %v", got)
	}

	notWritableColor := Expression{{Subject: SubjectWritableCapability, Op: OpIsNot, Values: []string{CapColor}}}
	if got := EvaluateExpression(context.Background(), s, res, notWritableColor); !reflect.DeepEqual(got, []DeviceID{"fan", "future", "lamp-plug", "temp"}) {
		t.Fatalf("not writable color = %v", got)
	}

	futureCapability := Expression{{Subject: SubjectWritableCapability, Op: OpIs, Values: []string{"future_capability_2"}}}
	if got := EvaluateExpression(context.Background(), s, res, futureCapability); !reflect.DeepEqual(got, []DeviceID{"future"}) {
		t.Fatalf("future writable capability = %v", got)
	}

	noneOf := Expression{{Subject: SubjectReportedCapability, Op: OpIsNotOneOf, Values: []string{CapColor, CapColorTemp}}}
	if got := EvaluateExpression(context.Background(), s, res, noneOf); !reflect.DeepEqual(got, []DeviceID{"fan", "future", "lamp-plug", "temp"}) {
		t.Fatalf("reports none of = %v", got)
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
		{Connector: ConnectorAnd, Subject: SubjectDeviceRole, Op: OpIsOneOf, Values: []string{"light", "appliance", "door", "window"}},
		{Connector: ConnectorAnd, Subject: SubjectWritableCapability, Op: OpIsOneOf, Values: []string{"color", "future_capability_2"}},
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
		{{Subject: SubjectDeviceType, Op: OpIs, Values: []string{"door"}}},
		{{Subject: SubjectWritableCapability, Op: OpIs, Values: []string{"Color"}}},
		{{Subject: SubjectReportedCapability, Op: OpIs, Values: []string{"_color"}}},
		{{Subject: SubjectReportedCapability, Op: OpIs, Values: []string{"color_"}}},
		{{Subject: SubjectReportedCapability, Op: OpIs, Values: []string{"2color"}}},
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
	if got := EvaluateExpression(context.Background(), s, res, notLight); !reflect.DeepEqual(got, []DeviceID{"future", "lamp-plug", "temp"}) {
		t.Errorf("is_not light: got %v, want [future lamp-plug temp]", got)
	}

	setDisabled(t, s, "fan", false)
	if got := EvaluateExpression(context.Background(), s, res, role); !reflect.DeepEqual(got, []DeviceID{"fan", "lamp-plug"}) {
		t.Errorf("after re-enable: got %v, want [fan lamp-plug]", got)
	}
}

func TestEvaluateExpression_DeletedExcludedFromUniverse(t *testing.T) {
	s, res := evalFixture()
	d, ok := s.GetDevice("lamp")
	if !ok {
		t.Fatal("lamp not registered")
	}
	d.Deleted = true
	s.UpdateUserFields(d)

	writable := Expression{{Subject: SubjectWritableCapability, Op: OpIs, Values: []string{CapColor}}}
	if got := EvaluateExpression(context.Background(), s, res, writable); len(got) != 0 {
		t.Fatalf("deleted writable match = %v", got)
	}
	notWritable := Expression{{Subject: SubjectWritableCapability, Op: OpIsNot, Values: []string{CapColor}}}
	if got := EvaluateExpression(context.Background(), s, res, notWritable); !reflect.DeepEqual(got, []DeviceID{"fan", "future", "lamp-plug", "temp"}) {
		t.Fatalf("deleted negative match = %v", got)
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
