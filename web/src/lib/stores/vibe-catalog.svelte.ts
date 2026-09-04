import type { Client } from "@urql/svelte";
import { graphql } from "$lib/gql";
import type { ScenePreview, VibeDomain } from "$lib/scene-editable";
import { m } from "$lib/i18n/messages";
import { locale } from "$lib/i18n/locale.svelte";

export interface VibePreset {
  id: string;
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
        console.error(result.error);
        error = m.vibe_load_failed({}, locale.messageOptions());
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
