import { describe, expect, it } from "vitest";
import {
	eventTypeForMode,
	generateFilterExpr,
	normalizeTriggerConfig,
	serializeTriggerConfig,
	type TriggerConfig,
} from "$lib/components/graph/trigger-expr";

function roundTrip(cfg: TriggerConfig): TriggerConfig {
	const serialized = serializeTriggerConfig(cfg);
	return normalizeTriggerConfig(JSON.parse(serialized) as Record<string, unknown>);
}

describe("normalizeTriggerConfig mode recovery", () => {
	it("availability: recovers deviceId", () => {
		const cfg: TriggerConfig = {
			mode: "availability",
			eventType: "device.availability_changed",
			deviceId: "0x1234",
			deviceName: "Lamp",
		};
		const round = roundTrip(cfg);
		expect(round.mode).toBe("availability");
		expect(round.deviceId).toBe("0x1234");
	});

	it("button_action: uses device.action_fired event type", () => {
		expect(eventTypeForMode("button_action")).toBe("device.action_fired");
	});

	it("button_action: generates payload-based filter, not device-state lookup", () => {
		const filter = generateFilterExpr({
			mode: "button_action",
			deviceId: "0xABCD",
			deviceName: "Bedroom switch",
			actionValue: "single",
		});
		expect(filter).toBe(
			'trigger.device_id == "0xABCD" && trigger.payload.action == "single"',
		);
		expect(filter).not.toContain("device(");
	});

	it.each([
		"single",
		"double",
		"triple",
		"hold",
		"release",
		"on_press",
		"on_press_release",
		"arrow_left_click",
	])("button_action: round-trips action value %s", (actionValue) => {
		const cfg: TriggerConfig = {
			mode: "button_action",
			eventType: "device.action_fired",
			deviceId: "0xABCD",
			deviceName: "Bedroom switch",
			actionValue,
		};
		const round = roundTrip(cfg);
		expect(round.mode).toBe("button_action");
		expect(round.eventType).toBe("device.action_fired");
		expect(round.deviceId).toBe("0xABCD");
		expect(round.actionValue).toBe(actionValue);
	});

	it("button_action: device-only filter (no actionValue) round-trips and matches any action", () => {
		const cfg: TriggerConfig = {
			mode: "button_action",
			eventType: "device.action_fired",
			deviceId: "0xDEAD",
		};
		const filter = generateFilterExpr(cfg);
		expect(filter).toBe('trigger.device_id == "0xDEAD"');
		const round = roundTrip(cfg);
		expect(round.mode).toBe("button_action");
		expect(round.deviceId).toBe("0xDEAD");
		expect(round.actionValue).toBeUndefined();
	});

	it("button_action: escapes quotes and backslashes in actionValue", () => {
		const cfg: TriggerConfig = {
			mode: "button_action",
			eventType: "device.action_fired",
			deviceId: "0xABCD",
			actionValue: 'weird"action\\value',
		};
		const filter = generateFilterExpr(cfg);
		expect(filter).toBe(
			'trigger.device_id == "0xABCD" && trigger.payload.action == "weird\\"action\\\\value"',
		);
	});

	it("button_action: empty config (no deviceId) returns true filter", () => {
		const filter = generateFilterExpr({ mode: "button_action" });
		expect(filter).toBe("true");
	});

	it("button_action: legacy device(X).action filter falls back to custom mode", () => {
		// Old broken filters on device.state_changed are not auto-migrated;
		// they surface as custom so the user can see and rewrite them.
		const raw = {
			kind: "event",
			event_type: "device.state_changed",
			filter_expr:
				'trigger.device_id == "0xABCD" && device("Bedroom switch").action == "single"',
		};
		const round = normalizeTriggerConfig(raw as Record<string, unknown>);
		expect(round.mode).toBe("custom");
		expect(round.customExpr).toBe(raw.filter_expr);
	});

	it("device_state (numeric): recovers deviceName, property, comparator, value", () => {
		const cfg: TriggerConfig = {
			mode: "device_state",
			eventType: "device.state_changed",
			deviceId: "0x9999",
			deviceName: "Thermo",
			property: "temperature",
			comparator: ">",
			value: "22",
		};
		const round = roundTrip(cfg);
		expect(round.mode).toBe("device_state");
		expect(round.deviceName).toBe("Thermo");
		expect(round.property).toBe("temperature");
		expect(round.comparator).toBe(">");
		expect(round.value).toBe("22");
	});

	it("device_state (string): strips surrounding quotes from value", () => {
		const cfg: TriggerConfig = {
			mode: "device_state",
			eventType: "device.state_changed",
			deviceId: "0xEEEE",
			deviceName: "Door",
			property: "state",
			comparator: "==",
			value: "open",
		};
		const round = roundTrip(cfg);
		expect(round.mode).toBe("device_state");
		expect(round.value).toBe("open");
	});

	it("manual: round-trips as manual", () => {
		const round = roundTrip({ mode: "manual" });
		expect(round.mode).toBe("manual");
	});

	it("schedule (every): round-trips as schedule/every", () => {
		const round = roundTrip({
			mode: "schedule",
			scheduleSubmode: "every",
			scheduleIntervalValue: 15,
			scheduleIntervalUnit: "minutes",
		});
		expect(round.mode).toBe("schedule");
		expect(round.scheduleSubmode).toBe("every");
		expect(round.scheduleIntervalValue).toBe(15);
		expect(round.scheduleIntervalUnit).toBe("minutes");
	});

	it("custom: round-trips as custom", () => {
		const round = roundTrip({
			mode: "custom",
			eventType: "device.state_changed",
			customExpr: "device(\"X\").on && trigger.device_id == \"Y\"",
		});
		expect(round.mode).toBe("custom");
		expect(round.customExpr).toContain("device(");
	});

	it("unrecognized filter falls back to custom", () => {
		const raw = {
			kind: "event",
			event_type: "device.state_changed",
			filter_expr: "unparseable",
		};
		const round = normalizeTriggerConfig(raw as Record<string, unknown>);
		expect(round.mode).toBe("custom");
		expect(round.customExpr).toBe("unparseable");
	});
});
