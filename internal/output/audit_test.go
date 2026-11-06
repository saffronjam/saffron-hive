package output

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/device"
)

type auditRecorderFixture struct {
	failure       error
	stages        []string
	before, after device.DeviceState
	operation     string
}

func (a *auditRecorderFixture) BeginAudit(ctx context.Context, _, _ string) (context.Context, error) {
	o := audit.FromContext(ctx)
	o.OperationID = "intent"
	return audit.WithOrigin(ctx, o), a.failure
}
func (a *auditRecorderFixture) RecordAuditDelivery(_ context.Context, stage string, _ device.OutputDelivery) error {
	a.stages = append(a.stages, stage)
	return nil
}
func (a *auditRecorderFixture) RecordAuditState(_ context.Context, operation string, _ device.DeviceID, before, after device.DeviceState, _ device.OutputClass) error {
	a.operation, a.before, a.after = operation, before, after
	return nil
}

func TestAuditUnavailableBlocksPhysicalOutput(t *testing.T) {
	c, _, _, actuator, _, _ := newFixture(device.Device{ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapBrightness)}})
	recorder := &auditRecorderFixture{failure: errors.New("storage unavailable")}
	c.SetAudit(recorder)
	err := c.CommandTarget(t.Context(), device.TargetCommand{TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{Brightness: device.Ptr(42)}})
	if err == nil || c.dispatchOne(t.Context(), time.Now()) || len(actuator.states) != 0 {
		t.Fatal("output survived intent persistence failure")
	}
}

func TestAuditRecordsOnlyConfirmedCommandFields(t *testing.T) {
	c, _, reader, _, _, _ := newFixture(device.Device{ID: "lamp", Source: device.SourceZigbee2MQTT, Capabilities: []device.Capability{writable(device.CapBrightness)}})
	reader.UpdateDeviceState("lamp", device.DeviceState{Brightness: device.Ptr(10), Battery: device.Ptr(80.0)})
	recorder := &auditRecorderFixture{}
	c.SetAudit(recorder)
	if err := c.CommandTarget(t.Context(), device.TargetCommand{TargetType: device.TargetDeviceSet, DeviceIDs: []device.DeviceID{"lamp"}, State: device.Command{Brightness: device.Ptr(42)}}); err != nil {
		t.Fatal(err)
	}
	if recorder.operation != "" {
		t.Fatal("accepted intent became confirmed state")
	}
	c.dispatchOne(t.Context(), time.Now())
	c.ObserveState("lamp", device.DeviceState{Brightness: device.Ptr(42), Battery: device.Ptr(79.0)})
	if recorder.operation != "intent" || recorder.before.Brightness == nil || *recorder.before.Brightness != 10 || recorder.after.Brightness == nil || *recorder.after.Brightness != 42 || recorder.after.Battery != nil {
		t.Fatalf("confirmation contains unrelated state: %+v -> %+v", recorder.before, recorder.after)
	}
	if len(recorder.stages) != 2 || recorder.stages[0] != "command.dispatched" || recorder.stages[1] != "command.confirmed" {
		t.Fatalf("lifecycle=%v", recorder.stages)
	}
}
