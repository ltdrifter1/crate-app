import { createPlayerSignalStore } from "./playerSignalStore";

describe("playerSignalStore", () => {
  test("merges signal updates and notifies only on changes", () => {
    const store = createPlayerSignalStore();
    const seen = [];
    const unsubscribe = store.subscribe((state) => seen.push(state.label));

    store.setSignal({ label: "In the groove", momentum: 0.6 });
    store.setSignal({ label: "In the groove", momentum: 0.6 });
    unsubscribe();

    expect(seen).toEqual(["In the groove"]);
    expect(store.getState()).toMatchObject({
      label: "In the groove",
      momentum: 0.6,
      intensity: 0.5,
    });
  });

  test("reset restores the initial signal", () => {
    const store = createPlayerSignalStore();
    store.setSignal({ label: "Cooling off", direction: -0.5 });
    store.reset();

    expect(store.getState()).toEqual({
      intensity: 0.5,
      openness: 0.5,
      momentum: 0,
      depth: 0,
      direction: 0,
      label: "Just started",
    });
  });
});
