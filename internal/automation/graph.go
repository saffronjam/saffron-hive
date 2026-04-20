package automation

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
type TriggerConfig struct {
	Kind       TriggerKind
	EventType  string
	FilterExpr string
	CronExpr   string
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
type ActionConfig struct {
	ActionType string
	TargetType TargetType
	TargetID   string
	Payload    string
}

// NodeActivation is the event payload published when a node activates or
// deactivates during graph evaluation. Used for live visualization.
type NodeActivation struct {
	AutomationID string `json:"automationId"`
	NodeID       NodeID `json:"nodeId"`
	Active       bool   `json:"active"`
}

func (ActionConfig) nodeConfig() {}

// Node is a single vertex in an automation graph.
type Node struct {
	ID           NodeID
	AutomationID string
	Type         NodeType
	Config       NodeConfig
}

// Edge is a directed connection between two nodes in an automation graph.
type Edge struct {
	ID           string
	AutomationID string
	FromNodeID   NodeID
	ToNodeID     NodeID
}

// AutomationGraph represents a complete automation as a directed acyclic graph
// of trigger, operator, and action nodes connected by edges.
type AutomationGraph struct {
	ID              string
	Name            string
	Enabled         bool
	CooldownSeconds int
	Nodes           []Node
	Edges           []Edge
}
