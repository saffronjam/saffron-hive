import { describe, expect, it } from "vitest";
import { automationsByWebhookEndpoint, referencedWebhookEndpointIds } from "$lib/automation-config";

describe("webhook automation references", () => {
  it("recognizes only webhook trigger nodes with endpoint IDs", () => {
    expect(
      referencedWebhookEndpointIds({
        type: "trigger",
        config: {trigger:{mode:"webhook",endpointId:"hook-1"}},
      }),
    ).toEqual(["hook-1"]);
    expect(
      referencedWebhookEndpointIds({
        type: "trigger",
        config: {trigger:{mode:"device_state",endpointId:"hook-1"}},
      }),
    ).toEqual([]);
    expect(referencedWebhookEndpointIds({ type: "action", config: {action:{actionType:""}} })).toEqual([]);
    expect(referencedWebhookEndpointIds({ type: "trigger", config: {trigger:{mode:"unset"}} })).toEqual([]);
  });

  it("groups each automation once per endpoint", () => {
    const first = {
      id: "automation-1",
      name: "Pipeline alarm",
      nodes: [
        {
          type: "trigger",
          config: {trigger:{mode:"webhook",endpointId:"hook-1"}},
        },
        {
          type: "trigger",
          config: {trigger:{mode:"webhook",endpointId:"hook-1"}},
        },
      ],
    };
    const second = {
      id: "automation-2",
      name: "Release alarm",
      nodes: [
        {
          type: "trigger",
          config: {trigger:{mode:"webhook",endpointId:"hook-1"}},
        },
        {
          type: "trigger",
          config: {trigger:{mode:"webhook",endpointId:"hook-2"}},
        },
      ],
    };

    const grouped = automationsByWebhookEndpoint([first, second]);

    expect(grouped.get("hook-1")).toEqual([first, second]);
    expect(grouped.get("hook-2")).toEqual([second]);
  });
});
