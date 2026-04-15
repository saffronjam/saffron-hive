# Plan: Groups Domain Model

## Goal
Add groups as a first-class concept. A group is a named collection of devices or other groups. Groups can be targets for scene actions, automation actions, and direct commands. Circular dependencies must be prevented.

## Domain types

Add to `internal/device/`:

- `GroupID` — string type (UUID)
- `Group` struct — `ID GroupID`, `Name string`
- `GroupMemberType` — string type (`"device"`, `"group"`)
- `GroupMember` struct — `GroupID GroupID`, `MemberType GroupMemberType`, `MemberID string`

## Group resolution

A function that recursively resolves a group to its leaf device IDs:

```go
ResolveGroupDevices(groupID GroupID) []DeviceID
```

This walks the group tree, collecting all device members. If a member is a group, it recurses. The function needs access to the group membership data (from the state store or DB store).

Add to `StateReader` interface:
- `GetGroup(GroupID) (*Group, bool)`
- `ListGroups() []Group`
- `ListGroupMembers(GroupID) []GroupMember`
- `ResolveGroupDevices(GroupID) []DeviceID`

Add to `StateWriter` interface:
- `CreateGroup(Group)`
- `DeleteGroup(GroupID)`
- `AddGroupMember(GroupMember) error` — returns error if circular dependency detected
- `RemoveGroupMember(GroupID, GroupMemberType, string)`

## Circular dependency prevention

When adding a group member where MemberType is "group", walk the member group's tree. If the parent GroupID appears anywhere in the subtree, reject with an error. This check runs at write time, not read time.

## Files

- `internal/device/group.go` — GroupID, Group, GroupMemberType, GroupMember types
- Update `internal/device/interfaces.go` — add group methods to StateReader/StateWriter
- Update `internal/device/memory_store.go` — implement group storage + resolution + cycle detection

## Tests

- Create group, list groups, get group
- Add device member, list members, resolve to device IDs
- Add group member, resolve recursively (group containing group containing devices)
- Circular dependency: A contains B, B contains A → error
- Deep circular: A contains B, B contains C, C contains A → error
- Delete group, members cleaned up
- Remove member from group
