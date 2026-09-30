import { createPlayerPlaybackStore } from "./playerPlaybackStore";

describe("playerPlaybackStore", () => {
  let store;
  beforeEach(() => {
    store = createPlayerPlaybackStore();
  });

  test("starts at zero", () => {
    expect(store.getState()).toEqual({ progress: 0, duration: 0 });
  });

  test("setProgress updates and notifies subscribers", () => {
    const seen = [];
    const un = store.subscribe((s) => seen.push(s.progress));
    store.setProgress(12);
    store.setProgress(12); // no-op — same value
    store.setProgress(13);
    un();
    expect(seen).toEqual([12, 13]);
    expect(store.getState().progress).toBe(13);
  });

  test("setDuration updates independently", () => {
    store.setDuration(240);
    expect(store.getState()).toEqual({ progress: 0, duration: 240 });
  });

  test("setClock can patch both", () => {
    store.setClock({ progress: 30, duration: 180 });
    expect(store.getState()).toEqual({ progress: 30, duration: 180 });
    store.setClock({ progress: 45 });
    expect(store.getState()).toEqual({ progress: 45, duration: 180 });
  });

  test("reset clears clock", () => {
    store.setClock({ progress: 90, duration: 200 });
    store.reset();
    expect(store.getState()).toEqual({ progress: 0, duration: 0 });
  });

  test("clamps negative values to zero", () => {
    store.setProgress(-5);
    store.setDuration(-1);
    expect(store.getState()).toEqual({ progress: 0, duration: 0 });
  });
});
