import { describe, it, expect } from "vitest";
import { gql } from "@urql/core";
import {
  getContext,
  publishDeviceState,
  subscribeMQTTCommands,
} from "./setup.js";

const DEVICES_QUERY = gql`
  query Devices {
    devices {
      id
      name
      type
    }
  }
`;

const CREATE_AUTOMATION = gql`
  mutation CreateAutomation($input: CreateAutomationInput!) {
    createAutomation(input: $input) {
      id
      name
      enabled
      cooldownSeconds
      nodes {
        id
        type
        config
      }
      edges {
        id
        fromNodeId
        toNodeId
      }
    }
  }
`;

const AUTOMATION_QUERY = gql`
  query Automation($id: ID!) {
    automation(id: $id) {
      id
      name
      enabled
      cooldownSeconds
      nodes {
        id
        type
        config
      }
      edges {
        id
        fromNodeId
        toNodeId
      }
    }
  }
`;

const AUTOMATIONS_QUERY = gql`
  query Automations {
    automations {
      id
      name
      enabled
      cooldownSeconds
    }
  }
`;

const UPDATE_AUTOMATION = gql`
  mutation UpdateAutomation($id: ID!, $input: UpdateAutomationInput!) {
    updateAutomation(id: $id, input: $input) {
      id
      name
      enabled
      cooldownSeconds
      nodes {
        id
        type
        config
      }
      edges {
        id
        fromNodeId
        toNodeId
      }
    }
  }
`;

const TOGGLE_AUTOMATION = gql`
  mutation ToggleAutomation($id: ID!, $enabled: Boolean!) {
    toggleAutomation(id: $id, enabled: $enabled) {
      id
      enabled
    }
  }
`;

