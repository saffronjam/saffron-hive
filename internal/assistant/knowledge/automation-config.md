# Typed authoring reference

These are GraphQL input and result types. Use discover for operation arguments and selection sets. Configuration objects contain exactly one matching variant.

<!-- source: api/schema.graphql sha256: b4d9b5b69275be117e56d73ffb3ed62bb32010a912d3d646c82dbbe9d776a1b5 -->
<!-- source: api/authoring.graphql sha256: 923bc19aa3e079890eeaff0ebddb9acb4462edd0882cf702ae23c66102a73f2e -->

```graphql
input AuthoringAttributeInput {
	capability: String!
	booleanValue: Boolean
	numberValue: Float
	stringValue: String
}
input AuthoringClauseInput {
	connector: AuthoringConnector
	subject: AuthoringClauseSubject!
	op: AuthoringClauseOp!
	values: [String!]
}
scalar AuthoringClauseOp
scalar AuthoringClauseSubject
input AuthoringColorInput {
	r: Int!
	g: Int!
	b: Int!
	x: Float
	y: Float
}
scalar AuthoringConnector
input AutomationActionInput {
	actionType: String!
	targetType: String
	targetId: String
	targetExpr: [AuthoringClauseInput!]
	payload: AutomationActionPayloadInput
}
input AutomationActionPayloadInput {
	on: Boolean
	brightness: Int
	colorTemp: Int
	color: AuthoringColorInput
	transition: Float
	targetTemperature: Float
	hvacMode: String
	fanMode: String
	swing: String
	sceneId: String
	scenes: [String!]
	effectId: String
	nativeName: String
	field: String
	delta: Float
	mode: String
	settings: [AuthoringAttributeInput!]
	alarmId: String
	severity: String
	kind: String
	message: String
}
input AutomationConditionInput {
	negate: Boolean = false
	mode: String!
	afterHour: Int
	afterMinute: Int
	beforeHour: Int
	beforeMinute: Int
	weekdays: [String!]
	targetType: String
	targetId: String
	property: String
	comparator: String
	value: AutomationLiteralInput
	customExpr: String
}
input AutomationConfigInput {
	trigger: AutomationTriggerInput
	condition: AutomationConditionInput
	operator: AutomationOperatorInput
	action: AutomationActionInput
	macro: AutomationMacroInput
}
input AutomationEdgeInput {
	fromNodeId: ID!
	toNodeId: ID!
}
input AutomationLiteralInput {
	stringValue: String
	numberValue: Float
	booleanValue: Boolean
	nullValue: Boolean
}
input AutomationMacroInput {
	name: String!
	negate: Boolean
	arguments: [JSON!]
}
input AutomationNodeInput {
	id: ID!
	type: String!
	config: AutomationConfigInput!
	positionX: Float! = 0
	positionY: Float! = 0
}
"""
Read-only compiled expression for the editor's preview and copy commands.
"""
type AutomationNodePreview {
	expression: String!
	cron: String!
}
input AutomationOperatorInput {
	kind: String!
}
input AutomationTriggerInput {
	mode: String!
	deviceId: String
	property: String
	comparator: String
	value: AutomationLiteralInput
	eventValue: String
	eventType: String
	customExpr: String
	endpointId: String
	webhookFilters: [AutomationWebhookFilterInput!]
	scheduleSubmode: String
	cronExpr: String
	scheduleHour: Int
	scheduleMinute: Int
	scheduleSecond: Int
	scheduleWeekdays: [String!]
	scheduleIntervalValue: Int
	scheduleIntervalUnit: String
	graceMs: Int
	cooldownMs: Int
	holdMs: Int
}
input AutomationWebhookFilterInput {
	source: String
	path: String
	operator: String
	value: AutomationLiteralInput
}
type ConfigurationIssue {
	code: String!
	path: String!
	nodeId: ID
	severity: String!
	message: String!
}
type ConfigurationValidation {
	valid: Boolean!
	issues: [ConfigurationIssue!]!
}
input CreateAutomationInput {
	name: String!
	enabled: Boolean!
	"""
	JSON object of named macros. Defaults to none.
	"""
	definitions: String
	nodes: [AutomationNodeInput!]!
	edges: [AutomationEdgeInput!]!
}
"""
Structured macro arguments. Other authoring fields use concrete types.
"""
scalar JSON
input UpdateAutomationInput {
	expectedRevision: Int!
	name: String
	icon: String
	enabled: Boolean
	"""
	JSON object of named macros.
	"""
	definitions: String
	nodes: [AutomationNodeInput!]
	edges: [AutomationEdgeInput!]
}
```
