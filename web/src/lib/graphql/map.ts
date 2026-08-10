import { graphql } from "$lib/gql";

/**
 * Every document the map page sends. They live together because the page reads
 * the plan, the rooms, the groups and the scenes as one picture, and because
 * operation names have to stay unique across the whole document set.
 */
export const FLOORPLAN_QUERY = graphql(`
  query MapPageFloorplan {
    floorplan {
      id
      name
      vertices {
        id
        x
        y
      }
      walls {
        id
        vertexA
        vertexB
        thickness
        curveX
        curveY
      }
      openings {
        id
        wallId
        t
        width
        kind
      }
      rooms {
        id
        name
        roomId
        vertexIds
      }
      placements {
        memberType
        memberId
        x
        y
      }
    }
  }
`);

export const UPDATE_FLOORPLAN = graphql(`
  mutation MapPageUpdateFloorplan($input: UpdateFloorplanInput!) {
    updateFloorplan(input: $input) {
      id
    }
  }
`);

export const ROOMS_QUERY = graphql(`
  query MapPageRooms {
    rooms {
      id
      name
      icon
      members {
        memberType
        memberId
      }
      resolvedDevices {
        id
      }
    }
  }
`);

export const GROUPS_QUERY = graphql(`
  query MapPageGroups {
    groups {
      id
      name
      icon
      tags
      members {
        memberType
        memberId
      }
      resolvedDevices {
        id
      }
    }
  }
`);

export const LOCATION_QUERY = graphql(`
  query MapPageLocation {
    settings {
      key
      value
    }
  }
`);

export const SCENES_QUERY = graphql(`
  query MapPageScenes {
    scenes {
      id
      name
      icon
      rooms {
        id
      }
      actions {
        targetType
        targetId
      }
      effectivePayloads {
        deviceId
        payload
      }
      activatedAt
    }
  }
`);

export const SCENE_ACTIVE_SUB = graphql(`
  subscription MapPageSceneActiveChanged {
    sceneActiveChanged {
      sceneId
      activatedAt
    }
  }
`);

export const APPLY_SCENE = graphql(`
  mutation MapPageApplyScene($sceneId: ID!) {
    applyScene(sceneId: $sceneId) {
      id
      name
    }
  }
`);
