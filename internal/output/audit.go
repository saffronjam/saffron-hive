package output

import (
	"context"
	"encoding/json"

	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
)

// AuditRecorder persists intent before scheduling and lifecycle outcomes.
type AuditRecorder interface {
	BeginAudit(context.Context, string, string) (context.Context, error)
	RecordAuditDelivery(context.Context, string, device.OutputDelivery) error
	RecordAuditState(context.Context, string, device.DeviceID, device.DeviceState, device.DeviceState, device.OutputClass) error
}

func (c *Controller) SetAudit(recorder AuditRecorder) { c.audit = recorder }

type auditedRequest interface {
	device.TargetCommand | device.ConfigurationRequest | device.DeviceCommandRequest
}

func auditRequest[T auditedRequest](c *Controller, ctx context.Context, origin *device.CommandOrigin, field string, request T) error {
	if c.audit == nil {
		return nil
	}
	o := audit.FromContext(ctx)
	if origin.AuditID != "" {
		o.OperationID = origin.AuditID
	}
	if origin.Kind == device.OriginKindScene || origin.Kind == device.OriginKindEffect {
		o = audit.FromContext(audit.RunContext(audit.WithOrigin(ctx, o), origin.Kind, origin.ID))
	}
	if o.Source == "" {
		o.Source = origin.Kind
		o.ActorID = origin.ID
		o.ActorName = origin.Kind + " " + origin.ID
	}
	raw, err := json.Marshal(request)
	if err != nil {
		return err
	}
	ctx, err = c.audit.BeginAudit(audit.WithOrigin(ctx, o), field, string(audit.Sanitize(raw)))
	if err != nil {
		return err
	}
	origin.AuditID = audit.FromContext(ctx).OperationID
	return nil
}
func (c *Controller) publish(event eventbus.Event) {
	if delivery, ok := event.Payload.(device.OutputDelivery); ok && c.audit != nil && delivery.Origin.AuditID != "" {
		if err := c.audit.RecordAuditDelivery(context.Background(), string(event.Type), delivery); err != nil {
			logger.Error("Audit delivery persistence failed", "error", err, "operation_id", delivery.Origin.AuditID)
		}
	}
	c.bus.Publish(event)
}

func commandAuditState(command device.Command, state device.DeviceState) device.DeviceState {
	result := device.DeviceState{}
	if command.On != nil {
		result.On = state.On
	}
	if command.Brightness != nil {
		result.Brightness = state.Brightness
	}
	if command.ColorTemp != nil {
		result.ColorTemp = state.ColorTemp
	}
	if command.Color != nil {
		result.Color = state.Color
	}
	if command.TargetTemperature != nil {
		result.TargetTemperature = state.TargetTemperature
	}
	if command.HvacMode != nil {
		result.HvacMode = state.HvacMode
	}
	if command.FanMode != nil {
		result.FanMode = state.FanMode
	}
	if command.Swing != nil {
		result.Swing = state.Swing
	}
	return result
}

func (c *Controller) auditSuperseded(origin device.CommandOrigin, id device.DeviceID, class device.OutputClass) {
	if c.audit == nil || origin.AuditID == "" || class == device.OutputContinuous {
		return
	}
	event := device.OutputDelivery{DeviceID: id, Origin: origin, Class: class}
	if err := c.audit.RecordAuditDelivery(context.Background(), "superseded", event); err != nil {
		logger.Error("Superseded command audit failed", "error", err)
	}
}

func (c *Controller) auditRejected(origin device.CommandOrigin, id device.DeviceID, failure error) {
	if failure == nil || c.audit == nil || origin.AuditID == "" {
		return
	}
	event := device.OutputDelivery{DeviceID: id, Origin: origin, Class: classFor(origin), Error: "request_rejected"}
	if err := c.audit.RecordAuditDelivery(context.Background(), "command.rejected", event); err != nil {
		logger.Error("Rejected command audit failed", "error", err)
	}
}
