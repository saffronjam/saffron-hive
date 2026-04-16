import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext } from "./setup.js";

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
      type
    }
  }
`;

const CREATE_SCENE = gql`
  mutation CreateScene($input: CreateSceneInput!) {
    createScene(input: $input) {
      id
      name
      actions {
        id
        targetType
        targetId
        payload
      }
    }
  }
`;

const APPLY_SCENE = gql`
  mutation ApplyScene($sceneId: ID!) {
    applyScene(sceneId: $sceneId) {
      id
      name
    }
  }
`;

const SCENE_QUERY = gql`
  query Scene($id: ID!) {
    scene(id: $id) {
      id
      name
      actions {
        id
        targetType
        targetId
        payload
      }
    }
  }
`;

const DELETE_SCENE = gql`
  mutation DeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`;

interface SceneActionFields {
  id: string;
  targetType: string;
  targetId: string;
  payload: string;
}

interface SceneFields {
  id: string;
  name: string;
  actions: SceneActionFields[];
}

interface CreateSceneResult {
  createScene: SceneFields;
}

interface ApplySceneResult {
  applyScene: {
    id: string;
    name: string;
  };
}

interface SceneQueryResult {
  scene: SceneFields | null;
}

interface DeleteSceneResult {
  deleteScene: boolean;
}

interface DeviceFields {
  id: string;
  name: string;
  type: string;
}

interface DevicesQueryResult {
  devices: DeviceFields[];
}

describe("scenes", () => {
  let sceneId: string;
  let targetDeviceId: string;

  it("should create a scene with a device target", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();

    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(lightDevice).toBeDefined();
    targetDeviceId = lightDevice!.id;

    const payload = JSON.stringify({ on: true, brightness: 200 });

    const result = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "Evening Lights",
          actions: [
            {
              targetType: "device",
              targetId: targetDeviceId,
              payload,
            },
          ],
        },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.createScene.name).toBe("Evening Lights");
    expect(result.data!.createScene.actions).toHaveLength(1);
    expect(result.data!.createScene.actions[0].targetType).toBe("device");
    expect(result.data!.createScene.actions[0].targetId).toBe(targetDeviceId);

    sceneId = result.data!.createScene.id;
  });

  it("should query the created scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .query<SceneQueryResult>(SCENE_QUERY, { id: sceneId })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.scene).toBeDefined();
    expect(result.data!.scene!.name).toBe("Evening Lights");
    expect(result.data!.scene!.actions).toHaveLength(1);
  });

  it("should apply the scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation<ApplySceneResult>(APPLY_SCENE, { sceneId })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.applyScene.id).toBe(sceneId);
    expect(result.data!.applyScene.name).toBe("Evening Lights");
  });

  it("should delete the scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, { id: sceneId })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.deleteScene).toBe(true);
  });
});
