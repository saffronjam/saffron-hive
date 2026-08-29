// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    interface PageState {
      dashboardRoomId?: string;
      mapRoomId?: string;
      sceneCreateStage?: "start" | "look" | "targets" | "adjust" | "name";
    }
    // interface Platform {}
  }
}

export {};
