package automation

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

// TargetType identifies whether an action targets a device or a group.
type TargetType string

const (
	TargetDevice TargetType = "device"
	TargetGroup  TargetType = "group"
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
	AutomationID string
	NodeID       NodeID
	Active       bool
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
