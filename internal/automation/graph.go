package automation

import (
	"fmt"
	"time"

	"github.com/saffronjam/saffron-hive/internal/device"
	"github.com/saffronjam/saffron-hive/internal/eventbus"
	"github.com/saffronjam/saffron-hive/internal/webhook"
)

// ValidateTriggerTiming rejects negative grace and cooldown values. Zero is
// allowed and means "immediate" (no memory, no throttle). Non-zero values are
// expressed in milliseconds and accepted without a floor — echo protection is
// an opt-in per-trigger choice, not a system default.
func ValidateTriggerTiming(graceMs, cooldownMs int64) error {
	if graceMs < 0 {
		return fmt.Errorf("grace must not be negative (got %d ms)", graceMs)
	}
	if cooldownMs < 0 {
		return fmt.Errorf("cooldown must not be negative (got %d ms)", cooldownMs)
	}
	return nil
}

// MaxTriggerHold bounds how long a trigger condition can be required to hold.
const MaxTriggerHold = 24 * time.Hour

// ValidateTriggerHold checks a trigger's hold duration. A hold is only
// meaningful for a device-state trigger bound to one device, because it is a
// claim about that device's current state lasting over time.
func ValidateTriggerHold(tc TriggerConfig) error {
	if tc.HoldMs == 0 {
		return nil
	}
	if tc.HoldMs < 0 {
		return fmt.Errorf("hold must not be negative (got %d ms)", tc.HoldMs)
	}
	if time.Duration(tc.HoldMs)*time.Millisecond > MaxTriggerHold {
		return fmt.Errorf("hold must be at most %s (got %d ms)", MaxTriggerHold, tc.HoldMs)
	}
	if tc.Kind != TriggerEvent || tc.EventType != string(eventbus.EventDeviceStateChanged) {
		return fmt.Errorf("hold applies only to device state triggers")
	}
	if tc.HoldDeviceID == "" {
		return fmt.Errorf("hold requires the device the condition is about")
	}
	return nil
}

// NodeID uniquely identifies a node within an automation graph.
type NodeID string

// NodeType classifies a node by its role in the graph.
type NodeType string

const (
	NodeTrigger   NodeType = "trigger"
	NodeCondition NodeType = "condition"
	NodeOperator  NodeType = "operator"
	NodeAction    NodeType = "action"
)

// TriggerKind distinguishes between event-based and schedule-based triggers.
type TriggerKind string

const (
	// TriggerEvent is a trigger that fires on an event bus event type.
	TriggerEvent TriggerKind = "event"
	// TriggerSchedule is a trigger that fires based on a cron expression.
	TriggerSchedule TriggerKind = "schedule"
)

// OperatorKind defines the logical operation performed by an operator node.
type OperatorKind string

const (
	OperatorAnd OperatorKind = "and"
	OperatorOr  OperatorKind = "or"
	OperatorNot OperatorKind = "not"
)

// NodeConfig is implemented by the configuration types for each node kind.
type NodeConfig interface {
	nodeConfig()
}

// TriggerConfig holds the configuration for a trigger node.
//
// Kind determines which other fields are populated:
//   - TriggerEvent: EventType + FilterExpr are used. CronExpr is ignored.
//   - TriggerSchedule: CronExpr is used. EventType + FilterExpr are ignored.
//
// GraceMs and CooldownMs apply to every kind. Grace keeps the trigger's
// active state alive for a window after it fires so downstream AND/OR can
// combine with later events from other triggers. Cooldown suppresses the
// trigger's own re-matches inside the window — useful for absorbing echoes
// and retransmits. 0 means "immediate" / "no throttle".
//
// HoldMs makes a device-state trigger level-based: it fires once its filter
// has stayed true against HoldDeviceID's current state for that long, and not
// again until the filter has been false. 0 fires on the matching event.
type TriggerConfig struct {
	Kind           TriggerKind
	EventType      string
	FilterExpr     string
	CronExpr       string
	GraceMs        int64
	CooldownMs     int64
	HoldMs         int64
	HoldDeviceID   string
	EndpointID     string
	WebhookFilters []webhook.FilterRule
}

func (TriggerConfig) nodeConfig() {}

// ConditionConfig holds the configuration for a condition node.
//
// Conditions are pure boolean guards evaluated during graph evaluation. They
// never initiate automation firing — only a trigger can do that.
type ConditionConfig struct {
	Expr string
}

func (ConditionConfig) nodeConfig() {}

// OperatorConfig holds the configuration for an operator node.
type OperatorConfig struct {
	Kind OperatorKind
}

func (OperatorConfig) nodeConfig() {}

// TargetType identifies whether an action targets a device or a group.
type TargetType string

const (
	TargetDevice TargetType = "device"
	TargetGroup  TargetType = "group"
	TargetRoom   TargetType = "room"
)

// ActionConfig holds the configuration for an action node.
//
// AutomationID and NodeID are populated by the engine before dispatch so the
// executor can attribute side effects (alarm source strings, persistent node
// state keys) to the originating node. Stored configs never include them.
type ActionConfig struct {
	ActionType   string
	TargetType   TargetType
	TargetID     string
	TargetExpr   []device.Clause
	Payload      string
	AutomationID string
	NodeID       NodeID
}

// NodeActivation is the event payload published when a node activates or
// deactivates during graph evaluation. Used for live visualization.
//
// PendingUntil is set while a hold trigger waits for its condition to last,
// to when it will fire, and cleared (nil) when the wait ends either way.
type NodeActivation struct {
	AutomationID string     `json:"automationId"`
	NodeID       NodeID     `json:"nodeId"`
	Active       bool       `json:"active"`
	PendingUntil *time.Time `json:"pendingUntil,omitempty"`
}

func (ActionConfig) nodeConfig() {}

// Node is a single vertex in an automation graph.
type Node struct {
	ID           NodeID
	AutomationID string
	Type         NodeType
	Config       NodeConfig
	PositionX    float64
	PositionY    float64
}

// Edge is a directed connection between two nodes in an automation graph.
type Edge struct {
	AutomationID string
	FromNodeID   NodeID
	ToNodeID     NodeID
}

// AutomationGraph represents a complete automation as a directed acyclic graph
// of trigger, operator, and action nodes connected by edges.
type AutomationGraph struct {
	ID      string
	Name    string
	Enabled bool
	Nodes   []Node
	Edges   []Edge
}
