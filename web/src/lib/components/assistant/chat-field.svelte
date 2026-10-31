<script lang="ts">
 import { getContextClient } from "@urql/svelte";
 import { onDestroy, untrack } from "svelte";
 import type { AssistantConversationFieldsFragment, AssistantFieldValueInput } from "$lib/gql/graphql";
 import { CHAT_FIELD_UPDATE, CHAT_GET, uploadAssistantImage } from "$lib/assistant";
 import { Input } from "$lib/components/ui/input";
 import { Slider } from "$lib/components/ui/slider";
 import { Switch } from "$lib/components/ui/switch";
 import { Button } from "$lib/components/ui/button";
 import * as Select from "$lib/components/ui/select";
 import * as Popover from "$lib/components/ui/popover";
 import LightColorPicker from "$lib/components/light-color-picker.svelte";
 import HiveColorSwatch from "$lib/components/hive-color-swatch.svelte";
 import { hexToRgb } from "$lib/device-tint";
 import { formatColor } from "$lib/automation-dsl/values";
 import NumberInput from "$lib/components/number-input.svelte";
 import FieldError from "$lib/components/field-error.svelte";
 import ExternalChangeBanner from "$lib/components/external-change-banner.svelte";
 import Image from "./image.svelte";
 import { Upload, X, Loader2 } from "@lucide/svelte";
 import { throttle, flushThrottle, type Throttle } from "$lib/throttle";
 import { graphqlErrorMessage } from "$lib/graphql-error";
 import { m } from "$lib/i18n/messages";
 import { locale } from "$lib/i18n/locale.svelte";
 import { formatNumber } from "$lib/i18n/format";

 type Field = AssistantConversationFieldsFragment["forms"][number]["fields"][number];
 let { field, conversationId, onchange, register }: {
  field: Field;
  conversationId: string;
  onchange: (conversation: AssistantConversationFieldsFragment) => void;
  register: (key: string, flush: () => Promise<void>) => () => void;
 } = $props();
 const client = getContextClient();
 const options = $derived(locale.messageOptions());
 const inputId = $props.id();
 let draft = $state<AssistantFieldValueInput>({});
 let revision = 0;
 let dirty = $state(false);
 let saving = $state(false);
 let focused = $state(false);
 let uploading = $state(false);
 let colorOpen = $state(false);
 let error = $state("");
 let conflict = $state(false);
 let fileInput = $state<HTMLInputElement | null>(null);
 const timer: Throttle = { lastSent: 0, trailing: null };
 let pending: Promise<void> | null = null;
 let upload: Promise<void> | null = null;
 $effect(() => {
  const incoming = field;
  const editing = dirty || saving || focused || colorOpen;
  untrack(() => {
   if (!editing) {
    draft = { text: incoming.value.text, number: incoming.value.number, boolean: incoming.value.boolean, attachmentId: incoming.value.attachmentId };
    revision = incoming.revision;
   }
  });
 });
 function change(value: AssistantFieldValueInput) {
  draft = value;
  dirty = true;
  error = "";
  if (!conflict) throttle(timer, () => void save());
 }
 async function drain() {
  saving = true;
  try {
   while (dirty && !conflict) {
    const value = $state.snapshot(draft);
    const expectedRevision = revision;
    dirty = false;
    const result = await client.mutation(CHAT_FIELD_UPDATE, { input: { conversationId, key: field.key, expectedRevision, value } }).toPromise();
    if (result.error || !result.data) {
     dirty = true;
     conflict = result.error?.graphQLErrors.some(e => e.extensions.code === "REVISION_CONFLICT") ?? false;
     throw result.error ?? new Error(m.assistant_error({}, options));
    }
    revision = expectedRevision + 1;
    onchange(result.data.updateAssistantField);
   }
  } catch (e) { error = graphqlErrorMessage(e, m.assistant_error({}, options)); }
  finally { saving = false; }
 }
 function save(): Promise<void> {
  if (pending) return pending;
  if (!dirty || conflict) return Promise.resolve();
  pending = drain().finally(() => { pending = null; });
  return pending;
 }
 async function flush() {
  flushThrottle(timer);
  if (upload) await upload;
  await save();
  if (error || conflict) throw new Error(error || m.editor_changed_elsewhere({}, options));
 }
 $effect(() => register(field.key, flush));
 onDestroy(() => flushThrottle(timer));
 function numeric(value: number | null) {
  if (value != null && field.step) {
   const origin = field.min ?? 0;
   value = origin + Math.round((value - origin) / field.step) * field.step;
   if (field.min != null) value = Math.max(field.min, value);
   if (field.max != null) value = Math.min(field.max, value);
  }
  change(value == null ? {} : { number: value });
 }
 function chooseImage(file: File | undefined) {
  if (!file) return;
  uploading = true;
  error = "";
  upload = uploadAssistantImage(conversationId, file).then(image => { change({ attachmentId: image.id }); }).catch(e => { error = graphqlErrorMessage(e, m.assistant_error({}, options)); }).finally(() => { uploading = false; upload = null; });
 }
 async function reload() {
  const result = await client.query(CHAT_GET, { id: conversationId }, { requestPolicy: "network-only" }).toPromise();
  if (result.error || !result.data) { error = graphqlErrorMessage(result.error, m.assistant_error({}, options)); return; }
  const conversation = result.data.assistantConversation;
  const saved = conversation.forms.flatMap(form => form.fields).find(item => item.key === field.key);
  if (!saved) { error = m.assistant_error({}, options); return; }
  flushThrottle(timer);
  dirty = false;
  conflict = false;
  error = "";
  revision = saved.revision;
  draft = { text: saved.value.text, number: saved.value.number, boolean: saved.value.boolean, attachmentId: saved.value.attachmentId };
  onchange(conversation);
 }

