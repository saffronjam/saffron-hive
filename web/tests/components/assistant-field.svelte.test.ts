import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import ChatField from "$lib/components/assistant/chat-field.svelte";
import type { AssistantConversationFieldsFragment, AssistantFieldValueInput } from "$lib/gql/graphql";
import { AssistantFieldKind } from "$lib/gql/graphql";

const io = vi.hoisted(() => ({ requests: [] as Array<{ input: { expectedRevision: number; value: AssistantFieldValueInput }; resolve: (result: unknown) => void }> }));
vi.mock("@urql/svelte", async original => ({
  ...await original<Record<string, unknown>>(),
  getContextClient: () => ({
    mutation(_document: unknown, variables: { input: { expectedRevision: number; value: AssistantFieldValueInput } }) {
      const deferred = Promise.withResolvers<unknown>();
      io.requests.push({ input: variables.input, resolve: deferred.resolve });
      return { toPromise: () => deferred.promise };
    },
  }),
}));

type Field = AssistantConversationFieldsFragment["forms"][number]["fields"][number];
let host: HTMLDivElement;
let component: ReturnType<typeof mount>;
let flush: () => Promise<void>;
const props = $state({ field: {} as Field });
function respond(index: number) {
  const request = io.requests[index];
  const field = { ...props.field, revision: request.input.expectedRevision + 1, value: request.input.value };
  request.resolve({ data: { updateAssistantField: { forms: [{ fields: [field] }] } } });
}
function edit(value: string) {
  const input = host.querySelector("input")!;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  flushSync();
}
beforeEach(() => {
  io.requests.length = 0;
  props.field = { key: "name", kind: AssistantFieldKind.Text, label: "Scene name", description: "", section: "", options: [], revision: 1, value: { text: "Evening" } };
  host = document.createElement("div");
  document.body.append(host);
  component = mount(ChatField, { target: host, props: {
    get field() { return props.field; }, conversationId: "chat",
    onchange: c => { props.field = c.forms[0].fields[0]; },
    register: (_key, callback) => { flush = callback; return () => {}; },
  } });
  flushSync();
});
afterEach(async () => { await unmount(component); host.remove(); });

it("flushes the latest edit after an in-flight save without overwriting it with the response", async () => {
  edit("First choice");
  expect(io.requests).toHaveLength(1);
  edit("Final choice");
  const done = flush();
  respond(0);
  await vi.waitFor(() => expect(io.requests).toHaveLength(2));
  expect(io.requests[1].input).toMatchObject({ expectedRevision: 2, value: { text: "Final choice" } });
  respond(1);
  await done;
  flushSync();
  expect(host.querySelector("input")!.value).toBe("Final choice");
  expect(io.requests).toHaveLength(2);
});

it("preserves a focused draft and rejects a stale revision instead of silently rebasing it", async () => {
  host.querySelector("input")!.focus();
  flushSync();
  props.field = { ...props.field, revision: 4, value: { text: "Another tab" } };
  flushSync();
  expect(host.querySelector("input")!.value).toBe("Evening");
  edit("My draft");
  expect(io.requests[0].input.expectedRevision).toBe(1);
  io.requests[0].resolve({ error: { message: "changed", graphQLErrors: [{ message: "changed", extensions: { code: "REVISION_CONFLICT" } }] } });
  await expect(flush()).rejects.toThrow();
  flushSync();
  expect(host.querySelector("input")!.value).toBe("My draft");
  expect(host.textContent).toContain("Reload saved");
});
