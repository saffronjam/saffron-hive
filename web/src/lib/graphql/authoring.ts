import { graphql } from "$lib/gql";

graphql(`
  fragment AutomationConfigFields on AutomationConfig {
    trigger {
      mode
      deviceId
      property
      comparator
      value {
        stringValue
        numberValue
        booleanValue
        nullValue
      }
      eventValue
      eventType
      customExpr
      endpointId
      webhookFilters {
        source
        path
        operator
        value {
          stringValue
          numberValue
          booleanValue
          nullValue
        }
      }
      scheduleSubmode
      cronExpr
      scheduleHour
      scheduleMinute
      scheduleSecond
      scheduleWeekdays
      scheduleIntervalValue
      scheduleIntervalUnit
      graceMs
      cooldownMs
      holdMs
    }
    condition {
      negate
      mode
      afterHour
      afterMinute
      beforeHour
      beforeMinute
      weekdays
      targetType
      targetId
      property
      comparator
      value {
        stringValue
        numberValue
        booleanValue
        nullValue
      }
      customExpr
    }
    operator {
      kind
    }
    action {
      actionType
      targetType
      targetId
      targetExpr {
        connector
        subject
        op
        values
      }
      payload {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        targetTemperature
        hvacMode
        fanMode
        swing
        sceneId
        scenes
        effectId
        nativeName
        field
        delta
        mode
        settings {
          capability
          booleanValue
          numberValue
          stringValue
        }
        alarmId
        severity
        kind
        message
      }
    }
    macro {
      name
      negate
      arguments
    }
  }
`);

graphql(`
  fragment EffectClipConfigFields on EffectClipConfig {
    setOnOff {
      value
    }
    setBrightness {
      value
    }
    setColor {
      mode
      rgb {
        r
        g
        b
      }
      temp {
        mireds
      }
    }
    nativeEffect {
      name
    }
  }
`);

export const AUTOMATION_NODE_PREVIEW = graphql(`
  query AutomationAuthoringPreview($type: String!, $config: AutomationConfigInput!) {
    automationNodePreview(type: $type, config: $config) {
      expression
      cron
    }
  }
`);

export const SCENE_AUTHORING = graphql(`
  query SceneAuthoring($input: SceneAuthoringInput!) {
    sceneAuthoring(input: $input) {
      deviceId
      lighting
      state {
        on
        brightness
        colorTemp
        color {
          r
          g
          b
          x
          y
        }
        transition
        targetTemperature
        hvacMode
        fanMode
        swing
      }
    }
  }
`);
