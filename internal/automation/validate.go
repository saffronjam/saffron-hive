package automation

import "fmt"

// ValidationError represents a structural problem found during graph validation.
type ValidationError struct {
	NodeID  NodeID
	Message string
}

func (e ValidationError) Error() string {
	if e.NodeID != "" {
		return fmt.Sprintf("node %s: %s", e.NodeID, e.Message)
	}
	return e.Message
}

// ValidationResult collects all errors and warnings produced by graph validation.
type ValidationResult struct {
	Errors   []ValidationError
	Warnings []ValidationError
}

// Valid returns true if no errors were found.
func (r ValidationResult) Valid() bool {
	return len(r.Errors) == 0
}

// ValidateGraph checks that an AutomationGraph is a valid DAG with correct
// structural constraints. Trigger nodes must have no incoming edges, action
// nodes must have no outgoing edges, operator nodes must have at least one
// incoming and one outgoing edge, and all edge endpoints must reference
// existing nodes. An empty graph (no nodes, no edges) is considered valid.
// Orphan nodes (nodes with no edges) produce warnings, not errors.
func ValidateGraph(g AutomationGraph) ValidationResult {
	var result ValidationResult

	nodeSet := make(map[NodeID]Node, len(g.Nodes))
	for _, n := range g.Nodes {
		nodeSet[n.ID] = n
	}

	incoming := make(map[NodeID]int, len(g.Nodes))
	outgoing := make(map[NodeID]int, len(g.Nodes))

	for _, e := range g.Edges {
		if _, ok := nodeSet[e.FromNodeID]; !ok {
			result.Errors = append(result.Errors, ValidationError{
				Message: fmt.Sprintf("edge %s references non-existent source node %s", e.ID, e.FromNodeID),
			})
		}
		if _, ok := nodeSet[e.ToNodeID]; !ok {
			result.Errors = append(result.Errors, ValidationError{
				Message: fmt.Sprintf("edge %s references non-existent target node %s", e.ID, e.ToNodeID),
			})
		}
		incoming[e.ToNodeID]++
		outgoing[e.FromNodeID]++
	}

	for _, n := range g.Nodes {
		in := incoming[n.ID]
		out := outgoing[n.ID]

		switch n.Type {
		case NodeTrigger:
			if in > 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "trigger node must not have incoming edges",
				})
			}
			if out == 0 && len(g.Edges) > 0 {
				result.Warnings = append(result.Warnings, ValidationError{
					NodeID:  n.ID,
					Message: "trigger node has no outgoing edges",
				})
			}
		case NodeAction:
			if out > 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "action node must not have outgoing edges",
				})
			}
			if in == 0 && len(g.Edges) > 0 {
				result.Warnings = append(result.Warnings, ValidationError{
					NodeID:  n.ID,
					Message: "action node has no incoming edges",
				})
			}
		case NodeOperator:
			if in == 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "operator node must have at least one incoming edge",
				})
			}
			if out == 0 {
				result.Errors = append(result.Errors, ValidationError{
					NodeID:  n.ID,
					Message: "operator node must have at least one outgoing edge",
				})
			}
		default:
			result.Errors = append(result.Errors, ValidationError{
				NodeID:  n.ID,
				Message: fmt.Sprintf("unknown node type %q", n.Type),
			})
		}
	}

	if cycle := detectCycle(g.Nodes, g.Edges); cycle != "" {
		result.Errors = append(result.Errors, ValidationError{
			Message: fmt.Sprintf("graph contains a cycle involving node %s", cycle),
		})
	}

	return result
}

func detectCycle(nodes []Node, edges []Edge) NodeID {
	adj := make(map[NodeID][]NodeID, len(nodes))
	for _, e := range edges {
		adj[e.FromNodeID] = append(adj[e.FromNodeID], e.ToNodeID)
	}

	const (
		white = 0
		gray  = 1
		black = 2
	)

	color := make(map[NodeID]int, len(nodes))
	for _, n := range nodes {
		color[n.ID] = white
	}

	var dfs func(NodeID) NodeID
	dfs = func(id NodeID) NodeID {
		color[id] = gray
		for _, neighbor := range adj[id] {
			switch color[neighbor] {
			case gray:
				return neighbor
			case white:
				if found := dfs(neighbor); found != "" {
					return found
				}
			}
		}
		color[id] = black
		return ""
	}

	for _, n := range nodes {
		if color[n.ID] == white {
			if found := dfs(n.ID); found != "" {
				return found
			}
		}
	}
	return ""
}
