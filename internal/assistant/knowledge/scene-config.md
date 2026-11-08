# Typed authoring reference

These are GraphQL input and result types. Use discover for operation arguments and selection sets. Configuration objects contain exactly one matching variant.

<!-- source: api/schema.graphql sha256: 0325058ad76821e49bac94d5482558b9fc88a84449279b922785596f887ec15a -->
<!-- source: api/authoring.graphql sha256: 1f1afd06be8ae7796e17dc3408fdb440171483d99b71948e39e5e39c577b4f3c -->

```graphql
type Color {
	r: Int!
	g: Int!
	b: Int!
	x: Float!
	y: Float!
}
input ColorInput {
	r: Int!
	g: Int!
	b: Int!
	x: Float!
	y: Float!
}
input CreateSceneInput {
	name: String!
	definition: SceneDefinitionInput!
}
type DesiredSceneState {
	on: Boolean
	brightness: Int
	colorTemp: Int
	color: Color
	transition: Float
	targetTemperature: Float
	hvacMode: String
	fanMode: String
	swing: String
}
input DesiredSceneStateInput {
	on: Boolean
	brightness: Int
	colorTemp: Int
	color: ColorInput
	transition: Float
	targetTemperature: Float
	hvacMode: String
	fanMode: String
	swing: String
}
input DynamicSceneSourceInput {
	source: VibeSourceInput
	brightness: Float
	movement: Float
	cycleSeconds: Float
	seed: String
}
input GuidedVibeRecipeInput {
	domain: VibeFieldDomain!
	seed: String!
	selectedIds: [ID!]!
}
input PhotoSampleInput {
	domain: VibeFieldDomain!
	seed: String!
	width: Int!
	height: Int!
	rgbBase64: String!
}
input PresetVibeRecipeInput {
	presetId: ID!
	seed: String
}
type SceneAuthoredState {
	deviceId: ID!
	lighting: Boolean!
	state: DesiredSceneState!
}
input SceneAuthoringInput {
	targets: [SceneTargetInput!]!
	source: SceneStateSource! = DEFAULTS
	"""
	Used when CURRENT has no writable reported state.
	"""
	fallbackToDefaults: Boolean! = false
	"""
	Explicit desired values applied after selecting defaults or current state.
	"""
	desired: DesiredSceneStateInput
}
input SceneDefinitionInput {
	targets: [SceneTargetInput!]!
	lighting: SceneLightingInput!
	supportingStates: [SceneSupportingStateInput!]!
}
input SceneLightOverrideInput {
	deviceId: ID!
	kind: SceneLightOverrideKind!
	state: DesiredSceneStateInput
	effectId: ID
	nativeEffectName: String
}
enum SceneLightOverrideKind {
	state
	effect
	native_effect
}
input SceneLightingInput {
	dynamicSource: DynamicSceneSourceInput
	overrides: [SceneLightOverrideInput!]!
}
enum SceneStateSource {
	DEFAULTS
	CURRENT
}
input SceneSupportingStateInput {
	deviceId: ID!
	state: DesiredSceneStateInput!
}
input SceneTargetInput {
	id: ID
	targetType: SceneTargetType!
	targetId: ID
	expression: [TargetClauseInput!]
	name: String
}
enum SceneTargetType {
	device
	group
	room
	expression
}
enum TargetClauseConnector {
	and
	or
}
input TargetClauseInput {
	connector: TargetClauseConnector
	subject: TargetClauseSubject!
	op: TargetClauseOperator!
	values: [String!]!
}
enum TargetClauseOperator {
	is
	is_one_of
	is_not
	is_not_one_of
}
enum TargetClauseSubject {
	room
	group
	device
	device_type
	device_role
	writable_capability
	reported_capability
}
input UpdateSceneInput {
	expectedRevision: Int!
	name: String
	icon: String
	definition: SceneDefinitionInput
}
enum VibeFieldDomain {
	full_color
	white_ambience
}
input VibeSourceInput {
	preset: PresetVibeRecipeInput
	photo: PhotoSampleInput
	guided: GuidedVibeRecipeInput
}
```
