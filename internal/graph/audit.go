package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
	"strconv"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/audit"
	"github.com/saffronjam/saffron-hive/internal/auth"
	"github.com/saffronjam/saffron-hive/internal/store"
	"github.com/vektah/gqlparser/v2/ast"
	"github.com/vektah/gqlparser/v2/parser"
)

// AuditStore records operations and reads native committed changes.
type AuditStore interface {
	BeginAudit(context.Context, string, string) (context.Context, error)
	FinishAudit(context.Context, string) error
	AuditEvents(context.Context, store.AuditFilter) ([]store.AuditEvent, error)
	AuditCursor(context.Context) (int64, error)
	AuditFloor(context.Context) (int64, error)
	PruneAudit(context.Context) error
}

func (r *Resolver) auditMutation(ctx context.Context, next graphql.Resolver) (any, error) {
	fc := graphql.GetFieldContext(ctx)
	if r.Audit == nil || fc == nil || fc.Object != "Mutation" || strings.Contains(strings.ToLower(fc.Field.Name), "assistant") {
		return next(ctx)
	}
	o := audit.FromContext(ctx)
	if o.OperationID != "" {
		return next(ctx)
	}
	if p, ok := auth.PrincipalFromContext(ctx); ok {
		o.ActorID = p.ID
		o.ActorName = p.Name
		if o.ActorName == "" {
			o.ActorName = p.Username
		}
		o.Source = "human"
	} else {
		o.Source = "anonymous"
		o.ActorName = "Unauthenticated"
	}
	ctx = audit.WithOrigin(ctx, o)
	args, err := json.Marshal(fc.Field.ArgumentMap(graphql.GetOperationContext(ctx).Variables))
	if err != nil {
		return nil, err
	}
	ctx, err = r.Audit.BeginAudit(ctx, fc.Field.Name, string(audit.Sanitize(args)))
	if err != nil {
		return nil, err
	}
	result, callErr := next(ctx)
	if payload, ok := result.(*model.AuthPayload); ok && callErr == nil && payload.User != nil {
		verified := audit.FromContext(ctx)
		verified.ActorID = payload.User.ID
		verified.ActorName = payload.User.Name
		verified.Source = "human"
		ctx = audit.WithOrigin(ctx, verified)
	}
	status := "succeeded"
	switch fc.Field.Name {
	case "startCleaning", "controlCleaning", "setTargetState", "setDeviceConfiguration", "runDeviceCommand", "applyScene", "runEffect", "runNativeEffect":
		status = "accepted"
	}
	if callErr != nil {
		status = "failed"
	}
	switch result := result.(type) {
	case *model.Zigbee2MqttConfigResult:
		if result.Application != nil && !result.Application.Success {
			status = "partial"
		}
	case *model.DreameConfigResult:
		if result.Application != nil && !result.Application.Success {
			status = "partial"
		}
	case *model.TuyaConfigResult:
		if result.Application != nil && !result.Application.Success {
			status = "partial"
		}
	}
	if err := r.Audit.FinishAudit(context.WithoutCancel(ctx), status); err != nil {
		return nil, err
	}
	return result, callErr
}

func auditSequence(cursor *string) (int64, error) {
	if cursor == nil || *cursor == "" {
		return 0, nil
	}
	return strconv.ParseInt(*cursor, 10, 64)
}
func auditTime(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format(time.RFC3339Nano)
}

