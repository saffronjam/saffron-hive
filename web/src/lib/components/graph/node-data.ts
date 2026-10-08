import type { SummaryLookups } from "./automation-summary";

/** What every compact automation node receives from the editor page. */
export interface GraphNodeData<Config> extends Record<string, unknown> {
  config: Config;
  readOnly: boolean;
  /** Live-mode flash when the node fires. */
  activated: boolean;
  /** Whether the node is open in the edit panel. */
  isActive: () => boolean;
  /** When a running trigger hold will fire (ISO time), or null. */
  pendingUntil?: string | null;
  runtimeState?: string;
  lookups: () => SummaryLookups;
  onActivate: (id: string) => void;
}
