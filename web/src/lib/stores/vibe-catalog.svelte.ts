import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { ScenePreview, VibeDomain } from "$lib/scene-editable";

export interface VibePreset {
  id: string;
  title: string;
  category: string;
  domain: VibeDomain;
  seed: string;
  brightness: number;
  movement: number;
  cycleSeconds: number;
  preview: ScenePreview;
}

const VIBE_CATALOG = graphql(`
  query VibeCatalog {
    vibePresets {
      id
      title
      category
      domain
      seed
      brightness
      movement
      cycleSeconds
      preview {
        width
        height
        pixels {
          r
          g
          b
        }
        swatches {
          x
          y
          color {
            r
            g
            b
          }
        }
      }
    }
  }
`);

let items = $state<VibePreset[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let pending: Promise<void> | null = null;

async function load(client: Client): Promise<void> {
  if (items.length > 0) return;
  if (pending) return pending;

  loading = true;
  error = null;
  pending = client
    .query(VIBE_CATALOG, {}, { requestPolicy: "cache-first" })
    .toPromise()
    .then((result) => {
      if (result.error || !result.data) {
        error = result.error?.message ?? "Could not load the Vibe gallery.";
        return;
      }
      items = result.data.vibePresets as VibePreset[];
    })
    .finally(() => {
      loading = false;
      pending = null;
    });
  return pending;
}

export const vibeCatalog = {
  get items() {
    return items;
  },
  get loading() {
    return loading;
  },
  get error() {
    return error;
  },
  load,
};
