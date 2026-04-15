# Plan: Scenes with Group Targets

## Dependencies
- layer-0/01-groups-domain (group types exist)
- layer-1/04-groups-db-graphql (groups in DB + GraphQL)

## Goal
Update scenes to support group targets. A scene action can target a device or a group. When applying a scene with a group target, the command expands to all devices in the group.

## Migration 004

`internal/store/migrations/004_scene_target_type.up.sql`:

```sql
ALTER TABLE scene_actions ADD COLUMN target_type TEXT NOT NULL DEFAULT 'device';
ALTER TABLE scene_actions RENAME COLUMN device_id TO target_id;
```

## Store changes

- `CreateSceneActionParams` gets `TargetType string` and `TargetID string` instead of `DeviceID`
- `SceneAction` gets `TargetType` and `TargetID` fields

## GraphQL schema changes

Update `SceneAction`:
```graphql
type SceneAction {
  id: ID!
  targetType: String!  # "device" or "group"
  targetId: ID!
  target: SceneTarget!  # union
  payload: String!
}

union SceneTarget = Device | Group
```

Update inputs similarly.

## Scene application logic

When applying a scene:
1. For each action, check targetType
2. If "device", send command to device
3. If "group", resolve group → device IDs, send command to each
4. State comparison still applies per-device (skip if already in target state)

## Tests

- Create scene with device target, apply, verify command sent
- Create scene with group target, apply, verify commands sent to all group members
- Nested group resolution in scene
- State comparison skips devices already in target state
- GraphQL: create scene with mixed device/group targets
