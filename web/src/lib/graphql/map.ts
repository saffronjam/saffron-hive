import { graphql } from "$lib/gql";

/**
 * The map's page-specific documents: display-colour edits and its live mesh
 * topology. The plan, rooms, groups, scenes and devices it draws are shared
 * with the rest of the app and come from the stores in `$lib/stores`.
 */
export const SET_DISPLAY_COLOR = graphql(`
  mutation MapPageSetDisplayColor($id: ID!, $input: UpdateDeviceInput!) {
    updateDevice(id: $id, input: $input) {
      id
      displayColor
      displayBrightness
    }
  }
`);

export const NETWORK_TOPOLOGIES_QUERY = graphql(`
  query MapNetworkTopologies {
    networkTopologies {
      provider
      scannedAt
      nodes {
        id
        deviceId
        role
      }
      links {
        source
        target
        kind
        quality
        stale
      }
    }
  }
`);

export const TOPOLOGY_UPDATED_SUB = graphql(`
  subscription MapPageTopologyUpdated {
    networkTopologyUpdated {
      provider
      scannedAt
    }
  }
`);

export const DEVICE_TX_SUB = graphql(`
  subscription MapPageDeviceTx {
    deviceStateChanged {
      deviceId
    }
  }
`);

export const DEVICE_ACTION_TX_SUB = graphql(`
  subscription MapPageActionTx {
    deviceActionFired {
      deviceId
    }
  }
`);
