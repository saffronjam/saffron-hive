import { describe, it, expect } from "vitest";
import { graphql } from "$lib/gql";
import { getContext, subscribeMQTTCommands } from "./setup.js";
import { SceneLightOverrideKind, SceneTargetType } from "$lib/gql/graphql";

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
      targets {
        targetType
        targetId
      }
      lighting {
        overrides {
          deviceId
          kind
          state {
            on
            brightness
          }
        }
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
      targets {
        targetType
        targetId
      }
      lighting {
        overrides {
          deviceId
          kind
          state {
            on
            brightness
          }
        }
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
      targets {
        targetType
        targetId
      }
      lighting {
        overrides {
          deviceId
          kind
          state {
            on
            brightness
          }
        }
      }
    }
  }
`);

const UPDATE_SCENE = graphql(`
  mutation E2EUpdateScene($id: ID!, $input: UpdateSceneInput!) {
    updateScene(id: $id, input: $input) {
      id
      name
      targets {
        targetType
        targetId
      }
      lighting {
        overrides {
          deviceId
          kind
          state {
            on
            brightness
          }
        }
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

    const result = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Evening Lights",
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: targetDeviceId }],
            lighting: {
              overrides: [
                {
                  deviceId: targetDeviceId,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true, brightness: 200 },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.createScene.name).toBe("Evening Lights");
    expect(result.data!.createScene.targets).toHaveLength(1);
    expect(result.data!.createScene.targets[0].targetType).toBe("device");
    expect(result.data!.createScene.targets[0].targetId).toBe(targetDeviceId);

    sceneId = result.data!.createScene.id;
  });

  it("should query the created scene", async () => {
    const { graphqlClient } = getContext();

    const result = await graphqlClient.query(SCENE_QUERY, { id: sceneId }).toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.scene).toBeDefined();
    expect(result.data!.scene!.name).toBe("Evening Lights");
    expect(result.data!.scene!.targets).toHaveLength(1);
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
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightDevice!.id }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();
    const scene2 = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "List Scene B",
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightDevice!.id }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: false },
                },
              ],
            },
            supportingStates: [],
          },
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
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightDevice!.id }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true },
                },
              ],
            },
            supportingStates: [],
          },
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

  it("should update a scene definition", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient.query(DEVICES_QUERY, {}).toPromise();
    expect(devicesResult.data).toBeDefined();
    const lightDevice = devicesResult.data!.devices.find((d) => d.type === "light");
    expect(lightDevice).toBeDefined();

    const created = await graphqlClient
      .mutation(CREATE_SCENE, {
        input: {
          name: "Definition Test Scene",
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightDevice!.id }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createScene.id;

    const updated = await graphqlClient
      .mutation(UPDATE_SCENE, {
        id,
        input: {
          definition: {
            targets: [{ targetType: SceneTargetType.Device, targetId: lightDevice!.id }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: false, brightness: 50 },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateScene.targets).toHaveLength(1);
    expect(updated.data!.updateScene.lighting.overrides).toContainEqual(
      expect.objectContaining({
        deviceId: lightDevice!.id,
        kind: SceneLightOverrideKind.State,
        state: expect.objectContaining({ on: false, brightness: 50 }),
      }),
    );

    await graphqlClient.mutation(DELETE_SCENE, { id }).toPromise();
  });

  it("should apply scene with group target", async () => {
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
          definition: {
            targets: [{ targetType: SceneTargetType.Group, targetId: groupId }],
            lighting: {
              overrides: [
                {
                  deviceId: lightDevice!.id,
                  kind: SceneLightOverrideKind.State,
                  state: { on: true, brightness: 254 },
                },
              ],
            },
            supportingStates: [],
          },
        },
      })
      .toPromise();
    expect(scene.error).toBeUndefined();
    expect(scene.data).not.toBeNull();
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
