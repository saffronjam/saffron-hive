import { describe, expect, it } from "vitest";
import { automationsByWebhookEndpoint, referencedWebhookEndpointIds } from "$lib/automation-config";

describe("webhook automation references", () => {
  it("recognizes only webhook trigger nodes with endpoint IDs", () => {
    expect(
      referencedWebhookEndpointIds({
        type: "trigger",
        config: JSON.stringify({ event_type: "webhook.received", endpoint_id: "hook-1" }),
      }),
    ).toEqual(["hook-1"]);
    expect(
      referencedWebhookEndpointIds({
        type: "trigger",
        config: JSON.stringify({ event_type: "device.state_changed", endpoint_id: "hook-1" }),
      }),
    ).toEqual([]);
    expect(referencedWebhookEndpointIds({ type: "action", config: "{}" })).toEqual([]);
    expect(referencedWebhookEndpointIds({ type: "trigger", config: "not-json" })).toEqual([]);
  });

  it("groups each automation once per endpoint", () => {
    const first = {
      id: "automation-1",
      name: "Pipeline alarm",
      nodes: [
        {
          type: "trigger",
          config: JSON.stringify({ event_type: "webhook.received", endpoint_id: "hook-1" }),
        },
        {
          type: "trigger",
          config: JSON.stringify({ event_type: "webhook.received", endpoint_id: "hook-1" }),
        },
      ],
    };
    const second = {
      id: "automation-2",
      name: "Release alarm",
      nodes: [
        {
          type: "trigger",
          config: JSON.stringify({ event_type: "webhook.received", endpoint_id: "hook-1" }),
        },
        {
          type: "trigger",
          config: JSON.stringify({ event_type: "webhook.received", endpoint_id: "hook-2" }),
        },
      ],
    };

    const grouped = automationsByWebhookEndpoint([first, second]);

    expect(grouped.get("hook-1")).toEqual([first, second]);
    expect(grouped.get("hook-2")).toEqual([second]);
  });
});
