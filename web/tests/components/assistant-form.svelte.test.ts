import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import ChatForm from "$lib/components/assistant/chat-form.svelte";
import { AssistantFieldKind, type AssistantConversationFieldsFragment } from "$lib/gql/graphql";
vi.mock("@urql/svelte", async original => ({ ...await original<Record<string, unknown>>(), getContextClient: () => ({}) }));
type Form = AssistantConversationFieldsFragment["forms"][number];
let host: HTMLDivElement;
let instance: ReturnType<typeof mount>;
function show(count: number, sections: string[], title = "") {
 const form: Form = { id:"form",runId:"run",title,description:"",revision:1,fields:Array.from({length:count},(_,i)=>({key:`field${i}`,kind:AssistantFieldKind.Text,label:`Field ${i}`,section:sections[i] ?? "",description:"",options:[],revision:1,value:{text:`Value ${i}`}})) };
 host=document.createElement("div");document.body.append(host);
 instance=mount(ChatForm,{target:host,props:{form,conversationId:"chat",onchange:()=>{},register:()=>()=>{}}});
 flushSync();return form;
}
afterEach(async()=>{await unmount(instance);host.remove();});
it("keeps small forms plain and untitled",()=>{
 show(4,["Target","Target","Light","Light"]);
 expect(host.querySelectorAll("h2,h3,[data-chat-section]")).toHaveLength(0);
 expect(host.querySelector("fieldset")?.getAttribute("aria-label")).toBe("Chat controls");
 expect(host.querySelectorAll("input")).toHaveLength(4);
});
it("shows meaningful sections in large forms",()=>{
 show(8,["Target","Target","Light","Light","Movement","Movement","Save","Save"]);
 expect([...host.querySelectorAll("[data-chat-section] h2")].map(el=>el.textContent)).toEqual(["Target","Light","Movement","Save"]);
 expect(host.querySelectorAll("h3")).toHaveLength(0);
 expect([...host.querySelectorAll("input")].map(el=>el.value)).toEqual(Array.from({length:8},(_,i)=>`Value ${i}`));
});
it("uses plain dividers for intermediate forms and retains a meaningful title",()=>{
 show(6,["Light","Light","Light","Movement","Movement","Movement"],"Bedroom · evening");
 expect(host.querySelector("h3")?.textContent).toBe("Bedroom · evening");
 expect(host.querySelectorAll("[data-chat-section]")).toHaveLength(1);
 expect(host.querySelectorAll("h2")).toHaveLength(0);
});

it("breaks a large ungrouped form into readable blocks without inventing headings",()=>{
 show(12,[]);
 expect(host.querySelectorAll("[data-chat-section]")).toHaveLength(2);
 expect(host.querySelectorAll("h2,h3")).toHaveLength(0);
 expect(host.querySelectorAll("input")).toHaveLength(12);
});
