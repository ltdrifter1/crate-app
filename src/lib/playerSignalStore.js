// Human-state / "aura" signal outside React tree.
// App writes on play; leaves that show the label subscribe.

function initialState() {
  return {
    intensity: 0.5,
    openness: 0.5,
    momentum: 0,
    depth: 0,
    direction: 0,
    label: "Just started",
  };
}

function createPlayerSignalStore() {
  let state = initialState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setSignal(next) {
      if (!next || typeof next !== "object") return;
      const merged = { ...state, ...next };
      if (
        merged.intensity === state.intensity &&
        merged.openness === state.openness &&
        merged.momentum === state.momentum &&
        merged.depth === state.depth &&
        merged.direction === state.direction &&
        merged.label === state.label
      ) {
        return;
      }
      state = merged;
      emit();
    },
    reset() {
      state = initialState();
      emit();
    },
    _resetForTests() {
      state = initialState();
      emit();
    },
  };
}

export const playerSignalStore = createPlayerSignalStore();
export { createPlayerSignalStore };
