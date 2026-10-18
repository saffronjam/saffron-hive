import { describe, expect, it } from "vitest";
import {
  capabilityToExprProperty,
  normalizeActionConfig,
  normalizeTriggerConfig,
  serializeActionConfig,
  serializeTriggerConfig,
  supportsDeviceEvents,
  validateActionConfig,
  validateTriggerConfig,
  type TriggerConfig,
} from "$lib/components/graph/trigger-expr";
import { TargetClauseOperator, TargetClauseSubject } from "$lib/gql/graphql";

describe("capabilityToExprProperty", () => {
  it.each([
    ["on_off", "on"],
    ["color_temp", "colorTemp"],
    ["target_temperature", "targetTemperature"],
    ["device_posture", "devicePosture"],
    ["link_quality", "linkQuality"],
    ["orientation", "orientation"],
  ])("maps %s to %s", (capability, property) => {
    expect(capabilityToExprProperty(capability)).toBe(property);
  });
});

describe("configure_device action validation", () => {
  it("requires a direct device and at least one typed setting", () => {
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "group",
        targetId: "group-1",
        payload: '{"settings":[]}',
      }),
    ).toMatchObject({ field: "target" });
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "device",
        targetId: "sensor-1",
        payload: '{"settings":[]}',
      }),
    ).toMatchObject({ field: "payload" });
    expect(
      validateActionConfig({
        actionType: "configure_device",
        targetType: "device",
        targetId: "sensor-1",
        payload: '{"settings":[{"capability":"fall_detection","booleanValue":true}]}',
      }),
    ).toBeNull();
  });
});

describe("run_effect action validation", () => {
  it("accepts a selector target", () => {
    expect(
      validateActionConfig({
        actionType: "run_effect",
        targetType: "expression",
        targetId: "",
        targetExpr: [
          {
            subject: TargetClauseSubject.DeviceType,
            op: TargetClauseOperator.Is,
            values: ["light"],
          },
        ],
        payload: '{"effect_id":"fireplace"}',
      }),
    ).toBeNull();
  });

  it("requires at least one selector rule", () => {
    expect(
      validateActionConfig({
        actionType: "run_effect",
        targetType: "expression",
        targetId: "",
        targetExpr: [],
        payload: '{"effect_id":"fireplace"}',
      }),
    ).toMatchObject({ field: "target" });
  });
});


describe("typed trigger authoring",()=>{
 it.each(["true","42","",'a"b\\c'])("preserves string %s",value=>{
  const config:TriggerConfig={mode:"device_state",deviceId:"sensor",property:"value",value,valueType:"string"};
  const input=JSON.parse(serializeTriggerConfig(config));
  expect(input.trigger.value).toEqual({stringValue:value});
  expect(normalizeTriggerConfig(input)).toMatchObject(config);
 });
 it("keeps an incomplete selection",()=>{
  const config:TriggerConfig={mode:"device_state",deviceId:"sensor",property:"occupancy",holdMs:600000};
  expect(normalizeTriggerConfig(JSON.parse(serializeTriggerConfig(config)))).toMatchObject(config);
 });
 it("preserves custom held expressions and timing",()=>{
  const config:TriggerConfig={mode:"custom",deviceId:"sensor",customExpr:'device("sensor").occupancy != false',holdMs:600000,graceMs:500,cooldownMs:1000};
  expect(normalizeTriggerConfig(JSON.parse(serializeTriggerConfig(config)))).toMatchObject(config);
 });
 it("maps a scene selection to the typed action payload",()=>{
  const config={actionType:"activate_scene",targetType:"scene",targetId:"night",payload:""};
  const input=JSON.parse(serializeActionConfig(config));
  expect(input.action.payload).toEqual({sceneId:"night"});
  expect(normalizeActionConfig(input)).toMatchObject(config);
 });
});

it("offers action events only on devices reporting actions",()=>{
 expect(supportsDeviceEvents({capabilities:[{name:"occupancy"}]})).toBe(false);
 expect(supportsDeviceEvents({capabilities:[{name:"action"}]})).toBe(true);
});
it("requires webhook filter values matching their operators",()=>{
 expect(validateTriggerConfig({mode:"webhook",endpointId:"hook",webhookFilters:[{source:"body",path:"value",operator:"contains",value_type:"number",value:2}]})).toMatchObject({code:"filter_text_operator_type"});
 expect(validateTriggerConfig({mode:"webhook",endpointId:"hook",webhookFilters:[{source:"body",path:"value",operator:"greater_than",value_type:"number",value:2}]})).toBeNull();
});
