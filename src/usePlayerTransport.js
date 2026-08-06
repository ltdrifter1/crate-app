// React bindings for the transport plane.
// App may subscribe to track only. Leaves that animate on play/pause use useIsPlaying.
// Never subscribe to the full transport snapshot from App root.

import { useSyncExternalStore } from "react";
import { playerTransportStore } from "./lib/playerTransportStore";

export function usePlayerTransport() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    playerTransportStore.getState,
    playerTransportStore.getState
  );
}

export function useCurrentTrack() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    () => playerTransportStore.getState().track,
    () => null
  );
}

export function useIsPlaying() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    () => playerTransportStore.getState().isPlaying,
    () => false
  );
}

export function useIsBuffering() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    () => playerTransportStore.getState().isBuffering,
    () => false
  );
}

export function useTransportTrackId() {
  return useSyncExternalStore(
    playerTransportStore.subscribe,
    () => playerTransportStore.getState().trackId,
    () => null
  );
}

/** Imperative writers for the audio engine / App actions. */
export const transportFlags = {
  setPlaying: (v) => playerTransportStore.setPlaying(v),
  setBuffering: (v) => playerTransportStore.setBuffering(v),
  setTrack: (t) => playerTransportStore.setTrack(t),
  setTrackId: (id) => playerTransportStore.setTrackId(id),
  sync: (patch) => playerTransportStore.sync(patch),
  reset: () => playerTransportStore.reset(),
  getState: () => playerTransportStore.getState(),
  subscribe: (fn) => playerTransportStore.subscribe(fn),
};
