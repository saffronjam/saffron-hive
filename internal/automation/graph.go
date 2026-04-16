package automation

import "github.com/saffronjam/saffron-hive/internal/device"

// NodeID uniquely identifies a node within an automation graph.
type NodeID string

// NodeType classifies a node by its role in the graph.
type NodeType string

const (
	NodeTrigger  NodeType = "trigger"
	NodeOperator NodeType = "operator"
	NodeAction   NodeType = "action"
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
type TriggerConfig struct {
	EventType     string
	ConditionExpr string
}

func (TriggerConfig) nodeConfig() {}

// OperatorConfig holds the configuration for an operator node.
type OperatorConfig struct {
	Kind OperatorKind
}

func (OperatorConfig) nodeConfig() {}

// ActionConfig holds the configuration for an action node.
type ActionConfig struct {
	ActionType string
	DeviceID   *device.DeviceID
	Payload    string
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
