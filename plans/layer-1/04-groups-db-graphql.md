# Plan: Groups — DB Store + GraphQL

## Dependencies
- layer-0/01-groups-domain (group types exist)

## Goal
Persist groups in SQLite and expose them via GraphQL.

## Migration 002

`internal/store/migrations/002_groups.up.sql`:

```sql
CREATE TABLE groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_type TEXT NOT NULL,  -- "device" or "group"
    member_id TEXT NOT NULL,
    UNIQUE(group_id, member_type, member_id)
);
```

## Store interface additions

Add to `Store` interface:
- `CreateGroup(ctx, params) (Group, error)`
- `GetGroup(ctx, id) (Group, error)`
- `ListGroups(ctx) ([]Group, error)`
- `DeleteGroup(ctx, id) error`
- `AddGroupMember(ctx, params) (GroupMember, error)`
- `ListGroupMembers(ctx, groupID) ([]GroupMember, error)`
- `RemoveGroupMember(ctx, id) error`
- `ListGroupsContainingMember(ctx, memberType, memberID) ([]Group, error)` — useful for UI

## GraphQL schema additions

```graphql
type Group {
  id: ID!
  name: String!
  members: [GroupMember!]!
  resolvedDevices: [Device!]!  # recursive resolution
}

type GroupMember {
  id: ID!
  memberType: String!  # "device" or "group"
  memberId: ID!
  device: Device       # populated if memberType == "device"
  group: Group         # populated if memberType == "group"
}

input CreateGroupInput { name: String! }
input UpdateGroupInput { name: String }
input AddGroupMemberInput { groupId: ID!, memberType: String!, memberId: ID! }
```

Add queries: `groups`, `group(id)`
Add mutations: `createGroup`, `updateGroup`, `deleteGroup`, `addGroupMember`, `removeGroupMember`

## Scene/automation target updates

Update SceneAction and AutomationAction (later, in layer-2) to support `targetType: "device" | "group"` and `targetId` instead of just `deviceId`. This plan only adds the group CRUD — wiring into scenes/automations is layer-2.

## Tests

- Create group, get, list, delete
- Add device member, add group member
- List members, list resolved devices
- Remove member
- Circular dependency rejection (add group B to A, then A to B → error)
- Delete group cascades members
- GraphQL queries and mutations for groups
