import { afterEach, expect, it, vi } from "vitest";
import { flushSync, mount, unmount } from "svelte";
import CleaningTaskControls from "$lib/components/cleaning-task-controls.svelte";
import CleaningDeviceDetails from "$lib/components/cleaning-device-details.svelte";
import { CleaningAction, type Device } from "$lib/gql/graphql";
import { deviceStore } from "$lib/stores/devices";
import { cleaningStore, type CleaningRobot } from "$lib/stores/cleaning.svelte";
import { createMockClient } from "../helpers/mock-client";

const device = { id:"robot",name:"Vacuum",friendlyName:"Vacuum",type:"vacuum",source:"dreame",available:true,disabled:false,deleted:false,state:{battery:100,cleaningStatus:"docked"} } as Device;
const robot: CleaningRobot = {id:"robot",deviceId:"robot",supported:true,status:"docked",controls:[{action:CleaningAction.Pause,enabled:false},{action:CleaningAction.Dock,enabled:false},{action:CleaningAction.Locate,enabled:true},{action:CleaningAction.EmptyBin,enabled:true}],battery:100,suction:1,water:2,updatedAt:"2026-11-08T12:00:00Z",maps:[],roomLinks:[],consumables:[{name:"filter",percent:79,resettable:true},{name:"sensors",percent:0,resettable:true}]};
let instance: ReturnType<typeof mount>;
let host: HTMLDivElement;
let controls: ReturnType<typeof mount>;
afterEach(async()=>{if(instance)await unmount(instance);if(controls)await unmount(controls);host?.remove();cleaningStore.clear();deviceStore.hydrate([]);});
function render(data=robot){const mock=createMockClient();mock.queueResult({data:{cleaningHistory:[]}});deviceStore.hydrate([device]);host=document.createElement("div");document.body.append(host);instance=mount(CleaningDeviceDetails,{target:host,props:{device,robot:data},context:new Map([["$$_urql",mock.client]])});controls=mount(CleaningTaskControls,{target:host,props:{robot:data,full:true},context:new Map([["$$_urql",mock.client]])});flushSync();return mock;}
it("shows dock state, maintenance and usable supported actions",async()=>{
 const mock=render();await vi.waitFor(()=>expect(host.textContent).toContain("No cleaning history."));
 expect(host.textContent).toContain("Docked");expect(host.textContent).toContain("79%");expect(host.textContent).toContain("Clean sensors");
 const empty=host.querySelector<HTMLButtonElement>('[aria-label="Empty bin"]')!;
 expect(empty.disabled).toBe(false);expect(host.querySelector<HTMLButtonElement>('[aria-label="Return to dock"]')!.disabled).toBe(true);
 mock.queueMutationResult({data:{controlCleaning:true}});mock.queueResult({data:{cleaningDevices:[robot]}});empty.click();
 await vi.waitFor(()=>expect(mock.mutations[0]?.variables).toEqual({deviceId:"robot",action:CleaningAction.EmptyBin}));
});
it("omits unsupported controls and keeps paused job progress",()=>{
 render({...robot,status:"paused",progress:42,controls:[{action:CleaningAction.Resume,enabled:true}],activeTask:{id:"task",deviceId:"robot",mapId:"1",scope:"ROOMS",roomIds:[],state:"paused",origin:"user",createdAt:"2026-11-08T12:00:00Z",updatedAt:"2026-11-08T12:00:00Z"} as CleaningRobot["activeTask"]});
 expect(host.querySelector('[aria-label="Resume"]')).not.toBeNull();expect(host.querySelector('[aria-label="Empty bin"]')).toBeNull();expect(host.querySelector('[aria-label="Locate"]')).toBeNull();expect(host.textContent).toContain("42%");
});
