import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import { getContext, subscribeMQTTCommands } from "./setup.js";

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

const SCENES_QUERY = gql`
  query Scenes {
    scenes {
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

const UPDATE_SCENE = gql`
  mutation UpdateScene($id: ID!, $input: UpdateSceneInput!) {
    updateScene(id: $id, input: $input) {
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

const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
    }
  }
`;

const ADD_GROUP_MEMBER = gql`
  mutation AddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
    }
  }
`;

const DELETE_GROUP = gql`
  mutation DeleteGroup($id: ID!) {
    deleteGroup(id: $id)
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

interface ScenesQueryResult {
  scenes: SceneFields[];
}

interface UpdateSceneResult {
  updateScene: SceneFields;
}

interface CreateGroupResult {
  createGroup: {
    id: string;
    name: string;
  };
}

interface AddGroupMemberResult {
  addGroupMember: {
    id: string;
  };
}

interface DeleteGroupResult {
  deleteGroup: boolean;
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

  it("should list all scenes", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(lightDevice).toBeDefined();

    const scene1 = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "List Scene A",
          actions: [
            {
              targetType: "device",
              targetId: lightDevice!.id,
              payload: JSON.stringify({ on: true }),
            },
          ],
        },
      })
      .toPromise();
    const scene2 = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "List Scene B",
          actions: [
            {
              targetType: "device",
              targetId: lightDevice!.id,
              payload: JSON.stringify({ on: false }),
            },
          ],
        },
      })
      .toPromise();

    expect(scene1.data).toBeDefined();
    expect(scene2.data).toBeDefined();

    const result = await graphqlClient
      .query<ScenesQueryResult>(SCENES_QUERY, {})
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    const names = result.data!.scenes.map((s) => s.name);
    expect(names).toContain("List Scene A");
    expect(names).toContain("List Scene B");

    await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, {
        id: scene1.data!.createScene.id,
      })
      .toPromise();
    await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, {
        id: scene2.data!.createScene.id,
      })
      .toPromise();
  });

  it("should update scene name", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(lightDevice).toBeDefined();

    const created = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "Original Scene Name",
          actions: [
            {
              targetType: "device",
              targetId: lightDevice!.id,
              payload: JSON.stringify({ on: true }),
            },
          ],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createScene.id;

    const updated = await graphqlClient
      .mutation<UpdateSceneResult>(UPDATE_SCENE, {
        id,
        input: { name: "Renamed Scene" },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateScene.name).toBe("Renamed Scene");

    await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, { id })
      .toPromise();
  });

  it("should update scene actions", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(lightDevice).toBeDefined();

    const created = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "Actions Test Scene",
          actions: [
            {
              targetType: "device",
              targetId: lightDevice!.id,
              payload: JSON.stringify({ on: true }),
            },
          ],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createScene.id;

    const newPayload = JSON.stringify({ on: false, brightness: 50 });
    const updated = await graphqlClient
      .mutation<UpdateSceneResult>(UPDATE_SCENE, {
        id,
        input: {
          actions: [
            {
              targetType: "device",
              targetId: lightDevice!.id,
              payload: newPayload,
            },
          ],
        },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateScene.actions).toHaveLength(1);
    expect(updated.data!.updateScene.actions[0].payload).toBe(newPayload);

    await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, { id })
      .toPromise();
  });

  it("should apply scene with group target", async () => {
    // EXPECTED FAIL: Bug #1/#2 -- resolveSceneTarget uses in-memory StateReader for groups,
    // but groups are only in DB store. When a scene targets a group, the resolver calls
    // sr.ResolveGroupDevices() which returns empty because groups created via GraphQL
    // mutations are persisted to the database, not the in-memory state reader.
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(lightDevice).toBeDefined();

    const group = await graphqlClient
      .mutation<CreateGroupResult>(CREATE_GROUP, {
        input: { name: "Scene Target Group" },
      })
      .toPromise();
    expect(group.data).toBeDefined();
    const groupId = group.data!.createGroup.id;

    await graphqlClient
      .mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
        input: { groupId, memberType: "device", memberId: lightDevice!.id },
      })
      .toPromise();

    const scene = await graphqlClient
      .mutation<CreateSceneResult>(CREATE_SCENE, {
        input: {
          name: "Group Target Scene",
          actions: [
            {
              targetType: "group",
              targetId: groupId,
              payload: JSON.stringify({ on: true, brightness: 255 }),
            },
          ],
        },
      })
      .toPromise();
    expect(scene.data).toBeDefined();
    const sceneIdLocal = scene.data!.createScene.id;

    const { messages, cleanup } = await subscribeMQTTCommands();

    await graphqlClient
      .mutation<ApplySceneResult>(APPLY_SCENE, { sceneId: sceneIdLocal })
      .toPromise();

    await new Promise((r) => setTimeout(r, 1000));

    expect(messages.length).toBeGreaterThan(0);

    await cleanup();
    await graphqlClient
      .mutation<DeleteSceneResult>(DELETE_SCENE, { id: sceneIdLocal })
      .toPromise();
    await graphqlClient
      .mutation<DeleteGroupResult>(DELETE_GROUP, { id: groupId })
      .toPromise();
  });
});
