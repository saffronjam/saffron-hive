/**
 * Whether a keyboard event's target is a focusable text-editing surface
 * (`<input>`, `<textarea>`, `<select>`, or any `contenteditable` element).
 * Use to gate canvas/editor-level shortcuts so they don't hijack native
 * copy/paste/undo while the user is typing in a form field.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
