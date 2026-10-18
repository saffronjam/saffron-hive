import { onExternalChanges } from "$lib/external-changes";

/** Refreshes clean editors and holds remote changes until dirty edits are discarded. */
export function createEditorRefresh<T>(options: {
  read: () => Promise<T>;
  apply: (value: T) => void;
  dirty: () => boolean;
  busy: () => boolean;
}) {
  let baseline = "";
  let conflict = $state(false);
  let generation = 0;
  function accept(value: T) {
    generation++;
    baseline = JSON.stringify(value);
    conflict = false;
  }
  async function refresh(discard = false) {
    if (options.busy()) return;
    const current = ++generation;
    try {
      const value = await options.read();
      if (current !== generation || options.busy()) return;
      if (!discard && JSON.stringify(value) === baseline) return;
      if (!discard && options.dirty()) {
        conflict = true;
        return;
      }
      options.apply(value);
      accept(value);
    } catch {
      // A failed refresh must not replace the last successfully loaded draft.
    }
  }
  onExternalChanges(() => {
    void refresh();
  });
  return {
    get conflict() {
      return conflict;
    },
    accept,
    refresh,
  };
}
