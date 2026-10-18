# Authoring examples

These complete requests use fixture IDs `hallway`, `motion` and `lamp`. Resolve the user's real IDs first. Replace `SCENE_ID` with the scene returned by createScene. The sensor must be explicitly associated with the requested room. Each request uses the same GraphQL API as the visual editors.

Read capability-adapted manual states before creating a scene:

```json
{"query":"query($input:SceneAuthoringInput!){sceneAuthoring(input:$input){deviceId lighting state{on brightness colorTemp transition}}}","variables":{"input":{"targets":[{"targetType":"room","targetId":"hallway"}],"source":"DEFAULTS","desired":{"on":true,"brightness":13,"colorTemp":500,"transition":1}}}}
```

Create a manual scene from the resolved lighting state:

```json
{"query":"mutation($input:CreateSceneInput!){createScene(input:$input){id revision}}","variables":{"input":{"name":"Night light","definition":{"targets":[{"targetType":"room","targetId":"hallway"}],"lighting":{"overrides":[{"deviceId":"lamp","kind":"state","state":{"on":true,"brightness":13,"colorTemp":500,"transition":1}}]},"supportingStates":[]}}}}
```

Create a short effect with one typed brightness clip. The same config field accepts setOnOff, setColor or nativeEffect when its kind matches:

```json
{"query":"mutation($input:CreateEffectInput!){createEffect(input:$input){id revision tracks{id clips{id config{setBrightness{value}}}}}}","variables":{"input":{"name":"Gentle dim","kind":"TIMELINE","loop":false,"durationMs":1000,"tracks":[{"id":"dimming","name":"Dimming","clips":[{"id":"fade","startMs":0,"transitionMinMs":1000,"transitionMaxMs":1000,"kind":"SET_BRIGHTNESS","config":{"setBrightness":{"value":40}}}]}]}}}
```

Validate this entire automation with validateAutomation, then use the same input for createAutomation. A saved and validated graph still requires observation to confirm its physical behavior. Each trigger feeds its condition gate, whose output alone reaches the action. The inactivity branch intentionally has no time-window condition.

```json
{"query":"mutation($input:CreateAutomationInput!){createAutomation(input:$input){id revision validation{valid issues{path message}} nodes{id config{trigger{mode deviceId property value{booleanValue} holdMs} condition{mode customExpr} action{actionType targetType targetId payload{sceneId on}}}}}}","variables":{"input":{"name":"Hallway night light","enabled":true,"nodes":[{"id":"motion-on","type":"trigger","config":{"trigger":{"mode":"device_state","deviceId":"motion","property":"occupancy","comparator":"==","value":{"booleanValue":true}}}},{"id":"night-hours","type":"condition","config":{"condition":{"mode":"time_window","afterHour":0,"afterMinute":0,"beforeHour":4,"beforeMinute":0}}},{"id":"lights-on","type":"action","config":{"action":{"actionType":"activate_scene","payload":{"sceneId":"SCENE_ID"}}}},{"id":"motion-off","type":"trigger","config":{"trigger":{"mode":"device_state","deviceId":"motion","property":"occupancy","comparator":"==","value":{"booleanValue":false},"holdMs":600000}}},{"id":"night-active","type":"condition","config":{"condition":{"mode":"custom","customExpr":"scene_active(\"SCENE_ID\")"}}},{"id":"lights-off","type":"action","config":{"action":{"actionType":"set_device_state","targetType":"room","targetId":"hallway","payload":{"on":false}}}}],"edges":[{"fromNodeId":"motion-on","toNodeId":"night-hours"},{"fromNodeId":"night-hours","toNodeId":"lights-on"},{"fromNodeId":"motion-off","toNodeId":"night-active"},{"fromNodeId":"night-active","toNodeId":"lights-off"}]}}}
```

For edits, read the current entity and expectedRevision, preserve unrelated fields and stable IDs, validate the complete effective automation, save once, then inspect the saved result. Ordinary device commands, membership updates, selectors, floorplans, integrations and profile/settings changes use their existing typed inputs; discover those operations and read administration/devices for their constraints. Creating definitions is distinct from running them.

For alternative guards, fan the trigger out through both conditions and merge their outputs with OR. This example activates on motion during the night window or on Sunday; it does nothing when both guards fail or no trigger fires.

```json
{"query":"mutation($input:CreateAutomationInput!){createAutomation(input:$input){id revision validation{valid issues{message}}}}","variables":{"input":{"name":"Motion during night or Sunday","enabled":true,"nodes":[{"id":"motion","type":"trigger","config":{"trigger":{"mode":"device_state","deviceId":"motion","property":"occupancy","comparator":"==","value":{"booleanValue":true}}}},{"id":"night","type":"condition","config":{"condition":{"mode":"time_window","afterHour":0,"beforeHour":4}}},{"id":"sunday","type":"condition","config":{"condition":{"mode":"weekday","weekdays":["Sunday"]}}},{"id":"either","type":"operator","config":{"operator":{"kind":"or"}}},{"id":"activate","type":"action","config":{"action":{"actionType":"activate_scene","payload":{"sceneId":"SCENE_ID"}}}}],"edges":[{"fromNodeId":"motion","toNodeId":"night"},{"fromNodeId":"motion","toNodeId":"sunday"},{"fromNodeId":"night","toNodeId":"either"},{"fromNodeId":"sunday","toNodeId":"either"},{"fromNodeId":"either","toNodeId":"activate"}]}}}
```
