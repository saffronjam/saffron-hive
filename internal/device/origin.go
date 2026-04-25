package device

// CommandOrigin tags every command with the source that produced it. The
// effects runner uses it to recognise its own state echoes versus foreign
// drift; scenes and automations use it for activity-log attribution and to
// disambiguate overlapping commands during loop-prevention checks.
type CommandOrigin struct {
	Kind string `json:"kind,omitempty"`
	ID   string `json:"id,omitempty"`
}

const (
	// OriginKindScene marks commands produced by applying a scene.
	OriginKindScene = "scene"
	// OriginKindAutomation marks commands produced by an automation action.
	OriginKindAutomation = "automation"
	// OriginKindEffect marks commands produced by an effect run step.
	OriginKindEffect = "effect"
	// OriginKindUser marks commands produced by an interactive user action
	// (GraphQL setDeviceState mutation, dashboard control).
	OriginKindUser = "user"
)

// OriginScene tags a command as produced by applying scene sceneID.
func OriginScene(sceneID string) CommandOrigin {
	return CommandOrigin{Kind: OriginKindScene, ID: sceneID}
}

// OriginAutomation tags a command as produced by automation automationID.
func OriginAutomation(automationID string) CommandOrigin {
	return CommandOrigin{Kind: OriginKindAutomation, ID: automationID}
}

// OriginEffect tags a command as produced by an effect run identified by runID.
func OriginEffect(runID string) CommandOrigin {
	return CommandOrigin{Kind: OriginKindEffect, ID: runID}
}

// OriginUser tags a command as produced by a direct user action.
func OriginUser() CommandOrigin {
	return CommandOrigin{Kind: OriginKindUser}
}

// IsZero reports whether the origin has no kind set.
func (o CommandOrigin) IsZero() bool {
	return o.Kind == "" && o.ID == ""
}