</script>

<div class="min-w-0 space-y-2 {field.kind === 'IMAGE' && draft.attachmentId ? '@sm/chat-form:col-span-2' : ''}" data-chat-field={field.key} aria-busy={saving || uploading} onfocusin={() => focused = true} onfocusout={() => focused = false}>
 <div class="flex min-h-5 items-center justify-between gap-3">
  <label class="text-sm font-medium" for={inputId}>{field.label}</label>
  {#if field.description}<span id={`${inputId}-description`} class="sr-only">{field.description}</span>{/if}
  <div class="flex shrink-0 items-center gap-2">
   <span class="inline-flex size-3 items-center text-muted-foreground">
    {#if saving}<Loader2 class="size-3 animate-spin motion-reduce:animate-none" role="status" aria-label={m.common_saving({}, options)} />{/if}
   </span>
   {#if field.kind === "SLIDER"}<output for={inputId} class="text-sm tabular-nums text-muted-foreground">{formatNumber(draft.number ?? field.min ?? 0, { maximumFractionDigits: 4 })}</output>{/if}
   {#if field.kind === "TOGGLE"}
    <Switch id={inputId} checked={draft.boolean ?? false} onCheckedChange={checked => change({ boolean: checked })} />
   {:else if field.kind === "COLOR"}
    <Popover.Root bind:open={colorOpen} onOpenChange={open => { if (!open) { flushThrottle(timer); void save(); } }}>
     <Popover.Trigger id={inputId}>
      {#snippet child({ props })}
       <Button {...props} variant="ghost" size="icon" class="-my-2" aria-label={field.label}>
        <HiveColorSwatch color={draft.text} />
       </Button>
      {/snippet}
     </Popover.Trigger>
     <Popover.Content class="w-72 p-3" align="end" role="dialog" aria-label={field.label}>
      {#if colorOpen}
       <LightColorPicker color={draft.text ? hexToRgb(draft.text) : null} colorTemp={null} hasColor hasColorTemp={false} hasBrightness={false} oncolorchange={color => change({ text: formatColor(color) })} ontempchange={() => {}} />
      {/if}
     </Popover.Content>
    </Popover.Root>
   {/if}
  </div>
 </div>
 {#if field.kind === "SLIDER"}
  <Slider id={inputId} type="single" aria-label={field.label} aria-describedby={field.description ? `${inputId}-description` : undefined} value={draft.number ?? field.min ?? 0} min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1} onValueChange={value => { draft = { number: value }; dirty = true; }} onValueCommit={value => { change({ number: value }); flushThrottle(timer); void save(); }} />
 {:else if field.kind === "TEXT"}
  <Input id={inputId} value={draft.text ?? ""} maxlength={2000} aria-invalid={!!error} oninput={event => change({ text: event.currentTarget.value })} onblur={() => { flushThrottle(timer); void save(); }} />
 {:else if field.kind === "NUMBER"}
  <NumberInput id={inputId} value={draft.number ?? null} min={field.min ?? undefined} max={field.max ?? undefined} nullable allowDecimal allowNegative ariaLabel={field.label} ariaInvalid={error ? "true" : undefined} onValueChange={numeric} />
 {:else if field.kind === "SELECT"}
  <Select.Root type="single" value={draft.text ?? ""} onValueChange={value => change(value ? { text: value } : {})}>
   <Select.Trigger id={inputId} class="w-full">{draft.text ?? field.label}</Select.Trigger>
   <Select.Content>{#each field.options as option (option)}<Select.Item value={option}>{option}</Select.Item>{/each}</Select.Content>
  </Select.Root>
 {:else if field.kind === "IMAGE"}
  <input bind:this={fileInput} id={inputId} type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" disabled={uploading} onchange={() => { chooseImage(fileInput?.files?.[0]); if (fileInput) fileInput.value = ""; }} />
  <div class="flex flex-wrap items-center gap-2">
   <Button variant="outline" size="sm" disabled={uploading} onclick={() => fileInput?.click()}>{#if uploading}<Loader2 class="size-4 animate-spin motion-reduce:animate-none" />{:else}<Upload class="size-4" />{/if}{m.assistant_upload_image({}, options)}</Button>
   {#if draft.attachmentId}<Button variant="ghost" size="icon-sm" disabled={uploading} aria-label={m.assistant_remove_image({}, options)} onclick={() => change({})}><X class="size-4" /></Button>{/if}
  </div>
  {#if draft.attachmentId}<Image id={draft.attachmentId} name={field.label} />{/if}
 {/if}
 {#if conflict}<ExternalChangeBanner onreload={() => void reload()} />{:else}<FieldError message={error || null} />{/if}
</div>
