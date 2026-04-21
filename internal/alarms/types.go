// Package alarms owns the alarm-raising service, the live subscription buffer,
// and the system-health monitor. Alarms are actionable severity-tagged
// signals shown on the /alarms page, distinct from informational activity
// events. Rows are persisted 1:1 per raise; grouping by alarm_id happens in
// the service so consumers see one Alarm per logical group with a count.
package alarms

import (
	"time"

	"github.com/saffronjam/saffron-hive/internal/store"
)

// Alarm is the grouped projection surfaced to consumers. Multiple AlarmRows
// with the same AlarmID collapse into a single Alarm whose Message is the
// most recent one and whose Count is the number of rows currently in the
// group.
type Alarm struct {
	ID            string
	LatestRowID   int64
	Severity      store.AlarmSeverity
	Kind          store.AlarmKind
	Message       string
	Source        string
	Count         int
	FirstRaisedAt time.Time
	LastRaisedAt  time.Time
}

// EventKind classifies an AlarmEvent — raised (new group or bump of existing)
// or cleared (deletion of a group).
type EventKind string

const (
	EventRaised  EventKind = "raised"
	EventCleared EventKind = "cleared"
)

// Event is what subscribers of the live Buffer receive.
type Event struct {
	Kind           EventKind
	Alarm          *Alarm // set for raised
	ClearedAlarmID string // set for cleared
}

// RaiseParams is the payload accepted by Service.Raise.
type RaiseParams struct {
	AlarmID  string
	Severity store.AlarmSeverity
	Kind     store.AlarmKind
	Message  string
	Source   string
}
