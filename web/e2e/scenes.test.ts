import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { getContext, subscribeMQTTCommands } from "./setup.js";

const DEVICES_QUERY = graphql(`
  query E2EScenesDevices {
    devices {
      id
      name
      type
    }
  }
`);

const CREATE_SCENE = graphql(`
  mutation E2ECreateScene($input: CreateSceneInput!) {
    createScene(input: $input) {
      id
      name
      actions {
        id
        targetType
        targetId
      }
      devicePayloads {
        deviceId
        payload
      }
    }
  }
`);

const APPLY_SCENE = graphql(`
  mutation E2EApplyScene($sceneId: ID!) {
    applyScene(sceneId: $sceneId) {
      id
      name
    }
  }
`);

const SCENE_QUERY = graphql(`
  query E2EScene($id: ID!) {
    scene(id: $id) {
      id
      name
      actions {
        id
        targetType
        targetId
      }
      devicePayloads {
        deviceId
        payload
      }
    }
  }
`);

const DELETE_SCENE = graphql(`
  mutation E2EDeleteScene($id: ID!) {
    deleteScene(id: $id)
  }
`);

const SCENES_QUERY = graphql(`
  query E2EScenes {
    scenes {
      id
      name
      actions {
        id
        targetType
        targetId
      }
      devicePayloads {
        deviceId
        payload
      }
    }
  }
`);

const UPDATE_SCENE = graphql(`
  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {
    updateScene(id: $id, input: $input) {
      id
      name
      actions {
        id
        targetType
        targetId
      }
      devicePayloads {
        deviceId
        payload
      }
    }
  }
`);

const CREATE_GROUP = graphql(`
  mutation E2EScenesCreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
    }
  }
`);

const ADD_GROUP_MEMBER = graphql(`
  mutation E2EScenesAddGroupMember($input: AddGroupMemberInput!) {
    addGroupMember(input: $input) {
      id
    }
  }
`);

const DELETE_GROUP = graphql(`
  mutation E2EScenesDeleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`);

describe("scenes", () => {
  let sceneId: string;
  let targetDeviceId: string;

  it("should create a scene with a device target", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();

    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();
    targetDeviceId = lightDevice!.id;

    const payload = JSON.stringify({ on: true, brightness: 200 });

    const result = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Evening Lights",
          actions: [{ targetType: "device", targetId: targetDeviceId }],
          devicePayloads: [{ deviceId: targetDeviceId, payload }],
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

    const result = await graphqlClient.query(SCENE_QUERY, { id: sceneId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.scene).toBeDefined();
    expect(result.data!.scene!.name).toBe("Evening Lights");
    expect(result.data!.scene!.actions).toHaveLength(1);
  });

  it("should apply the scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.mutation(APPLY_SCENE, { sceneId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.applyScene.id).toBe(sceneId);
    expect(result.data!.applyScene.name).toBe("Evening Lights");
  });

  it("should delete the scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.mutation(DELETE_SCENE, { id: sceneId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.deleteScene).toBe(true);
  });

  it("should list all scenes", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();

    const scene1 = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "List Scene A",
          actions: [{ targetType: "device", targetId: lightDevice!.id }],
          devicePayloads: [
            { deviceId: lightDevice!.id, payload: JSON.stringify({ on: true }) },
          ],
        },
      })
      .toPromise();
    const scene2 = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "List Scene B",
          actions: [{ targetType: "device", targetId: lightDevice!.id }],
          devicePayloads: [
            { deviceId: lightDevice!.id, payload: JSON.stringify({ on: false }) },
          ],
        },
      })
      .toPromise();

    expect(scene1.data).toBeDefined();
    expect(scene2.data).toBeDefined();

    const result = await graphqlClient.query(SCENES_QUERY, {}).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    const names = result.data!.scenes.map((s) => s.name);
    expect(names).toContain("List Scene A");
    expect(names).toContain("List Scene B");

    await graphqlClient
      .mutation(DELETE_SCENE, {
        id: scene1.data!.createScene.id,
      })
      .toPromise();
    await graphqlClient
      .mutation(DELETE_SCENE, {
        id: scene2.data!.createScene.id,
      })
      .toPromise();
  });

  it("should update scene name", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();

    const created = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Original Scene Name",
          actions: [{ targetType: "device", targetId: lightDevice!.id }],
          devicePayloads: [
            { deviceId: lightDevice!.id, payload: JSON.stringify({ on: true }) },
          ],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createScene.id;

    const updated = await graphqlClient
      .mutation(UPDATE_SCENE, {
        id,
        input: { name: "Renamed Scene" },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateScene.name).toBe("Renamed Scene");

    await graphqlClient.mutation(DELETE_SCENE, { id }).toPromise();
  });

  it("should update scene actions", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();

    const created = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Actions Test Scene",
          actions: [{ targetType: "device", targetId: lightDevice!.id }],
          devicePayloads: [
            { deviceId: lightDevice!.id, payload: JSON.stringify({ on: true }) },
          ],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createScene.id;

    const newPayload = JSON.stringify({ on: false, brightness: 50 });
    const updated = await graphqlClient
      .mutation(UPDATE_SCENE, {
        id,
        input: {
          actions: [{ targetType: "device", targetId: lightDevice!.id }],
          devicePayloads: [{ deviceId: lightDevice!.id, payload: newPayload }],
        },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateScene.actions).toHaveLength(1);
    expect(updated.data!.updateScene.devicePayloads).toHaveLength(1);
    expect(updated.data!.updateScene.devicePayloads[0].payload).toBe(newPayload);

    await graphqlClient.mutation(DELETE_SCENE, { id }).toPromise();
  });

  it("should apply scene with group target", async () => {
    // EXPECTED FAIL: Bug #1/#2 -- resolveSceneTarget uses in-memory StateReader for groups,
    // but groups are only in DB store. When a scene targets a group, the resolver calls
    // sr.ResolveGroupDevices() which returns empty because groups created via GraphQL
    // mutations are persisted to the database, not the in-memory state reader.
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();

    const group = await graphqlClient
      .mutation(CREATE_GROUP, {
        input: { name: "Scene Target Group" },
      })
      .toPromise();
    expect(group.data).toBeDefined();
    const groupId = group.data!.createGroup.id;

    await graphqlClient
      .mutation(ADD_GROUP_MEMBER, {
        input: { groupId, memberType: "device", memberId: lightDevice!.id },
      })
      .toPromise();

    const scene = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Group Target Scene",
          actions: [{ targetType: "group", targetId: groupId }],
          devicePayloads: [
            {
              deviceId: lightDevice!.id,
              payload: JSON.stringify({ on: true, brightness: 255 }),
            },
          ],
        },
      })
      .toPromise();
    expect(scene.data).toBeDefined();
    const sceneIdLocal = scene.data!.createScene.id;

    const { messages, cleanup } = await subscribeMQTTCommands();

    await graphqlClient.mutation(APPLY_SCENE, { sceneId: sceneIdLocal }).toPromise();

    await new Promise((r) => setTimeout(r, 1000));

    expect(messages.length).toBeGreaterThan(0);

    await cleanup();
    await graphqlClient.mutation(DELETE_SCENE, { id: sceneIdLocal }).toPromise();
    await graphqlClient.mutation(DELETE_GROUP, { id: groupId }).toPromise();
  });
});