const DELETE_AUTOMATION = gql`
  mutation DeleteAutomation($id: ID!) {
    deleteAutomation(id: $id)
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

interface AutomationNodeFields {
  id: string;
  type: string;
  config: string;
}

interface AutomationEdgeFields {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

interface AutomationFields {
  id: string;
  name: string;
  enabled: boolean;
  cooldownSeconds: number;
  nodes: AutomationNodeFields[];
  edges: AutomationEdgeFields[];
}

interface AutomationListItem {
  id: string;
  name: string;
  enabled: boolean;
  cooldownSeconds: number;
}

interface CreateAutomationResult {
  createAutomation: AutomationFields;
}

interface AutomationQueryResult {
  automation: AutomationFields | null;
}

interface AutomationsQueryResult {
  automations: AutomationListItem[];
}

interface UpdateAutomationResult {
  updateAutomation: AutomationFields;
}

interface ToggleAutomationResult {
  toggleAutomation: {
    id: string;
    enabled: boolean;
  };
}

interface DeleteAutomationResult {
  deleteAutomation: boolean;
}

interface DeviceFields {
  id: string;
  name: string;
  type: string;
}

interface DevicesQueryResult {
  devices: DeviceFields[];
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

describe("automations", () => {
  it("should create and query an automation", async () => {
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const sensor = devicesResult.data!.devices.find(
      (d) => d.type === "sensor",
    );
    expect(sensor).toBeDefined();
    const light = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(light).toBeDefined();

    const triggerConfig = JSON.stringify({
      deviceId: sensor!.id,
      field: "temperature",
      operator: ">",
      value: 25,
    });
    const actionConfig = JSON.stringify({
      type: "set_device_state",
      targetType: "device",
      targetId: light!.id,
      payload: { on: true },
    });

    const result = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Temp Automation",
          enabled: true,
          cooldownSeconds: 60,
          nodes: [
            { id: "trigger-1", type: "trigger", config: triggerConfig },
            { id: "action-1", type: "action", config: actionConfig },
          ],
          edges: [{ fromNodeId: "trigger-1", toNodeId: "action-1" }],
        },
      })
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    expect(result.data!.createAutomation.name).toBe("Temp Automation");
    expect(result.data!.createAutomation.enabled).toBe(true);
    expect(result.data!.createAutomation.cooldownSeconds).toBe(60);
    expect(result.data!.createAutomation.nodes).toHaveLength(2);
    expect(result.data!.createAutomation.edges).toHaveLength(1);

    const automationId = result.data!.createAutomation.id;

    const queryResult = await graphqlClient
      .query<AutomationQueryResult>(AUTOMATION_QUERY, { id: automationId })
      .toPromise();

    expect(queryResult.error).toBeUndefined();
    expect(queryResult.data).toBeDefined();
    expect(queryResult.data!.automation).toBeDefined();
    expect(queryResult.data!.automation!.name).toBe("Temp Automation");
    expect(queryResult.data!.automation!.nodes).toHaveLength(2);

    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id: automationId })
      .toPromise();
  });

  it("should list automations", async () => {
    const { graphqlClient } = getContext();

    const auto1 = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "List Auto A",
          enabled: true,
          cooldownSeconds: 30,
          nodes: [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "trigger", config: "{}" }],
          edges: [],
        },
      })
      .toPromise();
    const auto2 = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "List Auto B",
          enabled: false,
          cooldownSeconds: 60,
          nodes: [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "trigger", config: "{}" }],
          edges: [],
        },
      })
      .toPromise();

    expect(auto1.data).toBeDefined();
    expect(auto2.data).toBeDefined();

    const result = await graphqlClient
      .query<AutomationsQueryResult>(AUTOMATIONS_QUERY, {})
      .toPromise();

    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    const names = result.data!.automations.map((a) => a.name);
    expect(names).toContain("List Auto A");
    expect(names).toContain("List Auto B");

    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, {
        id: auto1.data!.createAutomation.id,
      })
      .toPromise();
    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, {
        id: auto2.data!.createAutomation.id,
      })
      .toPromise();
  });

  it("should update an automation", async () => {
    const { graphqlClient } = getContext();

    const created = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Update Target",
          enabled: true,
          cooldownSeconds: 30,
          nodes: [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "trigger", config: "{}" }],
          edges: [],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createAutomation.id;

    const updated = await graphqlClient
      .mutation<UpdateAutomationResult>(UPDATE_AUTOMATION, {
        id,
        input: {
          name: "Updated Automation",
          cooldownSeconds: 120,
          nodes: [
            { id: "upd-n1", type: "trigger", config: "{}" },
            { id: "upd-n2", type: "action", config: "{}" },
          ],
          edges: [{ fromNodeId: "upd-n1", toNodeId: "upd-n2" }],
        },
      })
      .toPromise();

    expect(updated.error).toBeUndefined();
    expect(updated.data).toBeDefined();
    expect(updated.data!.updateAutomation.name).toBe("Updated Automation");
    expect(updated.data!.updateAutomation.cooldownSeconds).toBe(120);
    expect(updated.data!.updateAutomation.nodes).toHaveLength(2);
    expect(updated.data!.updateAutomation.edges).toHaveLength(1);

    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id })
      .toPromise();
  });

  it("should toggle automation enabled/disabled", async () => {
    const { graphqlClient } = getContext();

    const created = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Toggle Test",
          enabled: true,
          cooldownSeconds: 30,
          nodes: [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "trigger", config: "{}" }],
          edges: [],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createAutomation.id;
    expect(created.data!.createAutomation.enabled).toBe(true);

    const toggled = await graphqlClient
      .mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, {
        id,
        enabled: false,
      })
      .toPromise();
    expect(toggled.error).toBeUndefined();
    expect(toggled.data).toBeDefined();
    expect(toggled.data!.toggleAutomation.enabled).toBe(false);

    const toggledBack = await graphqlClient
      .mutation<ToggleAutomationResult>(TOGGLE_AUTOMATION, {
        id,
        enabled: true,
      })
      .toPromise();
    expect(toggledBack.error).toBeUndefined();
    expect(toggledBack.data).toBeDefined();
    expect(toggledBack.data!.toggleAutomation.enabled).toBe(true);

    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id })
      .toPromise();
  });

  it("should delete an automation", async () => {
    const { graphqlClient } = getContext();

    const created = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Delete Target",
          enabled: true,
          cooldownSeconds: 30,
          nodes: [{ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type: "trigger", config: "{}" }],
          edges: [],
        },
      })
      .toPromise();
    expect(created.data).toBeDefined();
    const id = created.data!.createAutomation.id;

    const deleted = await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id })
      .toPromise();
    expect(deleted.error).toBeUndefined();
    expect(deleted.data).toBeDefined();
    expect(deleted.data!.deleteAutomation).toBe(true);

    const queryResult = await graphqlClient
      .query<AutomationQueryResult>(AUTOMATION_QUERY, { id })
      .toPromise();
    expect(
      queryResult.data?.automation === null || queryResult.error !== undefined,
    ).toBe(true);
  });

  it("should fire automation with group target action", async () => {
    // EXPECTED FAIL: Bug #3/#4 -- ActionExecutor.resolveTargetDevices uses in-memory
    // StateReader.ResolveGroupDevices. Groups created via GraphQL mutations are only
    // persisted to the database store, not the in-memory state reader. When an automation
    // fires with a group-target action, resolveTargetDevices returns empty because the
    // StateReader has no knowledge of DB-only groups.
    const { graphqlClient } = getContext();

    const devicesResult = await graphqlClient
      .query<DevicesQueryResult>(DEVICES_QUERY, {})
      .toPromise();
    expect(devicesResult.data).toBeDefined();
    const sensor = devicesResult.data!.devices.find(
      (d) => d.type === "sensor",
    );
    expect(sensor).toBeDefined();
    const light = devicesResult.data!.devices.find(
      (d) => d.type === "light",
    );
    expect(light).toBeDefined();

    const group = await graphqlClient
      .mutation<CreateGroupResult>(CREATE_GROUP, {
        input: { name: "Automation Target Group" },
      })
      .toPromise();
    expect(group.data).toBeDefined();
    const groupId = group.data!.createGroup.id;

    await graphqlClient
      .mutation<AddGroupMemberResult>(ADD_GROUP_MEMBER, {
        input: { groupId, memberType: "device", memberId: light!.id },
      })
      .toPromise();

    const triggerConfig = JSON.stringify({
      event_type: "device.state_changed",
      condition_expr: "true",
    });
    const actionConfig = JSON.stringify({
      action_type: "set_device_state",
      target_type: "group",
      target_id: groupId,
      payload: JSON.stringify({ on: true, brightness: 255 }),
    });

    const automation = await graphqlClient
      .mutation<CreateAutomationResult>(CREATE_AUTOMATION, {
        input: {
          name: "Group Target Automation",
          enabled: true,
          cooldownSeconds: 0,
          nodes: [
            { id: "grp-trigger-1", type: "trigger", config: triggerConfig },
            { id: "grp-action-1", type: "action", config: actionConfig },
          ],
          edges: [{ fromNodeId: "grp-trigger-1", toNodeId: "grp-action-1" }],
        },
      })
      .toPromise();
    expect(automation.data).toBeDefined();
    const automationId = automation.data!.createAutomation.id;

    const { messages, cleanup } = await subscribeMQTTCommands();

    await publishDeviceState(sensor!.name, {
      temperature: 35,
      humidity: 60,
    });

    await new Promise((r) => setTimeout(r, 2000));

    expect(messages.length).toBeGreaterThan(0);

    await cleanup();
    await graphqlClient
      .mutation<DeleteAutomationResult>(DELETE_AUTOMATION, { id: automationId })
      .toPromise();
    await graphqlClient
      .mutation<DeleteGroupResult>(DELETE_GROUP, { id: groupId })
      .toPromise();
  });
});
