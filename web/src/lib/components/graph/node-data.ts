import { createContext } from "svelte";
import type { SummaryLookups } from "./automation-summary";

interface GraphEditorContext {
  lookups: () => SummaryLookups;
  isActive: (id: string) => boolean;
  activate: (id: string) => void;
  connectionError: (id: string) => string | undefined;
}

export const [getGraphEditorContext, setGraphEditorContext] = createContext<GraphEditorContext>();

/** What every compact automation node receives from the editor page. */
export interface GraphNodeData<Config> extends Record<string, unknown> {
  config: Config;
  readOnly: boolean;
  /** Live-mode flash when the node fires. */
  activated: boolean;
  /** When a running trigger hold will fire (ISO time), or null. */
  pendingUntil?: string | null;
  runtimeState?: string;
}
