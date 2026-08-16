import { graphql } from "$lib/gql";

/**
 * The detail documents for entities whose editor needs more than the shared
 * store holds. They live here so a list page can warm one into the cache on
 * hover, and the editor that consumes it reads the same document.
 */

export const SCENE_DETAIL_QUERY = graphql(`
  query Scene($id: ID!) {
    scene(id: $id) {
      id
      name
      icon
      actions {
        targetType
        targetId
        name
        expression {
          connector
          subject
          op
          values
        }
        target {
          ... on Device {
            __typename
            id
            # Aliased because Group.name and Room.name in the sibling arms are
            # non-null, and GraphQL will not merge fields of differing nullability.
            deviceName: name
            type
            capabilities {
              name
              type
              values
              valueMin
              valueMax
              unit
              access
            }
            available
            disabled
            friendlyName
            seen
            lastSeen
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
              temperature
              humidity
              pressure
              illuminance
              battery
              power
              voltage
              current
              energy
            }
          }
          ... on Group {
            __typename
            id
            name
            icon
            members {
              id
              memberType
              memberId
            }
            resolvedDevices {
              id
              name
              type
              source
              available
              disabled
              friendlyName
              seen
              lastSeen
              capabilities {
                name
                type
                values
                valueMin
                valueMax
                unit
                access
              }
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
                temperature
                humidity
                pressure
                illuminance
                battery
                power
                voltage
                current
                energy
              }
            }
          }
          ... on Room {
            __typename
            id
            name
            icon
            resolvedDevices {
              id
              name
              type
              source
              available
              disabled
              friendlyName
              seen
              lastSeen
              capabilities {
                name
                type
                values
                valueMin
                valueMax
                unit
                access
              }
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
                temperature
                humidity
                pressure
                illuminance
                battery
                power
                voltage
                current
                energy
              }
            }
          }
        }
      }
      devicePayloads {
        deviceId
        payload
      }
      activatedAt
    }
  }
`);

export const AUTOMATION_DETAIL_QUERY = graphql(`
  query Automation($id: ID!) {
    automation(id: $id) {
      id
      name
      icon
      enabled
      nodes {
        id
        type
        config
        positionX
        positionY
        runtimeState
      }
      edges {
        fromNodeId
        toNodeId
      }
    }
  }
`);

export const EFFECT_DETAIL_QUERY = graphql(`
  query EffectEdit($id: ID!) {
    effect(id: $id) {
      id
      name
      icon
      kind
      nativeName
      loop
      durationMs
      requiredCapabilities
      tracks {
        id
        index
        name
        clips {
          id
          startMs
          transitionMinMs
          transitionMaxMs
          kind
          config
        }
      }
    }
  }
`);
