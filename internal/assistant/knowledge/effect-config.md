# Typed authoring reference

These are GraphQL input and result types. Use discover for operation arguments and selection sets. Configuration objects contain exactly one matching variant.

<!-- source: api/schema.graphql sha256: b4d9b5b69275be117e56d73ffb3ed62bb32010a912d3d646c82dbbe9d776a1b5 -->
<!-- source: api/authoring.graphql sha256: 923bc19aa3e079890eeaff0ebddb9acb4462edd0882cf702ae23c66102a73f2e -->

```graphql
input CreateEffectInput {
	name: String!
	icon: String
	kind: EffectKind!
	nativeName: String
	loop: Boolean!
	durationMs: Int!
	tracks: [EffectTrackInput!]!
}
input EffectClipConfigInput {
	setOnOff: EffectSetOnOffClipConfigInput
	setBrightness: EffectSetBrightnessClipConfigInput
	setColor: EffectSetColorClipConfigInput
	nativeEffect: EffectNativeEffectClipConfigInput
}
input EffectClipInput {
	id: ID
	startMs: Int!
	transitionMinMs: Int!
	transitionMaxMs: Int!
	kind: EffectClipKind!
	config: EffectClipConfigInput!
}
enum EffectClipKind {
	SET_ON_OFF
	SET_BRIGHTNESS
	"""
	Sets the color of the target — either RGB or color temperature, distinguished
	by the config's "mode" field ("rgb" or "temp"). Required device capability is
	derived per-clip from the mode (color vs color_temp).
	"""
	SET_COLOR
	NATIVE_EFFECT
}
scalar EffectColorMode
enum EffectKind {
	TIMELINE
	NATIVE
}
input EffectNativeEffectClipConfigInput {
	name: String!
}
input EffectSetBrightnessClipConfigInput {
	value: Int!
}
input EffectSetColorClipConfigInput {
	mode: EffectColorMode!
	rgb: EffectSetColorRGBValueInput
	temp: EffectSetColorTempValueInput
}
input EffectSetColorRGBValueInput {
	r: Int!
	g: Int!
	b: Int!
}
input EffectSetColorTempValueInput {
	mireds: Int!
}
input EffectSetOnOffClipConfigInput {
	value: Boolean!
}
input EffectTrackInput {
	id: ID
	name: String!
	clips: [EffectClipInput!]!
}
input UpdateEffectInput {
	expectedRevision: Int!
	id: ID!
	name: String
	icon: String
	loop: Boolean
	durationMs: Int
	nativeName: String
	tracks: [EffectTrackInput!]
}
```
