import type { Client } from "@urql/svelte";
import { SCENE_AUTHORING } from "$lib/graphql/authoring";
import { SceneStateSource, SceneTargetType } from "$lib/gql/graphql";
import type { DesiredSceneState } from "$lib/scene-editable";

export async function authorSceneStates(
  client: Client,
  deviceIds: string[],
  source: "current" | "defaults",
  fallback = false,
): Promise<Map<string, DesiredSceneState>> {
  const result = await client
    .query(
      SCENE_AUTHORING,
      {
        input: {
          targets: deviceIds.map((id) => ({ targetType: SceneTargetType.Device, targetId: id })),
          source: source === "current" ? SceneStateSource.Current : SceneStateSource.Defaults,
          fallbackToDefaults: fallback,
        },
      },
      { requestPolicy: "network-only" },
    )
    .toPromise();
  if (result.error) throw result.error;
  if (!result.data) throw new Error("Scene state is unavailable");
  return new Map(
    result.data.sceneAuthoring.map((item) => [
      item.deviceId,
      JSON.parse(
        JSON.stringify(item.state, (key, value: unknown) =>
          key === "__typename" || value === null ? undefined : value,
        ),
      ) as DesiredSceneState,
    ]),
  );
}
