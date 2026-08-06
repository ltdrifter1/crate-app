// Transport plane outside React tree state.
// App writes; leaves subscribe. App may subscribe to `track` only —
// never to isPlaying — so play/pause does not re-render Home shelves.

function initialState() {
  return {
    isPlaying: false,
    isBuffering: false,
    trackId: null,
    track: null,
  };
}

function createPlayerTransportStore() {
  let state = initialState();
  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => fn(state));
  }

  function setState(patch) {
    const nextTrack = patch.track !== undefined ? patch.track : state.track;
    const nextTrackId =
      patch.trackId !== undefined
        ? patch.trackId
        : patch.track !== undefined
          ? (patch.track?.id || null)
          : state.trackId;
    const next = {
      isPlaying: patch.isPlaying !== undefined ? !!patch.isPlaying : state.isPlaying,
      isBuffering: patch.isBuffering !== undefined ? !!patch.isBuffering : state.isBuffering,
      trackId: nextTrackId || null,
      track: nextTrack || null,
    };
    if (
      next.isPlaying === state.isPlaying &&
      next.isBuffering === state.isBuffering &&
      next.trackId === state.trackId &&
      next.track === state.track
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
    setTrack(track) {
      setState({ track: track || null, trackId: track?.id || null });
    },
    setTrackId(trackId) {
      setState({ trackId: trackId || null });
    },
    sync({ isPlaying, isBuffering, track, trackId } = {}) {
      setState({
        ...(isPlaying !== undefined ? { isPlaying: !!isPlaying } : {}),
        ...(isBuffering !== undefined ? { isBuffering: !!isBuffering } : {}),
        ...(track !== undefined ? { track: track || null } : {}),
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
