// Player playback clock — progress / duration outside React tree state.
//
// timeupdate fires ~4×/sec; putting that in App useState re-renders the whole
// tree (Home shelves, Library, Search…). Transport UI subscribes via
// useSyncExternalStore; App only writes.

function initialState() {
  return {
    progress: 0,
    duration: 0,
  };
}

function createPlayerPlaybackStore() {
  let state = initialState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  function setState(patch) {
    const nextProgress =
      patch.progress !== undefined ? Math.max(0, Number(patch.progress) || 0) : state.progress;
    const nextDuration =
      patch.duration !== undefined ? Math.max(0, Number(patch.duration) || 0) : state.duration;
    if (nextProgress === state.progress && nextDuration === state.duration) return;
    state = { progress: nextProgress, duration: nextDuration };
    emit();
  }

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setProgress(progress) {
      setState({ progress });
    },
    setDuration(duration) {
      setState({ duration });
    },
    setClock({ progress, duration } = {}) {
      setState({
        ...(progress !== undefined ? { progress } : {}),
        ...(duration !== undefined ? { duration } : {}),
      });
    },
    reset() {
      setState({ progress: 0, duration: 0 });
    },
    /** Test helper — restore pristine state. */
    _resetForTests() {
      state = initialState();
      emit();
    },
  };
}

export const playerPlaybackStore = createPlayerPlaybackStore();
export { createPlayerPlaybackStore };
