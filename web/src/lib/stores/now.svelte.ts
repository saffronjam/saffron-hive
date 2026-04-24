class NowStore {
  current = $state(new Date());

  constructor() {
    if (typeof window === "undefined") return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (intervalId === null) {
        intervalId = setInterval(() => {
          this.current = new Date();
        }, 10_000);
      }
    };
    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stop();
      } else {
        this.current = new Date();
        start();
      }
    });
  }
}

export const nowStore = new NowStore();
