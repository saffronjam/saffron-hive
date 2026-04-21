import { describe, it, expect } from "vitest";
import {
	chipsByDevice,
	membershipRowsForDevice,
	type MembershipGroup,
	type MembershipRoom,
} from "$lib/memberships";

describe("chipsByDevice", () => {
	it("returns an empty map when there are no rooms or groups", () => {
		expect(chipsByDevice([], [])).toEqual(new Map());
	});

	it("indexes a device's direct room memberships", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "Kitchen", devices: [{ id: "d1" }, { id: "d2" }] },
			{ id: "r2", name: "Hallway", devices: [{ id: "d2" }] },
		];

		const result = chipsByDevice(rooms, []);

		expect(result.get("d1")).toEqual({
			roomChips: [{ id: "r1", name: "Kitchen", icon: null }],
			groupChips: [],
		});
		expect(result.get("d2")).toEqual({
			roomChips: [
				{ id: "r1", name: "Kitchen", icon: null },
				{ id: "r2", name: "Hallway", icon: null },
			],
			groupChips: [],
		});
	});

	it("indexes a device's direct group memberships", () => {
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "All lights",
				members: [
					{ id: "m1", memberType: "device", memberId: "d1" },
					{ id: "m2", memberType: "device", memberId: "d2" },
				],
			},
		];

		const result = chipsByDevice([], groups);

		expect(result.get("d1")?.groupChips).toEqual([{ id: "g1", name: "All lights", icon: null }]);
		expect(result.get("d2")?.groupChips).toEqual([{ id: "g1", name: "All lights", icon: null }]);
	});

	it("skips non-device group members (nested groups and rooms)", () => {
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "Mixed",
				members: [
					{ id: "m1", memberType: "device", memberId: "d1" },
					{ id: "m2", memberType: "group", memberId: "g2" },
					{ id: "m3", memberType: "room", memberId: "r1" },
				],
			},
		];

		const result = chipsByDevice([], groups);

		expect(result.size).toBe(1);
		expect(result.get("d1")).toBeDefined();
		expect(result.get("g2")).toBeUndefined();
		expect(result.get("r1")).toBeUndefined();
	});

	it("combines room and group chips for the same device", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "Kitchen", devices: [{ id: "d1" }] },
		];
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "Lights",
				members: [{ id: "m1", memberType: "device", memberId: "d1" }],
			},
		];

		const result = chipsByDevice(rooms, groups);

		expect(result.get("d1")).toEqual({
			roomChips: [{ id: "r1", name: "Kitchen", icon: null }],
			groupChips: [{ id: "g1", name: "Lights", icon: null }],
		});
	});
});

describe("membershipRowsForDevice", () => {
	it("returns an empty array when deviceId is undefined (not yet loaded)", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "Kitchen", devices: [{ id: "d1" }] },
		];
		expect(membershipRowsForDevice(undefined, rooms, [])).toEqual([]);
	});

	it("returns an empty array when the device is not in any room or group", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "Kitchen", devices: [{ id: "other" }] },
		];
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "Lights",
				members: [{ id: "m1", memberType: "device", memberId: "other" }],
			},
		];

		expect(membershipRowsForDevice("d1", rooms, groups)).toEqual([]);
	});

	it("prefixes row ids so room and group ids never collide", () => {
		const rooms: MembershipRoom[] = [
			{ id: "same-id", name: "Room", devices: [{ id: "d1" }] },
		];
		const groups: MembershipGroup[] = [
			{
				id: "same-id",
				name: "Group",
				members: [{ id: "m1", memberType: "device", memberId: "d1" }],
			},
		];

		const rows = membershipRowsForDevice("d1", rooms, groups);

		expect(rows.map((r) => r.id)).toEqual(["room:same-id", "group:same-id"]);
	});

	it("returns roomId on room rows (payload for removeRoomDevice)", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "Kitchen", devices: [{ id: "d1" }] },
		];

		const [row] = membershipRowsForDevice("d1", rooms, []);

		expect(row).toMatchObject({
			kind: "room",
			roomId: "r1",
			name: "Kitchen",
		});
	});

	it("returns the GroupMember id on group rows (payload for removeGroupMember)", () => {
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "Lights",
				members: [
					{ id: "member-123", memberType: "device", memberId: "d1" },
					{ id: "other", memberType: "device", memberId: "d2" },
				],
			},
		];

		const [row] = membershipRowsForDevice("d1", [], groups);

		expect(row).toMatchObject({
			kind: "group",
			groupId: "g1",
			groupMemberId: "member-123",
		});
	});

	it("lists rooms first, then groups (stable order for the UI)", () => {
		const rooms: MembershipRoom[] = [
			{ id: "r1", name: "A room", devices: [{ id: "d1" }] },
		];
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "A group",
				members: [{ id: "m1", memberType: "device", memberId: "d1" }],
			},
		];

		const rows = membershipRowsForDevice("d1", rooms, groups);

		expect(rows.map((r) => r.kind)).toEqual(["room", "group"]);
	});

	it("ignores non-device group members when matching the device id", () => {
		const groups: MembershipGroup[] = [
			{
				id: "g1",
				name: "Mixed",
				members: [
					{ id: "m1", memberType: "room", memberId: "d1" },
					{ id: "m2", memberType: "group", memberId: "d1" },
				],
			},
		];

		expect(membershipRowsForDevice("d1", [], groups)).toEqual([]);
	});
});
