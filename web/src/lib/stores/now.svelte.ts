class NowStore {
  current = $state(new Date());

  constructor() {
    if (typeof window !== "undefined") {
      setInterval(() => {
        this.current = new Date();
      }, 10_000);
    }
  }
}

export const nowStore = new NowStore();
