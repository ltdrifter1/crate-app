// Transport flags outside React tree state.
// isBuffering used to flip App useState on every waiting/canplay — that
// re-rendered Home shelves. Ambient UI subscribes; App only writes.

function initialState() {
  return {
    isPlaying: false,
    isBuffering: false,
    trackId: null,
  };
}

function createPlayerTransportStore() {
  let state = initialState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  function setState(patch) {
    const next = { ...state, ...patch };
    if (
      next.isPlaying === state.isPlaying &&
      next.isBuffering === state.isBuffering &&
      next.trackId === state.trackId
    ) {
      return;
    }
    state = next;
    emit();
  }

  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    setPlaying(isPlaying) {
      setState({ isPlaying: !!isPlaying });
    },
    setBuffering(isBuffering) {
      setState({ isBuffering: !!isBuffering });
    },
    setTrackId(trackId) {
      setState({ trackId: trackId || null });
    },
    sync({ isPlaying, isBuffering, trackId } = {}) {
      setState({
        ...(isPlaying !== undefined ? { isPlaying: !!isPlaying } : {}),
        ...(isBuffering !== undefined ? { isBuffering: !!isBuffering } : {}),
        ...(trackId !== undefined ? { trackId: trackId || null } : {}),
      });
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

export const playerTransportStore = createPlayerTransportStore();
export { createPlayerTransportStore };
