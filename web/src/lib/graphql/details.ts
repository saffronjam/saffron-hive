import { graphql } from "$lib/gql";

/**
 * The detail documents for entities whose editor needs more than the shared
 * store holds. They live here so a list page can warm one into the cache on
 * hover, and the editor that consumes it reads the same document.
 */

export const AUTOMATION_DETAIL_QUERY = graphql(`
  query Automation($id: ID!) {
    automation(id: $id) {
      id
      name
      icon
      enabled
      compilable
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
