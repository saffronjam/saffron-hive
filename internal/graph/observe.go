package graph

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/saffronjam/saffron-hive/internal/graph/model"
)

func (r *queryResolver) observe(ctx context.Context, stream model.ObservationStream, after *string, filter *model.AuditFilter, activityFilter *model.ActivityFilter, search *string, seconds, limit *int) (*model.ObservationResult, error) {
	wait := 15
	if seconds != nil {
		wait = *seconds
	}
	if wait < 0 || wait > 30 {
		return nil, fmt.Errorf("waitSeconds must be between 0 and 30")
	}
	count := 20
	if limit != nil {
		count = *limit
	}
	if count < 1 || count > 100 {
		return nil, fmt.Errorf("limit must be between 1 and 100")
	}
	if _, err := r.auditFilter(ctx, nil); err != nil {
		return nil, err
	}
	cursor := ""
	if after != nil {
		cursor = *after
	}
	deadline := time.NewTimer(time.Duration(wait) * time.Second)
	defer deadline.Stop()
	ticker := time.NewTicker(250 * time.Millisecond)
	defer ticker.Stop()
	for {
		result := &model.ObservationResult{Cursor: cursor, Audit: []*model.AuditEntry{}, Activity: []*model.ActivityEvent{}, Logs: []*model.LogEntry{}}
		switch stream {
		case model.ObservationStreamAudit:
			if r.Resolver.Audit == nil {
				return nil, fmt.Errorf("audit service is unavailable")
			}
			f, err := r.auditFilter(ctx, filter)
			if err != nil {
				return nil, err
			}
			if cursor == "" {
				n, err := r.Resolver.Audit.AuditCursor(ctx)
				if err != nil {
					return nil, err
				}
				cursor = strconv.FormatInt(n, 10)
			}
			f.After, err = strconv.ParseInt(cursor, 10, 64)
			if err != nil || f.After < 0 {
				return nil, fmt.Errorf("invalid audit cursor")
			}
			f.Forward = true
			f.Limit = count
			page, err := r.auditPage(ctx, f)
			if err != nil {
				return nil, err
			}
			result.ResetRequired = page.ResetRequired
			result.Audit = page.Entries
			result.Cursor = page.Cursor
		case model.ObservationStreamActivity:
			first, high, err := r.Store.ActivityBounds(ctx)
			if err != nil {
				return nil, err
			}
			if cursor != "" {
				last, err := strconv.ParseInt(cursor, 10, 64)
				if err != nil || last < 0 {
					return nil, fmt.Errorf("invalid activity cursor")
				}
				if last < first-1 || last > high {
					result.ResetRequired = true
					result.Cursor = strconv.FormatInt(high, 10)
					return result, nil
				}
			}
			f := model.ActivityFilter{}
			if activityFilter != nil {
				f = *activityFilter
			}
			n := count
			if cursor != "" {
				f.After = graphql.OmittableOf(&cursor)
			}
			f.Limit = graphql.OmittableOf(&n)
			rows, err := r.Activity(ctx, &f)
			if err != nil {
				return nil, err
			}
			last := int64(0)
			if cursor != "" {
				last, err = strconv.ParseInt(cursor, 10, 64)
				if err != nil {
					return nil, fmt.Errorf("invalid activity cursor")
				}
			}
			if cursor == "" {
				cursor = strconv.FormatInt(high, 10)
				result.Cursor = cursor
			} else {
				for i := 0; i < len(rows); i++ {
					id, err := strconv.ParseInt(rows[i].ID, 10, 64)
					if err != nil {
						return nil, err
					}
					if id > last {
						result.Activity = append(result.Activity, rows[i])
						result.Cursor = rows[i].ID
						if len(result.Activity) == count {
							break
						}
					}
				}
			}
		case model.ObservationStreamLogs:
			if r.LogBuffer == nil {
				return nil, fmt.Errorf("log service is unavailable")
			}
			epoch := ""
			sequence := int64(0)
			if cursor != "" {
				parts := strings.SplitN(cursor, ":", 2)
				if len(parts) != 2 {
					return nil, fmt.Errorf("invalid log cursor")
				}
				epoch = parts[0]
				var err error
				sequence, err = strconv.ParseInt(parts[1], 10, 64)
				if err != nil || sequence < 0 {
					return nil, fmt.Errorf("invalid log cursor")
				}
			}
			rows, current, next, reset := r.LogBuffer.Since(epoch, sequence)
			result.ResetRequired = reset
			for i, e := range rows {
				if search == nil || containsFold(e.Message, *search) || attrsContainFold(e.Attrs, *search) {
					result.Logs = append(result.Logs, mapLogEntry(e))
				}
				if len(result.Logs) == count {
					next = next - int64(len(rows)) + int64(i) + 1
					break
				}
			}
			result.Cursor = current + ":" + strconv.FormatInt(next, 10)
		default:
			return nil, fmt.Errorf("unsupported observation stream")
		}
		cursor = result.Cursor
		if result.ResetRequired || len(result.Audit)+len(result.Activity)+len(result.Logs) > 0 {
			return result, nil
		}
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-deadline.C:
			result.TimedOut = true
			return result, nil
		case <-ticker.C:
		}
	}
}
