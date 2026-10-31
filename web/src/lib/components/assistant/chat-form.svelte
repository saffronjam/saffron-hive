<script lang="ts">
 import type { AssistantConversationFieldsFragment } from "$lib/gql/graphql";
 import ChatField from "./chat-field.svelte";
 import SectionDivider from "$lib/components/section-divider.svelte";
 import { m } from "$lib/i18n/messages";
 import { locale } from "$lib/i18n/locale.svelte";
 let { form, conversationId, onchange, register }: {
  form: AssistantConversationFieldsFragment["forms"][number];
  conversationId: string;
  onchange: (conversation: AssistantConversationFieldsFragment) => void;
  register: (key: string, flush: () => Promise<void>) => () => void;
 } = $props();
 const title = $derived(form.title.trim());
 const rows = $derived.by(() => {
  const fields = form.fields;
  const named = fields.length > 4 && fields.some(field => field.section.trim());
  const grouped = fields.length >= 7 || named;
  const groups: { key: string; label: string; fields: typeof fields }[] = [];
  for (const field of fields) {
   const key = !grouped ? "" : named ? field.section.trim() : ["SLIDER", "NUMBER", "COLOR"].includes(field.kind) ? "adjustments" : "details";
   const last = groups.at(-1);
   if (last?.key === key) last.fields.push(field);
   else groups.push({ key, label: named && fields.length >= 7 ? key : "", fields: [field] });
  }
  if (!named) {
   for (let i = groups.length - 1; i >= 0 && groups.length > 1; i--) {
    if (groups[i].fields.length > 1) continue;
    if (i === 0) groups[1].fields.unshift(...groups[0].fields);
    else groups[i - 1].fields.push(...groups[i].fields);
    groups.splice(i, 1);
   }
  }
  const sections = groups.flatMap(group => {
   const parts = [];
   for (let i = 0; i < group.fields.length;) {
    const count = group.fields.length - i > 6 ? 4 : group.fields.length - i;
    parts.push({ label: i === 0 ? group.label : "", fields: group.fields.slice(i, i + count) });
    i += count;
   }
   return parts;
  });
  return sections.flatMap((group, index) => group.fields.map((field, fieldIndex) => ({
   field,
   divider: fieldIndex === 0 && (index > 0 || !!group.label),
   heading: group.label,
  })));
 });
</script>

<fieldset class="@container/chat-form bg-card shadow-card w-full min-w-0 max-w-lg rounded-lg p-4" aria-label={title || m.assistant_controls({}, locale.messageOptions())} data-chat-form={form.id}>
 {#if title}<h3 class="mb-4 text-sm font-medium">{title}</h3>{/if}
 <div class="grid grid-cols-1 items-start gap-x-5 gap-y-4 @sm/chat-form:grid-cols-2">
  {#each rows as row (row.field.key)}
   {#if row.divider}
    <div class="col-span-full" data-chat-section={row.heading}>
     <SectionDivider label={row.heading || undefined} />
    </div>
   {/if}
   <ChatField field={row.field} {conversationId} {onchange} {register} />
  {/each}
 </div>
</fieldset>