func (r *Resolver) auditFilter(ctx context.Context, in *model.AuditFilter) (store.AuditFilter, error) {
	p, ok := auth.PrincipalFromContext(ctx)
	if !ok || p.Guest {
		return store.AuditFilter{}, fmt.Errorf("audit access requires a registered user")
	}
	f := store.AuditFilter{ReaderID: p.ID}
	str := func(v *string) string {
		if v == nil {
			return ""
		}
		return *v
	}
	if in != nil {
		f.OperationID = str(in.OperationID.Value())
		f.Status = str(in.Status.Value())
		f.EntityType = str(in.EntityType.Value())
		f.EntityID = str(in.EntityID.Value())
		f.ActorID = str(in.ActorID.Value())
		f.Source = str(in.Source.Value())
		f.Action = str(in.Action.Value())
		f.Search = str(in.Search.Value())
		f.Since = auditTime(in.Since.Value())
	}
	return f, nil
}
func (r *Resolver) auditPage(ctx context.Context, f store.AuditFilter) (*model.AuditPage, error) {
	if r.Audit == nil {
		return nil, fmt.Errorf("audit service is unavailable")
	}
	water, err := r.Audit.AuditCursor(ctx)
	if err != nil {
		return nil, err
	}
	if f.Forward {
		floor, err := r.Audit.AuditFloor(ctx)
		if err != nil {
			return nil, err
		}
		if f.After < floor-1 || f.After > water {
			return &model.AuditPage{Entries: []*model.AuditEntry{}, Cursor: strconv.FormatInt(water, 10), ResetRequired: true}, nil
		}
	}
	if f.Before == 0 {
		f.Before = water + 1
	}
	if f.Limit <= 0 {
		f.Limit = 50
	}
	if f.Limit > 200 {
		f.Limit = 200
	}
	rows, err := r.Audit.AuditEvents(ctx, f)
	if err != nil {
		return nil, err
	}
	page := &model.AuditPage{Entries: []*model.AuditEntry{}, Cursor: strconv.FormatInt(water, 10), HasMore: len(rows) == f.Limit}
	for _, e := range rows {
		entry := &model.AuditEntry{ID: strconv.FormatInt(e.Sequence, 10), Details: e.Details, OperationID: e.OperationID, ParentOperationID: e.ParentOperationID, RunID: e.RunID, ActionID: e.ActionID, Timestamp: e.RecordedAt, EntityType: e.EntityType, EntityID: e.EntityID, EntityName: e.EntityName, Action: e.Action, ActorID: e.ActorID, ActorName: e.ActorName, Source: e.Source, Operation: e.Field, Status: e.Status, ConversationID: e.ConversationID, Before: e.Before, After: e.After, Proposed: e.Proposed, Changes: []*model.AuditChange{}}
		diff := store.AuditDiff(e)
		if e.EntityType == "delivery" {
			diff = nil
		}
		for _, d := range diff {
			entry.Changes = append(entry.Changes, &model.AuditChange{Path: d.Path, Before: string(d.Before), After: string(d.After)})
		}
		page.Entries = append(page.Entries, entry)
	}
	if f.Forward && page.HasMore {
		page.Cursor = page.Entries[len(page.Entries)-1].ID
	}
	return page, nil
}
func (r *Resolver) streamAudit(ctx context.Context, filter *model.AuditFilter, after string) (<-chan *model.AuditPage, error) {
	f, err := r.auditFilter(ctx, filter)
	if err != nil {
		return nil, err
	}
	cursor, err := strconv.ParseInt(after, 10, 64)
	if err != nil || cursor < 0 {
		return nil, fmt.Errorf("invalid audit cursor")
	}
	f.Forward = true
	f.After = cursor
	f.Limit = 200
	out := make(chan *model.AuditPage, 1)
	go func() {
		defer close(out)
		ticker := time.NewTicker(time.Second)
		defer ticker.Stop()
		for {
			page, err := r.auditPage(ctx, f)
			if err != nil {
				return
			}
			if page.Cursor != strconv.FormatInt(f.After, 10) {
				select {
				case out <- page:
				case <-ctx.Done():
					return
				}
				f.After, _ = strconv.ParseInt(page.Cursor, 10, 64)
				if page.HasMore {
					continue
				}
			}
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}
	}()
	return out, nil
}

type auditValidatedKey struct{}

// AuditOperationContext distinguishes executed operations from validation failures.
func AuditOperationContext(ctx context.Context, next graphql.OperationHandler) graphql.ResponseHandler {
	return next(context.WithValue(ctx, auditValidatedKey{}, true))
}

// AuditRejectedResponses records recognized mutation attempts rejected before execution.
func (r *Resolver) AuditRejectedResponses(schema *ast.Schema) graphql.ResponseMiddleware {
	return func(ctx context.Context, next graphql.ResponseHandler) *graphql.Response {
		response := next(ctx)
		if r.Audit == nil || response == nil || len(response.Errors) == 0 || ctx.Value(auditValidatedKey{}) != nil || !graphql.HasOperationContext(ctx) || audit.FromContext(ctx).OperationID != "" {
			return response
		}
		op := graphql.GetOperationContext(ctx)
		doc, err := parser.ParseQuery(&ast.Source{Input: op.RawQuery})
		if err != nil {
			return response
		}
		operation := doc.Operations.ForName(op.OperationName)
		if operation == nil || operation.Operation != ast.Mutation {
			return response
		}
		for _, field := range rootFields(doc, operation.SelectionSet) {
			if schema.Mutation.Fields.ForName(field.Name) == nil || strings.Contains(strings.ToLower(field.Name), "assistant") {
				continue
			}
			origin := audit.Origin{Source: "anonymous", ActorName: "Unauthenticated"}
			if p, ok := auth.PrincipalFromContext(ctx); ok {
				origin.Source = "human"
				origin.ActorID = p.ID
				origin.ActorName = p.Name
			}
			attempt, err := r.Audit.BeginAudit(audit.WithOrigin(ctx, origin), field.Name, "{}")
			if err == nil {
				err = r.Audit.FinishAudit(context.WithoutCancel(attempt), "denied")
			}
			if err != nil {
				graphLogger.Error("Rejected operation audit failed", "error", err)
			}
		}
		return response
	}
}
